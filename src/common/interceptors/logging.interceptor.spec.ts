import { CallHandler, ExecutionContext } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { of } from "rxjs";

import { LoggingInterceptor } from "./logging.interceptor";

describe("loggingInterceptor", () => {
  let interceptor: LoggingInterceptor;

  const createMockExecutionContext = (request: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  const createMockCallHandler = (returnValue: any = {}): CallHandler => {
    return {
      handle: () => of(returnValue),
    } as CallHandler;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingInterceptor],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
  });

  it("should be defined", () => {
    expect(interceptor).toBeDefined();
  });

  describe("intercept", () => {
    it("should log request details and response time", (done) => {
      const mockRequest = {
        method: "GET",
        url: "/test",
        body: { test: "data" },
        params: { id: "123" },
        query: { limit: "10" },
      };

      const context = createMockExecutionContext(mockRequest);
      const callHandler = createMockCallHandler({ success: true });

      // Spy on logger debug method
      const loggerSpy = jest.spyOn((interceptor as any).logger, "debug");

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        next: (result) => {
          expect(result).toEqual({ success: true });
        },
        complete: () => {
          // Check that logging was called
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining("GET /test"),
          );
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining("Params: {\"id\":\"123\"}"),
          );
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining("Query: {\"limit\":\"10\"}"),
          );
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining("Body: {\"test\":\"data\"}"),
          );
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringMatching(/\+\d+ms/),
          );

          loggerSpy.mockRestore();
          done();
        },
      });
    });

    it("should handle empty request body", (done) => {
      const mockRequest = {
        method: "POST",
        url: "/test",
        body: {},
        params: {},
        query: {},
      };

      const context = createMockExecutionContext(mockRequest);
      const callHandler = createMockCallHandler();

      const loggerSpy = jest.spyOn((interceptor as any).logger, "debug");

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        complete: () => {
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining("Body: empty"),
          );

          loggerSpy.mockRestore();
          done();
        },
      });
    });

    it("should handle missing request properties", (done) => {
      const mockRequest = {
        method: "PUT",
        url: "/api/test",
        // Missing body, params, query
      };

      const context = createMockExecutionContext(mockRequest);
      const callHandler = createMockCallHandler();

      const loggerSpy = jest.spyOn((interceptor as any).logger, "debug");

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        complete: () => {
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining("PUT /api/test"),
          );
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining("Params: {}"),
          );
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining("Query: {}"),
          );
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining("Body: empty"),
          );

          loggerSpy.mockRestore();
          done();
        },
      });
    });

    it("should measure response time accurately", (done) => {
      const mockRequest = {
        method: "GET",
        url: "/slow-endpoint",
        body: {},
        params: {},
        query: {},
      };

      const context = createMockExecutionContext(mockRequest);

      // Create a simple call handler
      const callHandler = createMockCallHandler({ data: "test" });

      const loggerSpy = jest.spyOn((interceptor as any).logger, "debug");

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe({
        complete: () => {
          const logCall = loggerSpy.mock.calls[0][0] as string;
          const responseTimeMatch = logCall.match(/\+(\d+)ms/);

          expect(responseTimeMatch).toBeTruthy();
          if (responseTimeMatch) {
            const responseTime = Number.parseInt(responseTimeMatch[1]);
            expect(responseTime).toBeGreaterThanOrEqual(0);
          }

          loggerSpy.mockRestore();
          done();
        },
      });
    });
  });
});
