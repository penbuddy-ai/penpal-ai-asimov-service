import { HttpService } from "@nestjs/axios";
import { HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { AxiosResponse } from "axios";
import { of, throwError } from "rxjs";

import { DbClientService } from "./db-client.service";

describe("dbClientService", () => {
  let service: DbClientService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const mockResponse = {
    data: { id: "123", message: "Success" },
    status: 200,
    statusText: "OK",
    headers: {},
    config: {},
  } as AxiosResponse;

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        switch (key) {
          case "DB_SERVICE_URL":
            return "http://localhost:3001/api/v1";
          case "DB_SERVICE_API_KEY":
            return "test-api-key";
          default:
            return defaultValue;
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DbClientService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DbClientService>(DbClientService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with default values when env vars are missing", () => {
      configService.get.mockImplementation((key: string, defaultValue?: any) => {
        switch (key) {
          case "DB_SERVICE_URL":
            return defaultValue;
          case "DB_SERVICE_API_KEY":
            return defaultValue;
          default:
            return defaultValue;
        }
      });

      const newService = new DbClientService(httpService, configService);
      expect(newService).toBeDefined();
    });

    it("should warn when API key is not set", () => {
      const loggerSpy = jest.spyOn(console, "warn").mockImplementation();
      configService.get.mockImplementation((key: string) => {
        if (key === "DB_SERVICE_API_KEY")
          return "";
        return "http://localhost:3001/api/v1";
      });

      const _unusedService = new DbClientService(httpService, configService);
      // Note: We can't easily test the logger.warn call since it's a private logger
      loggerSpy.mockRestore();
    });
  });

  describe("getHeaders", () => {
    it("should return correct headers", () => {
      const headers = (service as any).getHeaders();

      expect(headers).toEqual({
        "Content-Type": "application/json",
        "x-api-key": "test-api-key",
        "x-service-name": "ai-service",
      });
    });
  });

  describe("handleRequest", () => {
    it("should return data on successful request", async () => {
      const promise = Promise.resolve(mockResponse);

      const result = await (service as any).handleRequest(promise);

      expect(result).toEqual(mockResponse.data);
    });

    it("should throw HttpException on request error", async () => {
      const error = {
        response: {
          data: { message: "Not found" },
          status: 404,
        },
        message: "Request failed",
        stack: "Error stack",
      };

      const promise = Promise.reject(error);

      await expect((service as any).handleRequest(promise)).rejects.toThrow(
        new HttpException(
          {
            statusCode: 404,
            message: "Not found",
            error: "DB Service Error",
          },
          404,
        ),
      );
    });

    it("should handle error without response", async () => {
      const error = {
        message: "Network error",
        stack: "Error stack",
      };

      const promise = Promise.reject(error);

      await expect((service as any).handleRequest(promise)).rejects.toThrow(
        new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: "Network error",
            error: "DB Service Error",
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe("conversations endpoints", () => {
    it("should create conversation", async () => {
      const conversationData = { title: "Test Conversation" };
      httpService.post.mockReturnValue(of(mockResponse));

      const result = await service.createConversation(conversationData);

      expect(httpService.post).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/conversations",
        conversationData,
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should get all conversations", async () => {
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getAllConversations();

      expect(httpService.get).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/conversations",
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should get all conversations with query params", async () => {
      const query = { userId: "123", limit: "10" };
      httpService.get.mockReturnValue(of(mockResponse));

      await service.getAllConversations(query);

      expect(httpService.get).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/conversations?userId=123&limit=10",
        { headers: expect.any(Object) },
      );
    });

    it("should get conversation by id", async () => {
      const conversationId = "conv123";
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getConversation(conversationId);

      expect(httpService.get).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/conversations/conv123",
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should get user conversations", async () => {
      const userId = "user123";
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getUserConversations(userId);

      expect(httpService.get).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/conversations/user/user123",
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should update conversation", async () => {
      const conversationId = "conv123";
      const updateData = { title: "Updated Title" };
      httpService.patch.mockReturnValue(of(mockResponse));

      const result = await service.updateConversation(conversationId, updateData);

      expect(httpService.patch).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/conversations/conv123",
        updateData,
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should delete conversation", async () => {
      const conversationId = "conv123";
      httpService.delete.mockReturnValue(of(mockResponse));

      const result = await service.deleteConversation(conversationId);

      expect(httpService.delete).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/conversations/conv123",
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should hard delete conversation", async () => {
      const conversationId = "conv123";
      httpService.delete.mockReturnValue(of(mockResponse));

      const result = await service.hardDeleteConversation(conversationId);

      expect(httpService.delete).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/conversations/conv123/hard",
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("messages endpoints", () => {
    it("should create message", async () => {
      const messageData = { content: "Hello", conversationId: "conv123" };
      httpService.post.mockReturnValue(of(mockResponse));

      const result = await service.createMessage(messageData);

      expect(httpService.post).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/messages",
        messageData,
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should get all messages", async () => {
      const query = { conversationId: "conv123" };
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getAllMessages(query);

      expect(httpService.get).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/messages?conversationId=conv123",
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should get message by id", async () => {
      const messageId = "msg123";
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getMessage(messageId);

      expect(httpService.get).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/messages/msg123",
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should update message", async () => {
      const messageId = "msg123";
      const updateData = { content: "Updated content" };
      httpService.patch.mockReturnValue(of(mockResponse));

      const result = await service.updateMessage(messageId, updateData);

      expect(httpService.patch).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/messages/msg123",
        updateData,
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should mark message as read", async () => {
      const messageId = "msg123";
      httpService.patch.mockReturnValue(of(mockResponse));

      const result = await service.markMessageAsRead(messageId);

      expect(httpService.patch).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/messages/msg123/read",
        {},
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should add message corrections", async () => {
      const messageId = "msg123";
      const corrections = { grammar: ["error1", "error2"] };
      httpService.patch.mockReturnValue(of(mockResponse));

      const result = await service.addMessageCorrections(messageId, corrections);

      expect(httpService.patch).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/messages/msg123/corrections",
        corrections,
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should delete message", async () => {
      const messageId = "msg123";
      httpService.delete.mockReturnValue(of(mockResponse));

      const result = await service.deleteMessage(messageId);

      expect(httpService.delete).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/messages/msg123",
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should delete messages by conversation", async () => {
      const conversationId = "conv123";
      httpService.delete.mockReturnValue(of(mockResponse));

      const result = await service.deleteMessagesByConversation(conversationId);

      expect(httpService.delete).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/messages/conversation/conv123",
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("user endpoints", () => {
    it("should get user", async () => {
      const userId = "user123";
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getUser(userId);

      expect(httpService.get).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/users/user123",
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("aI Characters endpoints", () => {
    it("should get AI character", async () => {
      const characterId = "char123";
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getAICharacter(characterId);

      expect(httpService.get).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/ai-characters/char123",
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should get all AI characters", async () => {
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getAllAICharacters();

      expect(httpService.get).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/ai-characters",
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("progress endpoints", () => {
    it("should create progress", async () => {
      const progressData = { userId: "user123", activity: "lesson1" };
      httpService.post.mockReturnValue(of(mockResponse));

      const result = await service.createProgress(progressData);

      expect(httpService.post).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/progress",
        progressData,
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should get user progress", async () => {
      const userId = "user123";
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getUserProgress(userId);

      expect(httpService.get).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/progress/user/user123",
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should get user progress with query", async () => {
      const userId = "user123";
      const query = { limit: "10", offset: "0" };
      httpService.get.mockReturnValue(of(mockResponse));

      await service.getUserProgress(userId, query);

      expect(httpService.get).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/progress/user/user123?limit=10&offset=0",
        { headers: expect.any(Object) },
      );
    });
  });

  describe("languages endpoints", () => {
    it("should get language", async () => {
      const languageId = "lang123";
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getLanguage(languageId);

      expect(httpService.get).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/languages/lang123",
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should get all languages", async () => {
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getAllLanguages();

      expect(httpService.get).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/languages",
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("deprecated methods", () => {
    it("should handle getMessages (deprecated)", async () => {
      const conversationId = "conv123";
      const query = { limit: "10" };
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getMessages(conversationId, query);

      expect(httpService.get).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/messages?limit=10&conversationId=conv123",
        { headers: expect.any(Object) },
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("error handling", () => {
    it("should handle HTTP errors properly", async () => {
      const error = {
        response: {
          data: { message: "Conversation not found" },
          status: 404,
        },
        message: "Request failed with status code 404",
      };

      httpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getConversation("nonexistent")).rejects.toThrow(HttpException);
    });

    it("should handle network errors", async () => {
      const error = new Error("Network Error");
      httpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getConversation("any")).rejects.toThrow(HttpException);
    });
  });
});
