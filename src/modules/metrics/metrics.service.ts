import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private readonly configService: ConfigService) {}

  async getMetricsSummary() {
    try {
      const summary = {
        timestamp: new Date().toISOString(),
        service: "ai-service",
        version: "1.0.0",
        environment: this.configService.get("NODE_ENV", "development"),
        metrics: {
          requests: {
            description: "AI API requests metrics",
            endpoints: [
              "/ai/chat",
              "/ai/tutor",
              "/ai/conversation-partner",
              "/ai/analyze",
              "/ai/conversation-starters",
            ],
          },
          tokens: {
            description: "Token consumption tracking",
            providers: ["openai", "claude"],
            models: ["gpt-4o-mini", "claude-3-haiku"],
          },
          costs: {
            description: "AI usage costs in USD",
            tracking: ["per_user", "per_model", "per_provider"],
          },
          business: {
            description: "Business metrics",
            metrics: [
              "conversations_created",
              "messages_processed",
              "cache_hit_ratio",
              "active_connections",
            ],
          },
        },
        configuration: {
          default_model: this.configService.get("OPENAI_DEFAULT_MODEL"),
          max_tokens: this.configService.get("OPENAI_MAX_TOKENS"),
          temperature: this.configService.get("OPENAI_TEMPERATURE"),
          cache_ttl: this.configService.get("REDIS_TTL"),
        },
      };

      return summary;
    }
    catch (error) {
      this.logger.error("Error generating metrics summary:", error);
      throw error;
    }
  }

  async getAIUsageStats() {
    // Cette méthode pourrait être étendue pour récupérer des stats de la DB
    return {
      total_conversations: 0,
      total_messages: 0,
      average_tokens_per_message: 0,
      most_used_language: "unknown",
      most_used_level: "unknown",
    };
  }
}
