import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateIf,
} from 'class-validator';

export class InitiateCallDto {
  @IsString()
  @IsNotEmpty()
  callId!: string;

  @IsString()
  @IsNotEmpty()
  callerId!: string;

  @IsString()
  @IsNotEmpty()
  calleeId!: string;

  @IsEnum(['audio', 'video'])
  callType!: 'audio' | 'video';
}

export class AcceptCallDto {
  @IsString()
  @IsNotEmpty()
  callId!: string;
}

export class WebRTCSignalDto {
  @IsString()
  @IsNotEmpty()
  to!: string;

  @IsString()
  @IsNotEmpty()
  from!: string;

  @IsString()
  @IsNotEmpty()
  callId!: string;

  @IsEnum(['offer', 'answer', 'candidate'])
  type!: 'offer' | 'answer' | 'candidate';

  @ValidateIf((o) => o.type === 'offer' || o.type === 'answer')
  @IsNotEmpty()
  sdp?: RTCSessionDescriptionInit;

  @ValidateIf((o) => o.type === 'candidate')
  @IsNotEmpty()
  candidate?: RTCIceCandidateInit;
}

export class EndCallDto {
  @IsString()
  @IsNotEmpty()
  callId!: string;

  @IsEnum(['ended', 'rejected', 'missed', 'timeout'])
  reason!: 'ended' | 'rejected' | 'missed' | 'timeout';
}

export class SwitchToVideoCallDto {
  @IsString()
  @IsNotEmpty()
  callId!: string;

  @IsString()
  @IsNotEmpty()
  to!: string;
}
