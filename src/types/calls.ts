export interface IncomingCallPushPayload {
  type: 'incoming_call';

  callId: string;

  callerId: string;

  calleeId: string;

  callerName: string;

  avatar?: string;

  roomId: string;

  hasVideo: 'true' | 'false';

  timestamp: string;

  rtcToken?: string;
}

export interface CallAcceptedPayload {
  type: 'call_accepted';

  callId: string;

  roomId: string;

  acceptedBy: string;
}

export interface CallEndedPayload {
  type: 'call_ended';

  callId: string;

  reason: 'rejected' | 'missed' | 'ended' | 'timeout';
}
