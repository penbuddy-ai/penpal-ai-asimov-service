import { CallHandler, ExecutionContext } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { of } from "rxjs";

import { Response, TransformInterceptor } from "./transform.interceptor";

describe("transformInterceptor", () => {
  let interceptor: TransformInterceptor<any>;

  const createMockExecutionContext = (method: string, statusCode: number = 200): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ method }),
        getResponse: () => ({ statusCode }),
      }),
    } as ExecutionContext;
  };

  const createMockCallHandler = (returnValue: any): CallHandler => {
    return {
      handle: () => of(returnValue),
    } as CallHandler;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransformInterceptor],
    }).compile();

    interceptor = module.get<TransformInterceptor<any>>(TransformInterceptor);
  });

  it("should be defined", () => {
    expect(interceptor).toBeDefined();
  });

  describe("intercept", () => {
    it("should transform response with GET method", (done) => {
      const testData = { id: 1, name: "Test" };
      const context = createMockExecutionContext("GET", 200);
      const callHandler = createMockCallHandler(testData);

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe((result: Response<any>) => {
        expect(result.statusCode).toBe(200);
        expect(result.message).toBe("Request completed successfully");
        expect(result.data).toEqual(testData);
        expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
        done();
      });
    });

    it("should transform response with POST method", (done) => {
      const testData = { id: 1, created: true };
      const context = createMockExecutionContext("POST", 201);
      const callHandler = createMockCallHandler(testData);

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe((result: Response<any>) => {
        expect(result.statusCode).toBe(201);
        expect(result.message).toBe("Resource created successfully");
        expect(result.data).toEqual(testData);
        expect(result.timestamp).toBeDefined();
        done();
      });
    });

    it("should transform response with PUT method", (done) => {
      const testData = { id: 1, updated: true };
      const context = createMockExecutionContext("PUT", 200);
      const callHandler = createMockCallHandler(testData);

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe((result: Response<any>) => {
        expect(result.statusCode).toBe(200);
        expect(result.message).toBe("Resource updated successfully");
        expect(result.data).toEqual(testData);
        done();
      });
    });

    it("should transform response with PATCH method", (done) => {
      const testData = { id: 1, patched: true };
      const context = createMockExecutionContext("PATCH", 200);
      const callHandler = createMockCallHandler(testData);

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe((result: Response<any>) => {
        expect(result.statusCode).toBe(200);
        expect(result.message).toBe("Resource updated successfully");
        expect(result.data).toEqual(testData);
        done();
      });
    });

    it("should transform response with DELETE method", (done) => {
      const testData = { deleted: true };
      const context = createMockExecutionContext("DELETE", 200);
      const callHandler = createMockCallHandler(testData);

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe((result: Response<any>) => {
        expect(result.statusCode).toBe(200);
        expect(result.message).toBe("Resource deleted successfully");
        expect(result.data).toEqual(testData);
        done();
      });
    });

    it("should handle null/undefined data", (done) => {
      const context = createMockExecutionContext("GET", 200);
      const callHandler = createMockCallHandler(null);

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe((result: Response<any>) => {
        expect(result.statusCode).toBe(200);
        expect(result.message).toBe("Request completed successfully");
        expect(result.data).toBeNull();
        expect(result.timestamp).toBeDefined();
        done();
      });
    });

    it("should handle empty object data", (done) => {
      const testData = {};
      const context = createMockExecutionContext("GET", 200);
      const callHandler = createMockCallHandler(testData);

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe((result: Response<any>) => {
        expect(result.statusCode).toBe(200);
        expect(result.data).toEqual({});
        done();
      });
    });

    it("should handle array data", (done) => {
      const testData = [{ id: 1 }, { id: 2 }];
      const context = createMockExecutionContext("GET", 200);
      const callHandler = createMockCallHandler(testData);

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe((result: Response<any>) => {
        expect(result.statusCode).toBe(200);
        expect(result.data).toEqual(testData);
        expect(Array.isArray(result.data)).toBe(true);
        done();
      });
    });

    it("should handle different status codes", (done) => {
      const testData = { message: "Created" };
      const context = createMockExecutionContext("POST", 201);
      const callHandler = createMockCallHandler(testData);

      const result$ = interceptor.intercept(context, callHandler);

      result$.subscribe((result: Response<any>) => {
        expect(result.statusCode).toBe(201);
        expect(result.data).toEqual(testData);
        done();
      });
    });
  });

  describe("getSuccessMessage", () => {
    it("should return correct message for different HTTP methods", () => {
      // Access private method for testing
      const getSuccessMessage = (interceptor as any).getSuccessMessage.bind(interceptor);

      expect(getSuccessMessage("GET")).toBe("Request completed successfully");
      expect(getSuccessMessage("POST")).toBe("Resource created successfully");
      expect(getSuccessMessage("PUT")).toBe("Resource updated successfully");
      expect(getSuccessMessage("PATCH")).toBe("Resource updated successfully");
      expect(getSuccessMessage("DELETE")).toBe("Resource deleted successfully");
      expect(getSuccessMessage("UNKNOWN")).toBe("Request completed successfully");
    });
  });
});
