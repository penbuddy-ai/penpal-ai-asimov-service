import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { HealthService } from "./health.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Check service health status" })
  @ApiResponse({
    status: 200,
    description: "Service is healthy",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "ok" },
        timestamp: { type: "string", example: "2024-01-01T00:00:00.000Z" },
        uptime: { type: "number", example: 12345 },
        service: { type: "string", example: "ai-service" },
        version: { type: "string", example: "1.0.0" },
        environment: { type: "string", example: "development" },
        dependencies: {
          type: "object",
          properties: {
            database: { type: "string", example: "ok" },
            redis: { type: "string", example: "ok" },
            openai: { type: "string", example: "ok" },
          },
        },
      },
    },
  })
  async getHealth() {
    return this.healthService.getHealthStatus();
  }

  @Get("ready")
  @ApiOperation({ summary: "Check if service is ready to accept requests" })
  @ApiResponse({
    status: 200,
    description: "Service is ready",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "ready" },
        timestamp: { type: "string", example: "2024-01-01T00:00:00.000Z" },
      },
    },
  })
  async getReadiness() {
    return this.healthService.getReadinessStatus();
  }

  @Get("live")
  @ApiOperation({ summary: "Check if service is alive" })
  @ApiResponse({
    status: 200,
    description: "Service is alive",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "alive" },
        timestamp: { type: "string", example: "2024-01-01T00:00:00.000Z" },
      },
    },
  })
  async getLiveness() {
    return this.healthService.getLivenessStatus();
  }
}
