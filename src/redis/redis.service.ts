import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  public redis: Redis;

  // redisUrl = process.env.REDIS_URL as string;
  redisHost = process.env.REDIS_HOST as string;
  redisPort = Number(process.env.REDIS_PORT as string);

  constructor() {
    // this.redis = new Redis(this.redisUrl);
    this.redis = new Redis({
      host: this.redisHost,
      port: this.redisPort,
    });
  }
}
