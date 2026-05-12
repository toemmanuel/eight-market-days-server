export interface CallSession {
  callId: string;

  roomId: string;

  callerId: string;

  calleeId: string;

  status: 'ringing' | 'active' | 'ended' | 'missed' | 'rejected' | 'timeout';

  callType: 'audio' | 'video';

  startedAt: number;

  answeredAt?: number;

  endedAt?: number;
}
