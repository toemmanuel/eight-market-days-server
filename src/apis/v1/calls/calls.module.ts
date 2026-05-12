import { Module } from '@nestjs/common';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { RedisService } from 'src/redis/redis.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CallsGateway } from './calls.gateway';

@Module({
  // imports: [FirebaseService],
  controllers: [CallsController],
  providers: [CallsService, RedisService, FirebaseService, CallsGateway],
})
export class CallsModule {}
