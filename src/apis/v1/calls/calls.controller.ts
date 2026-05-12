import { Body, Controller, Post } from '@nestjs/common';
import { CallsService } from './calls.service';
import { AcceptCallDto, EndCallDto, InitiateCallDto } from './call.dto';

@Controller('api/v1/calls')
export class CallsController {
  constructor(private callsService: CallsService) {}

  @Post('initiate')
  async initiateCall(@Body() body: InitiateCallDto) {
    return this.callsService.initiateCall(body);
  }

  @Post('accept')
  async acceptCall(@Body() body: AcceptCallDto) {
    return this.callsService.acceptCall(body);
  }

  @Post('end')
  async endCall(@Body() body: EndCallDto) {
    return this.callsService.endCall(body);
  }
}
