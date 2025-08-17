import { Test, TestingModule } from "@nestjs/testing";

import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";
import { PrometheusService } from "./prometheus.service";

describe("metrics controller", () => {
  let controller: MetricsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: PrometheusService,
          useValue: { getMetrics: jest.fn().mockResolvedValue("ok") },
        },
        {
          provide: MetricsService,
          useValue: {
            getMetricsSummary: jest
              .fn()
              .mockResolvedValue({ service: "ai-service" }),
          },
        },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("getMetrics returns text", async () => {
    const res = await controller.getMetrics();
    expect(res).toBe("ok");
  });

  it("getMetricsSummary returns object", async () => {
    const res = await controller.getMetricsSummary();
    expect(res).toHaveProperty("service", "ai-service");
  });
});
