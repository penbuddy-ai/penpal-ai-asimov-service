import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";

import { LoggerService } from "../../common/services/logger.service";
import { HealthService } from "./health.service";

describe("healthService", () => {
  let service: HealthService;
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const mockHttpService = {
      get: jest.fn(),
    };

    const mockLogger = {
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    configService = module.get(ConfigService);
    httpService = module.get(HttpService);
    logger = module.get(LoggerService);

    // Setup default config values
    configService.get.mockImplementation((key: string, defaultValue?: any) => {
      switch (key) {
        case "NODE_ENV":
          return "test";
        case "SERVICE_NAME":
          return defaultValue || "ai-service";
        case "DB_SERVICE_URL":
          return "http://localhost:3001/api/v1";
        case "OPENAI_API_KEY":
          return "test-key";
        case "REDIS_HOST":
          return "localhost";
        default:
          return defaultValue;
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getHealthStatus", () => {
    beforeEach(() => {
      httpService.get.mockReturnValue(of({ status: 200, data: {} } as any));
    });

    it("should return health status with correct format", async () => {
      const result = await service.getHealthStatus();

      expect(result).toEqual({
        status: "ok",
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        service: "ai-service",
        version: "1.0.0",
        environment: "test",
        dependencies: {
          database: "ok",
          redis: "ok",
          openai: "ok",
        },
      });
    });

    it("should return current timestamp in ISO format", async () => {
      const result = await service.getHealthStatus();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it("should return uptime as positive number", async () => {
      // Ajouter un petit délai pour que l'uptime soit > 0
      await new Promise(resolve => setTimeout(resolve, 1));

      const result = await service.getHealthStatus();

      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it("should use custom service name from config", async () => {
      configService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === "SERVICE_NAME")
          return "custom-service";
        return defaultValue || "default-value";
      });

      const result = await service.getHealthStatus();

      expect(result.service).toBe("custom-service");
    });

    it("should use production environment", async () => {
      configService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === "NODE_ENV")
          return "production";
        return defaultValue || "default-value";
      });

      const result = await service.getHealthStatus();

      expect(result.environment).toBe("production");
    });
  });

  describe("getReadinessStatus", () => {
    beforeEach(() => {
      httpService.get.mockReturnValue(of({ status: 200, data: {} } as any));
    });

    it("should return ready when all dependencies are ok", async () => {
      const result = await service.getReadinessStatus();

      expect(result).toEqual({
        status: "ready",
        timestamp: expect.any(String),
        dependencies: {
          database: "ok",
          redis: "ok",
          openai: "ok",
        },
      });
    });

    it("should return not ready when some dependencies fail", async () => {
      httpService.get.mockReturnValue(throwError(() => new Error("Connection failed")));

      const result = await service.getReadinessStatus();

      expect(result.status).toBe("not ready");
      expect(result.dependencies.database).toBe("error");
    });

    it("should return not ready when DB service is not configured", async () => {
      configService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === "DB_SERVICE_URL")
          return undefined;
        return defaultValue || "default-value";
      });

      const result = await service.getReadinessStatus();

      expect(result.status).toBe("not ready");
      expect(result.dependencies.database).toBe("not configured");
    });
  });

  describe("getLivenessStatus", () => {
    it("should always return alive", async () => {
      const result = await service.getLivenessStatus();

      expect(result).toEqual({
        status: "alive",
        timestamp: expect.any(String),
      });
    });

    it("should return current timestamp", async () => {
      const result = await service.getLivenessStatus();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });

  describe("checkDbService", () => {
    it("should return ok when DB service is healthy", async () => {
      httpService.get.mockReturnValue(of({ status: 200, data: {} } as any));

      const result = await (service as any).checkDbService();

      expect(result).toBe("ok");
      expect(httpService.get).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/health",
        { timeout: 5000 },
      );
    });

    it("should return error when DB service is unreachable", async () => {
      httpService.get.mockReturnValue(throwError(() => new Error("Connection failed")));

      const result = await (service as any).checkDbService();

      expect(result).toBe("error");
      expect(logger.warn).toHaveBeenCalledWith(
        "DB Service health check failed",
        expect.any(Error),
      );
    });

    it("should return not configured when DB_SERVICE_URL is missing", async () => {
      configService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === "DB_SERVICE_URL")
          return undefined;
        return defaultValue;
      });

      const result = await (service as any).checkDbService();

      expect(result).toBe("not configured");
    });

    it("should return error when DB service returns non-200 status", async () => {
      httpService.get.mockReturnValue(of({ status: 500, data: {} } as any));

      const result = await (service as any).checkDbService();

      expect(result).toBe("error");
    });
  });

  describe("checkRedis", () => {
    it("should return ok when Redis is configured", async () => {
      const result = await (service as any).checkRedis();

      expect(result).toBe("ok");
    });

    it("should return not configured when REDIS_HOST is missing", async () => {
      configService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === "REDIS_HOST")
          return undefined;
        return defaultValue;
      });

      const result = await (service as any).checkRedis();

      expect(result).toBe("not configured");
    });
  });

  describe("checkOpenAI", () => {
    it("should return ok when OpenAI API key is configured", async () => {
      const result = await (service as any).checkOpenAI();

      expect(result).toBe("ok");
    });

    it("should return not configured when OPENAI_API_KEY is missing", async () => {
      configService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === "OPENAI_API_KEY")
          return undefined;
        return defaultValue;
      });

      const result = await (service as any).checkOpenAI();

      expect(result).toBe("not configured");
    });
  });
});
