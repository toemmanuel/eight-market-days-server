import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Socket, Server } from 'socket.io';

import { CallsService } from './calls.service';
import {
  AcceptCallDto,
  EndCallDto,
  InitiateCallDto,
  SwitchToVideoCallDto,
  WebRTCSignalDto,
} from './call.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private callsService: CallsService) {}

  afterInit() {
    this.callsService.setServer(this.server);
  }

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (!userId) {
      client.disconnect();
      return;
    }

    await this.callsService.registerUser(userId, client.id);
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (!userId) return;

    await this.callsService.unregisterUser(userId);
  }

  @SubscribeMessage('call:initiate')
  async initiate(@MessageBody() body: InitiateCallDto) {
    return this.callsService.initiateCall(body);
  }

  @SubscribeMessage('call:accept')
  async accept(@MessageBody() body: AcceptCallDto) {
    return this.callsService.acceptCall(body);
  }

  @SubscribeMessage('call:end')
  async end(@MessageBody() body: EndCallDto) {
    return this.callsService.endCall(body);
  }

  @SubscribeMessage('call:request-video')
  async switchToVideo(@MessageBody() body: SwitchToVideoCallDto) {
    return this.callsService.switchCallToVideo(body);
  }

  @SubscribeMessage('webrtc:signal')
  async signal(@MessageBody() body: WebRTCSignalDto) {
    return this.callsService.relaySignal(body);
  }
}
