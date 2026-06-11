// src/modules/calls/calls.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { Server } from 'socket.io';

import {
  AcceptCallPayload,
  EndCallPayload,
  InitiateCallPayload,
  SwitchToVideoCallPayload,
  WebRTCSignalPayload,
} from './interfaces/payloads.interface';

import { CallSession } from './interfaces/call-session.interface';
import { FirebaseService } from 'src/firebase/firebase.service';
import { RedisService } from 'src/redis/redis.service';
import { generateRandomNumber } from 'src/libs';

@Injectable()
export class CallsService {
  private server!: Server;

  constructor(
    private redisService: RedisService,
    private firebaseService: FirebaseService,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  async registerUser(userId: string, socketId: string) {
    const redis = this.redisService.redis;

    await redis.set(`user:${userId}:socket`, socketId);

    await redis.set(`user:${userId}:status`, 'online');
  }

  async unregisterUser(userId: string) {
    const redis = this.redisService.redis;

    await redis.del(`user:${userId}:socket`);

    await redis.set(`user:${userId}:status`, 'offline');
  }

  private scheduleCallTimeout({
    callId,
    callerName,
    callerSocketId,
    calleeSocketId,
  }: {
    callId: string;
    callerName: string;
    callerSocketId: string | null;
    calleeSocketId: string | null;
  }) {
    setTimeout(async () => {
      const redis = this.redisService.redis;

      const sessionData = await redis.get(`call:${callId}`);

      if (!sessionData) return;

      const session: CallSession = JSON.parse(sessionData);

      if (session.status !== 'ringing') return;

      session.status = 'timeout';

      const payload = {
        ...session,
        callerName,
        reason: 'timeout',
      };

      if (calleeSocketId) {
        this.server.to(calleeSocketId).emit('call:timeout', payload);
      }

      if (callerSocketId) {
        this.server.to(callerSocketId).emit('call:timeout', payload);
      }

      await this.endCall({
        callId,
        reason: 'timeout',
      });
    }, 30_000);
  }

  async initiateCall(payload: InitiateCallPayload) {
    const redis = this.redisService.redis;

    const { callerId, calleeId, callType, callId = uuidv4() } = payload;

    const roomId = `RM-${generateRandomNumber({ length: 30 })}`;

    // TODO: Fetch from DB
    const callerName = 'John Doe';
    const calleeName = 'Kelly John';

    const activeCallKey = `user:${calleeId}:activeCall`;

    const existingCall = await redis.get(activeCallKey);

    if (existingCall) {
      throw new BadRequestException('User already in another call');
    }

    const callSession: CallSession = {
      callId,
      roomId,
      callerId,
      calleeId,
      callType,
      status: 'ringing',
      startedAt: Date.now(),
    };

    await Promise.all([
      redis.set(`call:${callId}`, JSON.stringify(callSession)),
      redis.set(`user:${callerId}:activeCall`, callId),
      redis.set(`user:${calleeId}:activeCall`, callId),
    ]);

    const [calleeStatus, calleeSocketId, callerSocketId] = await Promise.all([
      redis.get(`user:${calleeId}:status`),
      redis.get(`user:${calleeId}:socket`),
      redis.get(`user:${callerId}:socket`),
    ]);

    this.scheduleCallTimeout({
      callId,
      callerName,
      callerSocketId,
      calleeSocketId,
    });

    if (calleeStatus === 'online' && calleeSocketId) {
      this.server.to(calleeSocketId).emit('call:incoming', {
        ...callSession,
        callerName,
      });

      return;
    }

    const token = await redis.get(`user:${calleeId}:fcmToken`);

    if (!token) {
      throw new BadRequestException('User has no push token');
    }

    await this.firebaseService.sendIncomingCallPush(token, {
      type: 'incoming_call',
      callId,
      roomId,
      callerId,
      calleeId,
      callerName,
      calleeName,
      callType,
      timestamp: Date.now().toString(),
    });
  }

  async acceptCall(payload: AcceptCallPayload) {
    const redis = this.redisService.redis;

    const { callId } = payload;

    const sessionData = await redis.get(`call:${callId}`);

    if (!sessionData) {
      throw new BadRequestException('Call session expired');
    }

    const session: CallSession = JSON.parse(sessionData);

    session.status = 'active';

    const callerId = session.callerId;
    const calleeId = session.calleeId;

    session.answeredAt = Date.now();

    // Set call session

    await Promise.all([
      await redis.set(`call:${callId}`, JSON.stringify(session)),
      await redis.set(`user:${callerId}:activeCall`, JSON.stringify(callerId)),
      await redis.set(`user:${calleeId}:activeCall`, JSON.stringify(calleeId)),
    ]);

    const callerSocketId = await redis.get(`user:${session.callerId}:socket`);

    if (callerSocketId) {
      this.server.to(callerSocketId).emit('call:accepted', {
        callId,
        calleeId,
        callerId,
      });
    }
  }

  async relaySignal(payload: WebRTCSignalPayload) {
    const redis = this.redisService.redis;

    const sessionData = await redis.get(`call:${payload.callId}`);

    if (!sessionData) {
      throw new BadRequestException('Call session expired');
    }

    const socketId = await redis.get(`user:${payload.to}:socket`);

    if (!socketId) return;

    const senderSocketId = await redis.get(`user:${payload.from}:socket`);
    if (senderSocketId === socketId) {
      return;
    }

    this.server.to(socketId).emit('webrtc:signal', payload);
  }

  async endCall(payload: EndCallPayload) {
    const redis = this.redisService.redis;

    const sessionData = await redis.get(`call:${payload.callId}`);

    if (!sessionData) return;

    const session: CallSession = JSON.parse(sessionData);

    session.status = payload.reason;

    session.endedAt = Date.now();

    const [callerSocketId, calleeSocketId] = await Promise.all([
      await redis.get(`user:${session.callerId}:socket`),
      await redis.get(`user:${session.calleeId}:socket`),
    ]);

    if (callerSocketId) {
      this.server.to(callerSocketId).emit('call:ended', payload);
    }

    if (calleeSocketId) {
      this.server.to(calleeSocketId).emit('call:ended', payload);
    }

    // cleanup active call markers
    await Promise.all([
      await redis.del(`user:${session.callerId}:activeCall`),
      await redis.del(`user:${session.calleeId}:activeCall`),
      redis.del(`call:${payload.callId}`),
    ]);
  }

  async switchCallToVideo(payload: SwitchToVideoCallPayload) {
    const redis = this.redisService.redis;

    const toSocketId = await redis.get(`user:${payload.to}:socket`);

    if (toSocketId) {
      this.server.to(toSocketId).emit('call:requesting-video', payload);
    }
  }
}
