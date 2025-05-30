import { HttpException, HttpStatus } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import { DbClientService } from "../../common/services/db-client.service";
import { LoggerService } from "../../common/services/logger.service";
import { ConversationsService } from "./conversations.service";
import { ConversationLanguage, ConversationLevel, CreateConversationDto } from "./dto/create-conversation.dto";

describe("conversationsService", () => {
  let service: ConversationsService;
  let dbClient: jest.Mocked<DbClientService>;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    const mockDbClient = {
      createConversation: jest.fn(),
      getConversation: jest.fn(),
      getUserConversations: jest.fn(),
      updateConversation: jest.fn(),
      deleteConversation: jest.fn(),
      createMessage: jest.fn(),
      getMessages: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: DbClientService,
          useValue: mockDbClient,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
    dbClient = module.get(DbClientService);
    logger = module.get(LoggerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a conversation successfully", async () => {
      const createDto: CreateConversationDto = {
        userId: "user123",
        title: "Test Conversation",
        language: ConversationLanguage.ENGLISH,
        level: ConversationLevel.INTERMEDIATE,
      };

      const expectedResult = {
        id: "conv123",
        ...createDto,
        status: "active",
        messageCount: 0,
        createdAt: new Date(),
      };

      dbClient.createConversation.mockResolvedValue(expectedResult);

      const result = await service.create(createDto);

      expect(dbClient.createConversation).toHaveBeenCalledWith({
        ...createDto,
        status: "active",
        messageCount: 0,
        lastActivity: expect.any(Date),
      });
      expect(result).toEqual(expectedResult);
      expect(logger.log).toHaveBeenCalledWith(
        "Creating conversation for user user123",
        "ConversationsService",
      );
    });

    it("should handle creation errors", async () => {
      const createDto: CreateConversationDto = {
        userId: "user123",
        title: "Test Conversation",
        language: ConversationLanguage.ENGLISH,
        level: ConversationLevel.INTERMEDIATE,
      };

      dbClient.createConversation.mockRejectedValue(new Error("Database error"));

      await expect(service.create(createDto)).rejects.toThrow(HttpException);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should find a conversation by id", async () => {
      const conversationId = "conv123";
      const expectedResult = {
        id: conversationId,
        userId: "user123",
        title: "Test Conversation",
        language: "en",
        level: "intermediate",
      };

      dbClient.getConversation.mockResolvedValue(expectedResult);

      const result = await service.findOne(conversationId);

      expect(dbClient.getConversation).toHaveBeenCalledWith(conversationId);
      expect(result).toEqual(expectedResult);
    });

    it("should throw not found exception when conversation does not exist", async () => {
      const conversationId = "nonexistent";
      dbClient.getConversation.mockResolvedValue(null);

      await expect(service.findOne(conversationId)).rejects.toThrow(
        new HttpException(
          `Conversation with ID ${conversationId} not found`,
          HttpStatus.NOT_FOUND,
        ),
      );
    });
  });

  describe("findByUser", () => {
    it("should find conversations for a user", async () => {
      const userId = "user123";
      const query = { page: 1, limit: 10 };
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      dbClient.getUserConversations.mockResolvedValue(expectedResult);

      const result = await service.findByUser(userId, query);

      expect(dbClient.getUserConversations).toHaveBeenCalledWith(userId, query);
      expect(result).toEqual(expectedResult);
    });
  });
});
