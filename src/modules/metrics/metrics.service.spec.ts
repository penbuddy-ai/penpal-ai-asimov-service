import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";

import { MetricsService } from "./metrics.service";

describe("metrics service", () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue?: any) => {
              if (key === "NODE_ENV")
                return defaultValue ?? "development";
              return undefined;
            },
          },
        },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("getMetricsSummary returns a summary object with expected keys", async () => {
    const summary = await service.getMetricsSummary();
    expect(summary).toHaveProperty("timestamp");
    expect(summary).toHaveProperty("service", "ai-service");
    expect(summary).toHaveProperty("metrics");
    expect(summary).toHaveProperty("configuration");
    expect(summary.configuration).toHaveProperty("cache_ttl");
  });

  it("getAIUsageStats returns default zeroed stats", async () => {
    const stats = await service.getAIUsageStats();
    expect(stats).toEqual({
      total_conversations: 0,
      total_messages: 0,
      average_tokens_per_message: 0,
      most_used_language: "unknown",
      most_used_level: "unknown",
    });
  });
});
