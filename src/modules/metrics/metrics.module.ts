import { Module } from "@nestjs/common";

import { CommonModule } from "../../common/common.module";
import { MetricsInterceptor } from "../../common/interceptors/metrics.interceptor";
import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";
import { PrometheusService } from "./prometheus.service";

@Module({
  imports: [CommonModule],
  controllers: [MetricsController],
  providers: [MetricsService, PrometheusService, MetricsInterceptor],
  exports: [MetricsService, PrometheusService, MetricsInterceptor],
})
export class MetricsModule {}
