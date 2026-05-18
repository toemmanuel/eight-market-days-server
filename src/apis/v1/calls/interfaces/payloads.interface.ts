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

// export interface WebRTCSignalPayload {
//   to: string;

//   callId: string;

//   type: 'offer' | 'answer' | 'candidate';

//   sdp?: any;

//   candidate?: any;
// }

export interface WebRTCSignalPayload {
  to: string;

  callId: string;

  type: 'offer' | 'answer' | 'candidate';

  sdp?: any;

  candidate?: any;
}
