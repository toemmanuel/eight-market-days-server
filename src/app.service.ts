import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'Eight Market Days Apis',
      status: 'success',
    };
  }
}
