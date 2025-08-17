import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";

import { CommonModule } from "./common/common.module";
import { AIProvidersModule } from "./modules/ai-providers/ai-providers.module";
import { CacheModule } from "./modules/cache/cache.module";
import { ConversationsModule } from "./modules/conversations/conversations.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    // Cache Module (Redis avec fallback memory)
    CacheModule,

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get("RATE_LIMIT_TTL", 60),
        limit: configService.get("RATE_LIMIT_LIMIT", 100),
      }),
    }),

    // Modules applicatifs
    CommonModule,
    HealthModule,
    ConversationsModule,
    AIProvidersModule,
  ],
})
export class AppModule {}
