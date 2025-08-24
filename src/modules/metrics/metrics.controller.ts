import { Controller, Get, Header } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { MetricsService } from "./metrics.service";
import { PrometheusService } from "./prometheus.service";

@ApiTags("metrics")
@Controller()
export class MetricsController {
  constructor(
    private readonly prometheusService: PrometheusService,
    private readonly metricsService: MetricsService,
  ) {}

  @Get("metrics")
  @Header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
  @ApiOperation({ summary: "Get Prometheus metrics for AI service" })
  @ApiResponse({ status: 200, description: "Prometheus metrics returned" })
  async getMetrics(): Promise<string> {
    return this.prometheusService.getMetrics();
  }

  @Get("metrics/summary")
  @ApiOperation({ summary: "Get AI service metrics summary" })
  @ApiResponse({ status: 200, description: "Metrics summary retrieved" })
  async getMetricsSummary() {
    return this.metricsService.getMetricsSummary();
  }
}
