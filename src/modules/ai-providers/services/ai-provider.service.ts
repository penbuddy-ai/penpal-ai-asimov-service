import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { LoggerService } from "../../../common/services/logger.service";
import { AICompletionOptions, AICompletionResponse, AIMessage, PromptContext } from "../interfaces/ai-provider.interface";
import { OpenAIService } from "./openai.service";
import { PromptTemplateService } from "./prompt-template.service";

export enum AIProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
}

@Injectable()
export class AIProviderService {
  private readonly defaultProvider: AIProvider;

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly promptTemplateService: PromptTemplateService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.defaultProvider = this.configService.get<AIProvider>("DEFAULT_AI_PROVIDER", AIProvider.OPENAI);
    this.logger.log(`AI Provider Service initialized with default provider: ${this.defaultProvider}`, "AIProviderService");
  }

  async generateChatResponse(
    messages: AIMessage[],
    options?: AICompletionOptions & { provider?: AIProvider },
  ): Promise<AICompletionResponse> {
    try {
      const provider = options?.provider || this.defaultProvider;

      this.logger.log(
        `Generating chat response using ${provider} provider`,
        "AIProviderService",
      );

      switch (provider) {
        case AIProvider.OPENAI:
          return await this.openaiService.generateCompletion(messages, options);

        default:
          throw new HttpException(
            `Unsupported AI provider: ${provider}`,
            HttpStatus.BAD_REQUEST,
          );
      }
    }
    catch (error) {
      this.logger.error(
        `Failed to generate chat response: ${error.message}`,
        error.stack,
        "AIProviderService",
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Failed to generate AI response",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateTutorResponse(
    userMessage: string,
    conversationHistory: AIMessage[],
    context: {
      language?: string;
      level?: string;
      userId?: string;
      conversationId?: string;
    },
    options?: AICompletionOptions & { provider?: AIProvider },
  ): Promise<AICompletionResponse> {
    try {
      const promptContext: PromptContext = {
        userMessage,
        conversationHistory,
        language: context.language || "English",
        level: context.level || "intermediate",
        userId: context.userId,
        conversationId: context.conversationId,
      };

      const systemPrompt = this.promptTemplateService.renderTemplate(
        "conversation_tutor",
        promptContext,
      );

      const messages: AIMessage[] = [
        {
          role: "system",
          content: systemPrompt,
        },
        ...conversationHistory.slice(-10), // Include last 10 messages for context
        {
          role: "user",
          content: userMessage,
        },
      ];

      return await this.generateChatResponse(messages, options);
    }
    catch (error) {
      this.logger.error(
        `Failed to generate tutor response: ${error.message}`,
        error.stack,
        "AIProviderService",
      );
      throw error;
    }
  }

  async generateConversationPartnerResponse(
    userMessage: string,
    conversationHistory: AIMessage[],
    context: {
      language?: string;
      level?: string;
      userId?: string;
      conversationId?: string;
    },
    options?: AICompletionOptions & { provider?: AIProvider },
  ): Promise<AICompletionResponse> {
    try {
      const promptContext: PromptContext = {
        userMessage,
        conversationHistory,
        language: context.language || "English",
        level: context.level || "intermediate",
        userId: context.userId,
        conversationId: context.conversationId,
      };

      const systemPrompt = this.promptTemplateService.renderTemplate(
        "conversation_friend",
        promptContext,
      );

      const messages: AIMessage[] = [
        {
          role: "system",
          content: systemPrompt,
        },
        ...conversationHistory.slice(-8), // Slightly shorter context for casual conversation
        {
          role: "user",
          content: userMessage,
        },
      ];

      return await this.generateChatResponse(messages, {
        ...options,
        temperature: 0.8, // Slightly higher temperature for more natural conversation
      });
    }
    catch (error) {
      this.logger.error(
        `Failed to generate conversation partner response: ${error.message}`,
        error.stack,
        "AIProviderService",
      );
      throw error;
    }
  }

  async analyzeText(
    text: string,
    analysisType: "grammar" | "style" | "vocabulary",
    context: {
      language?: string;
      level?: string;
    } = {},
    options?: AICompletionOptions & { provider?: AIProvider },
  ): Promise<AICompletionResponse> {
    try {
      const provider = options?.provider || this.defaultProvider;

      this.logger.log(
        `Analyzing text for ${analysisType} using ${provider}`,
        "AIProviderService",
      );

      // Use prompt template for analysis
      const promptContext: PromptContext = {
        userMessage: text,
        language: context.language || "English",
        level: context.level || "intermediate",
        additionalContext: {
          text,
          level: context.level || "intermediate",
        },
      };

      let templateId: string;
      switch (analysisType) {
        case "grammar":
          templateId = "grammar_correction";
          break;
        case "style":
          templateId = "style_improvement";
          break;
        case "vocabulary":
          templateId = "vocabulary_analysis";
          break;
        default:
          throw new HttpException(
            `Unsupported analysis type: ${analysisType}`,
            HttpStatus.BAD_REQUEST,
          );
      }

      const analysisPrompt = this.promptTemplateService.renderTemplate(
        templateId,
        promptContext,
      );

      const messages: AIMessage[] = [
        {
          role: "user",
          content: analysisPrompt,
        },
      ];

      switch (provider) {
        case AIProvider.OPENAI:
          return await this.openaiService.generateCompletion(messages, {
            ...options,
            temperature: 0.3, // Lower temperature for consistent analysis
          });

        default:
          throw new HttpException(
            `Unsupported AI provider: ${provider}`,
            HttpStatus.BAD_REQUEST,
          );
      }
    }
    catch (error) {
      this.logger.error(
        `Failed to analyze text: ${error.message}`,
        error.stack,
        "AIProviderService",
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Failed to analyze text",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateConversationStarters(
    context: {
      language?: string;
      level?: string;
      topics?: string;
    } = {},
    options?: AICompletionOptions & { provider?: AIProvider },
  ): Promise<AICompletionResponse> {
    try {
      const promptContext: PromptContext = {
        language: context.language || "English",
        level: context.level || "intermediate",
        additionalContext: {
          topics: context.topics || "general conversation, daily life, hobbies, travel",
        },
      };

      const prompt = this.promptTemplateService.renderTemplate(
        "conversation_starter",
        promptContext,
      );

      const messages: AIMessage[] = [
        {
          role: "user",
          content: prompt,
        },
      ];

      return await this.generateChatResponse(messages, {
        ...options,
        temperature: 0.8, // Higher temperature for creative starter generation
      });
    }
    catch (error) {
      this.logger.error(
        `Failed to generate conversation starters: ${error.message}`,
        error.stack,
        "AIProviderService",
      );
      throw error;
    }
  }

  async getAvailableModels(provider?: AIProvider): Promise<string[]> {
    const targetProvider = provider || this.defaultProvider;

    switch (targetProvider) {
      case AIProvider.OPENAI:
        return [
          "gpt-4o-mini",
          "gpt-4o",
          "gpt-4-turbo",
          "gpt-4",
          "gpt-3.5-turbo",
          "gpt-3.5-turbo-16k",
        ];

      default:
        return [];
    }
  }

  getDefaultProvider(): AIProvider {
    return this.defaultProvider;
  }

  async validateProviderConnection(provider?: AIProvider): Promise<boolean> {
    try {
      const targetProvider = provider || this.defaultProvider;

      const testMessages: AIMessage[] = [
        {
          role: "user",
          content: "Hello, this is a connection test.",
        },
      ];

      await this.generateChatResponse(testMessages, {
        provider: targetProvider,
        maxTokens: 10,
        temperature: 0,
      });

      return true;
    }
    catch (error) {
      this.logger.error(
        `Provider connection validation failed: ${error.message}`,
        error.stack,
        "AIProviderService",
      );
      return false;
    }
  }
}
