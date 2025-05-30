import { CacheModule as NestCacheModule } from "@nestjs/cache-manager";
import { Global, Injectable, Logger, Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

/**
 * Service to log Redis configuration and handle connection status
 */
@Injectable()
export class RedisCacheHealthService implements OnModuleInit {
  private readonly logger = new Logger("RedisCache");

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const host = this.configService.get<string>("REDIS_HOST") || "localhost";
      const port = this.configService.get<number>("REDIS_PORT") || 6379;
      const ttl = this.configService.get<number>("REDIS_TTL") || 3600;

      this.logger.log(`🔧 Cache configuration: host=${host}, port=${port}, TTL=${ttl}s`);
      this.logger.log("🚀 Cache service initialized (using memory store temporarily)");
    }
    catch (error) {
      this.logger.error(`❌ Error initializing cache service: ${error.message}`);
    }
  }
}

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger("CacheConfig");
        const ttl = configService.get<number>("REDIS_TTL") || 3600;

        logger.log(`Configuring cache with TTL=${ttl}s (memory store)`);

        return {
          ttl: ttl * 1000, // Convert to milliseconds
          max: 1000,
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  providers: [RedisCacheHealthService],
  exports: [NestCacheModule, RedisCacheHealthService],
})
export class CacheModule {}
