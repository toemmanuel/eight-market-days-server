// src/modules/calls/calls.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { Server } from 'socket.io';

import {
  AcceptCallPayload,
  EndCallPayload,
  InitiateCallPayload,
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

  async initiateCall(payload: InitiateCallPayload) {
    const redis = this.redisService.redis;

    const { callerId, calleeId, callType, callId = uuidv4() } = payload;

    // Use callerId, get Caller details from DB

    const roomId = `RM-${generateRandomNumber({ length: 30 })}`;
    const callerName = 'John Doe'; // Name from DB

    const existingCallee = await redis.get(`user:${calleeId}:activeCall`);

    if (existingCallee) {
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

    await redis.set(`call:${callId}`, JSON.stringify(callSession));

    // Auto-expire after 60s
    await redis.expire(`call:${callId}`, 60);
    await redis.expire(`user:${callerId}:activeCall`, 60);
    await redis.expire(`user:${calleeId}:activeCall`, 60);

    const calleeStatus = await redis.get(`user:${calleeId}:status`);

    const calleeSocketId = await redis.get(`user:${calleeId}:socket`);

    if (calleeStatus === 'online' && calleeSocketId) {
      this.server
        .to(calleeSocketId)
        .emit('call:incoming', { ...callSession, callerName });

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

    session.answeredAt = Date.now();

    // Set call session

    await redis.set(`call:${callId}`, JSON.stringify(session));

    const callerSocketId = await redis.get(`user:${session.callerId}:socket`);

    if (callerSocketId) {
      this.server.to(callerSocketId).emit('call:accepted', {
        callId,
      });
    }
  }

  async relaySignal(payload: WebRTCSignalPayload) {
    const redis = this.redisService.redis;

    const socketId = await redis.get(`user:${payload.to}:socket`);

    if (!socketId) return;

    this.server.to(socketId).emit('webrtc:signal', payload);
  }

  async endCall(payload: EndCallPayload) {
    const redis = this.redisService.redis;

    const sessionData = await redis.get(`call:${payload.callId}`);

    if (!sessionData) return;

    const session: CallSession = JSON.parse(sessionData);

    session.status = payload.reason;

    session.endedAt = Date.now();

    const callerSocketId = await redis.get(`user:${session.callerId}:socket`);

    const calleeSocketId = await redis.get(`user:${session.calleeId}:socket`);

    if (callerSocketId) {
      this.server.to(callerSocketId).emit('call:ended', payload);
    }

    if (calleeSocketId) {
      this.server.to(calleeSocketId).emit('call:ended', payload);
    }

    // cleanup active call markers
    await redis.del(`user:${session.callerId}:activeCall`);

    await redis.del(`user:${session.calleeId}:activeCall`);

    // cleanup call
    await redis.del(`call:${payload.callId}`);
  }
}
