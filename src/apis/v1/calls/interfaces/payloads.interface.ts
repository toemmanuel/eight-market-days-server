export interface InitiateCallPayload {
  callerId: string;

  callId: string;

  calleeId: string;

  callType: 'audio' | 'video';
}

export interface AcceptCallPayload {
  callId: string;
}

export interface EndCallPayload {
  callId: string;

  reason: 'ended' | 'rejected' | 'missed' | 'timeout';
}

export interface SwitchToVideoCallPayload {
  callId: string;

  to: string;
}

export interface WebRTCSignalPayload {
  to: string; // Recipient

  from: string; // Sender - ADD THIS

  callId: string;

  type: 'offer' | 'answer' | 'candidate';

  sdp?: any;

  candidate?: any;
}
