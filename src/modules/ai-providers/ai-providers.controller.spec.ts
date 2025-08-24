import { Test, TestingModule } from "@nestjs/testing";

import { ServiceAuthGuard } from "../../common/guards/service-auth.guard";
import { AIProvidersController } from "./ai-providers.controller";
import { AnalysisType, ChatResponseRequestDto, MessageRole, TextAnalysisRequestDto } from "./dto/ai-completion.dto";
import { AICompletionResponse } from "./interfaces/ai-provider.interface";
import { AIProvider, AIProviderService } from "./services/ai-provider.service";

describe("aIProvidersController", () => {
  let controller: AIProvidersController;
  let aiProviderService: jest.Mocked<AIProviderService>;

  const mockCompletionResponse: AICompletionResponse = {
    content: "Test AI response",
    model: "gpt-4o-mini",
    finishReason: "stop",
    usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    provider: "openai",
    cost: 0.001,
  };

  beforeEach(async () => {
    const mockAIProviderService = {
      generateChatResponse: jest.fn(),
      generateTutorResponse: jest.fn(),
      generateConversationPartnerResponse: jest.fn(),
      analyzeText: jest.fn(),
      generateConversationStarters: jest.fn(),
      getAvailableModels: jest.fn(),
      getDefaultProvider: jest.fn(),
      validateProviderConnection: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIProvidersController],
      providers: [
        { provide: AIProviderService, useValue: mockAIProviderService },
      ],
    })
      .overrideGuard(ServiceAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AIProvidersController>(AIProvidersController);
    aiProviderService = module.get(AIProviderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generateChatResponse", () => {
    it("should generate chat response without system prompt", async () => {
      const request: ChatResponseRequestDto = {
        messages: [{ role: MessageRole.USER, content: "Hello" }],
        temperature: 0.7,
        maxTokens: 500,
      };

      aiProviderService.generateChatResponse.mockResolvedValue(mockCompletionResponse);

      const result = await controller.generateChatResponse(request);

      expect(aiProviderService.generateChatResponse).toHaveBeenCalledWith(
        [{ role: "user", content: "Hello", timestamp: expect.any(Date) }],
        {
          temperature: 0.7,
          maxTokens: 500,
        },
      );
      expect(result).toEqual(mockCompletionResponse);
    });

    it("should generate chat response with system prompt", async () => {
      const request: ChatResponseRequestDto = {
        messages: [{ role: MessageRole.USER, content: "Hello" }],
        systemPrompt: "You are a helpful assistant",
        temperature: 0.8,
        maxTokens: 1000,
      };

      aiProviderService.generateChatResponse.mockResolvedValue(mockCompletionResponse);

      const result = await controller.generateChatResponse(request);

      expect(aiProviderService.generateChatResponse).toHaveBeenCalledWith(
        [
          { role: "system", content: "You are a helpful assistant" },
          { role: "user", content: "Hello", timestamp: expect.any(Date) },
        ],
        {
          temperature: 0.8,
          maxTokens: 1000,
        },
      );
      expect(result).toEqual(mockCompletionResponse);
    });

    it("should handle undefined temperature and maxTokens", async () => {
      const request: ChatResponseRequestDto = {
        messages: [{ role: MessageRole.USER, content: "Hello" }],
      };

      aiProviderService.generateChatResponse.mockResolvedValue(mockCompletionResponse);

      await controller.generateChatResponse(request);

      expect(aiProviderService.generateChatResponse).toHaveBeenCalledWith(
        expect.any(Array),
        {
          temperature: undefined,
          maxTokens: undefined,
        },
      );
    });
  });

  describe("generateTutorResponse", () => {
    it("should generate tutor response with all parameters", async () => {
      const request: ChatResponseRequestDto = {
        messages: [
          { role: MessageRole.ASSISTANT, content: "Hello student" },
          { role: MessageRole.USER, content: "How do I say hello?" },
        ],
        temperature: 0.7,
        maxTokens: 500,
      };

      aiProviderService.generateTutorResponse.mockResolvedValue(mockCompletionResponse);

      const result = await controller.generateTutorResponse(
        request,
        "French",
        "beginner",
        "user123",
        "conv456",
      );

      expect(aiProviderService.generateTutorResponse).toHaveBeenCalledWith(
        "How do I say hello?",
        [{ role: "assistant", content: "Hello student", timestamp: expect.any(Date) }],
        {
          language: "French",
          level: "beginner",
          userId: "user123",
          conversationId: "conv456",
        },
        {
          temperature: 0.7,
          maxTokens: 500,
        },
      );
      expect(result).toEqual(mockCompletionResponse);
    });

    it("should generate tutor response with minimal parameters", async () => {
      const request: ChatResponseRequestDto = {
        messages: [{ role: MessageRole.USER, content: "Hello" }],
      };

      aiProviderService.generateTutorResponse.mockResolvedValue(mockCompletionResponse);

      const result = await controller.generateTutorResponse(request);

      expect(aiProviderService.generateTutorResponse).toHaveBeenCalledWith(
        "Hello",
        [],
        {
          language: undefined,
          level: undefined,
          userId: undefined,
          conversationId: undefined,
        },
        {
          temperature: undefined,
          maxTokens: undefined,
        },
      );
      expect(result).toEqual(mockCompletionResponse);
    });

    it("should handle empty messages array", async () => {
      const request: ChatResponseRequestDto = {
        messages: [],
      };

      aiProviderService.generateTutorResponse.mockResolvedValue(mockCompletionResponse);

      await controller.generateTutorResponse(request);

      expect(aiProviderService.generateTutorResponse).toHaveBeenCalledWith(
        "",
        [],
        expect.any(Object),
        expect.any(Object),
      );
    });
  });

  describe("generateConversationPartnerResponse", () => {
    it("should generate conversation partner response", async () => {
      const request: ChatResponseRequestDto = {
        messages: [
          { role: MessageRole.ASSISTANT, content: "Hey there!" },
          { role: MessageRole.USER, content: "What's your favorite hobby?" },
        ],
        temperature: 0.8,
      };

      aiProviderService.generateConversationPartnerResponse.mockResolvedValue(mockCompletionResponse);

      const result = await controller.generateConversationPartnerResponse(
        request,
        "Spanish",
        "intermediate",
        "user789",
        "conv123",
      );

      expect(aiProviderService.generateConversationPartnerResponse).toHaveBeenCalledWith(
        "What's your favorite hobby?",
        [{ role: "assistant", content: "Hey there!", timestamp: expect.any(Date) }],
        {
          language: "Spanish",
          level: "intermediate",
          userId: "user789",
          conversationId: "conv123",
        },
        {
          temperature: 0.8,
          maxTokens: undefined,
        },
      );
      expect(result).toEqual(mockCompletionResponse);
    });
  });

  describe("analyzeText", () => {
    it("should analyze text with all parameters", async () => {
      const request: TextAnalysisRequestDto = {
        text: "This is a test sentence.",
        analysisType: AnalysisType.GRAMMAR,
        model: "gpt-4",
      };

      aiProviderService.analyzeText.mockResolvedValue(mockCompletionResponse);

      const result = await controller.analyzeText(
        request,
        "English",
        "advanced",
      );

      expect(aiProviderService.analyzeText).toHaveBeenCalledWith(
        "This is a test sentence.",
        "grammar",
        {
          language: "English",
          level: "advanced",
        },
        {
          model: "gpt-4",
        },
      );
      expect(result).toEqual(mockCompletionResponse);
    });

    it("should analyze text with minimal parameters", async () => {
      const request: TextAnalysisRequestDto = {
        text: "Hello world",
        analysisType: AnalysisType.STYLE,
      };

      aiProviderService.analyzeText.mockResolvedValue(mockCompletionResponse);

      const result = await controller.analyzeText(request);

      expect(aiProviderService.analyzeText).toHaveBeenCalledWith(
        "Hello world",
        "style",
        {
          language: undefined,
          level: undefined,
        },
        {
          model: undefined,
        },
      );
      expect(result).toEqual(mockCompletionResponse);
    });

    it("should handle vocabulary analysis", async () => {
      const request: TextAnalysisRequestDto = {
        text: "The quick brown fox jumps over the lazy dog.",
        analysisType: AnalysisType.VOCABULARY,
      };

      aiProviderService.analyzeText.mockResolvedValue(mockCompletionResponse);

      await controller.analyzeText(request, "French", "beginner");

      expect(aiProviderService.analyzeText).toHaveBeenCalledWith(
        "The quick brown fox jumps over the lazy dog.",
        "vocabulary",
        {
          language: "French",
          level: "beginner",
        },
        {
          model: undefined,
        },
      );
    });
  });

  describe("generateConversationStarters", () => {
    it("should generate conversation starters with all parameters", async () => {
      aiProviderService.generateConversationStarters.mockResolvedValue(mockCompletionResponse);

      const result = await controller.generateConversationStarters(
        "German",
        "advanced",
        "technology, travel",
      );

      expect(aiProviderService.generateConversationStarters).toHaveBeenCalledWith({
        language: "German",
        level: "advanced",
        topics: "technology, travel",
      });
      expect(result).toEqual(mockCompletionResponse);
    });

    it("should generate conversation starters with minimal parameters", async () => {
      aiProviderService.generateConversationStarters.mockResolvedValue(mockCompletionResponse);

      const result = await controller.generateConversationStarters();

      expect(aiProviderService.generateConversationStarters).toHaveBeenCalledWith({
        language: undefined,
        level: undefined,
        topics: undefined,
      });
      expect(result).toEqual(mockCompletionResponse);
    });
  });

  describe("getAvailableModels", () => {
    it("should get available models for default provider", async () => {
      const mockModels = ["gpt-4o-mini", "gpt-4o"];
      aiProviderService.getAvailableModels.mockResolvedValue(mockModels);
      aiProviderService.getDefaultProvider.mockReturnValue(AIProvider.OPENAI);

      const result = await controller.getAvailableModels();

      expect(aiProviderService.getAvailableModels).toHaveBeenCalledWith(undefined);
      expect(aiProviderService.getDefaultProvider).toHaveBeenCalled();
      expect(result).toEqual({
        provider: AIProvider.OPENAI,
        models: mockModels,
      });
    });

    it("should get available models for specified provider", async () => {
      const mockModels = ["gpt-4o", "gpt-4"];
      aiProviderService.getAvailableModels.mockResolvedValue(mockModels);

      const result = await controller.getAvailableModels(AIProvider.OPENAI);

      expect(aiProviderService.getAvailableModels).toHaveBeenCalledWith(AIProvider.OPENAI);
      expect(result).toEqual({
        provider: AIProvider.OPENAI,
        models: mockModels,
      });
    });
  });

  describe("getAvailableProviders", () => {
    it("should return available providers", async () => {
      aiProviderService.getDefaultProvider.mockReturnValue(AIProvider.OPENAI);

      const result = await controller.getAvailableProviders();

      expect(result).toEqual({
        providers: Object.values(AIProvider),
        default: AIProvider.OPENAI,
      });
    });
  });

  describe("checkHealth", () => {
    it("should check health of all providers", async () => {
      aiProviderService.validateProviderConnection
        .mockResolvedValueOnce(true) // OpenAI
        .mockResolvedValueOnce(false); // Anthropic

      const result = await controller.checkHealth();

      expect(aiProviderService.validateProviderConnection).toHaveBeenCalledTimes(2);
      expect(aiProviderService.validateProviderConnection).toHaveBeenCalledWith(AIProvider.OPENAI);
      expect(aiProviderService.validateProviderConnection).toHaveBeenCalledWith(AIProvider.ANTHROPIC);

      expect(result).toEqual({
        timestamp: expect.any(String),
        providers: [
          { provider: AIProvider.OPENAI, status: true },
          { provider: AIProvider.ANTHROPIC, status: false },
        ],
        overall: false,
      });
    });

    it("should return overall true when all providers are healthy", async () => {
      aiProviderService.validateProviderConnection
        .mockResolvedValueOnce(true) // OpenAI
        .mockResolvedValueOnce(true); // Anthropic

      const result = await controller.checkHealth();

      expect(result.overall).toBe(true);
    });

    it("should handle provider validation errors", async () => {
      aiProviderService.validateProviderConnection
        .mockResolvedValueOnce(true) // OpenAI
        .mockRejectedValueOnce(new Error("Connection failed")); // Anthropic

      const result = await controller.checkHealth();

      expect(result.providers).toHaveLength(2);
      expect(result.providers[0]).toEqual({ provider: AIProvider.OPENAI, status: true });
      expect(result.providers[1]).toEqual({ provider: "unknown", status: false });
      expect(result.overall).toBe(false);
    });
  });
});
