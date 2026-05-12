import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CallsModule } from './apis/v1/calls/calls.module';
import { FirebaseService } from './firebase/firebase.service';
import { RedisService } from './redis/redis.service';
import { RedisModule } from './redis/redis.module';
import { CallsGateway } from './apis/v1/calls/calls.gateway';

@Module({
  imports: [CallsModule, RedisModule],
  controllers: [AppController],
  providers: [RedisService, AppService, FirebaseService],
})
export class AppModule {}
