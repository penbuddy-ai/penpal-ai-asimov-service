import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

import { LoggerService } from "../../common/services/logger.service";

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
  ) {}

  async getHealthStatus() {
    const dependencies = await this.checkDependencies();
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;

    return {
      status: "ok",
      timestamp,
      uptime,
      service: this.configService.get("SERVICE_NAME", "ai-service"),
      version: "1.0.0",
      environment: this.configService.get("NODE_ENV", "development"),
      dependencies,
    };
  }

  async getReadinessStatus() {
    const dependencies = await this.checkDependencies();
    const isReady = Object.values(dependencies).every(status => status === "ok");

    return {
      status: isReady ? "ready" : "not ready",
      timestamp: new Date().toISOString(),
      dependencies,
    };
  }

  async getLivenessStatus() {
    return {
      status: "alive",
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDependencies() {
    const results = await Promise.allSettled([
      this.checkDbService(),
      this.checkRedis(),
      this.checkOpenAI(),
    ]);

    return {
      database: results[0].status === "fulfilled" ? results[0].value : "error",
      redis: results[1].status === "fulfilled" ? results[1].value : "error",
      openai: results[2].status === "fulfilled" ? results[2].value : "error",
    };
  }

  private async checkDbService(): Promise<string> {
    try {
      const dbServiceUrl = this.configService.get("DB_SERVICE_URL");
      if (!dbServiceUrl)
        return "not configured";

      const response = await firstValueFrom(
        this.httpService.get(`${dbServiceUrl}/health`, {
          timeout: 5000,
        }),
      );

      return response.status === 200 ? "ok" : "error";
    }
    catch (error) {
      this.logger.warn("DB Service health check failed", error);
      return "error";
    }
  }

  private async checkRedis(): Promise<string> {
    try {
      const redisHost = this.configService.get("REDIS_HOST");
      if (!redisHost)
        return "not configured";

      // Simple check - in a real implementation, you'd use a Redis client
      return "ok";
    }
    catch (error) {
      this.logger.warn("Redis health check failed", error);
      return "error";
    }
  }

  private async checkOpenAI(): Promise<string> {
    try {
      const openaiApiKey = this.configService.get("OPENAI_API_KEY");
      if (!openaiApiKey)
        return "not configured";

      // Simple check - in a real implementation, you'd test the OpenAI API
      return "ok";
    }
    catch (error) {
      this.logger.warn("OpenAI health check failed", error);
      return "error";
    }
  }
}
