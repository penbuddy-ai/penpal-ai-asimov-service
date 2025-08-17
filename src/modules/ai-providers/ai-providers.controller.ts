import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { ServiceAuthGuard } from "../../common/guards/service-auth.guard";
import { ChatResponseRequestDto, TextAnalysisRequestDto } from "./dto/ai-completion.dto";
import { AIProvider, AIProviderService } from "./services/ai-provider.service";

@ApiTags("ai-providers")
@Controller("ai")
@UseGuards(ServiceAuthGuard)
@ApiHeader({
  name: "x-api-key",
  description: "API key for inter-service authentication",
  required: true,
})
@ApiHeader({
  name: "x-service-name",
  description: "Name of the calling service",
  required: true,
})
export class AIProvidersController {
  constructor(private readonly aiProviderService: AIProviderService) {}

  @Post("chat")
  @ApiOperation({ summary: "Generate chat response using AI" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "AI response generated successfully",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid request data",
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Failed to generate AI response",
  })
  @ApiBody({ type: ChatResponseRequestDto })
  async generateChatResponse(@Body() request: ChatResponseRequestDto) {
    const messages = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date(),
    }));

    if (request.systemPrompt) {
      return this.aiProviderService.generateChatResponse(
        [{ role: "system", content: request.systemPrompt }, ...messages],
        {
          temperature: request.temperature,
          maxTokens: request.maxTokens,
        },
      );
    }

    return this.aiProviderService.generateChatResponse(messages, {
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    });
  }

  @Post("tutor")
  @ApiOperation({ summary: "Generate tutor response for language learning" })
  @ApiQuery({ name: "language", required: false, type: String, description: "Target language" })
  @ApiQuery({ name: "level", required: false, type: String, description: "Language proficiency level" })
  @ApiQuery({ name: "userId", required: false, type: String, description: "User ID for context" })
  @ApiQuery({ name: "conversationId", required: false, type: String, description: "Conversation ID for context" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Tutor response generated successfully",
  })
  @ApiBody({ type: ChatResponseRequestDto })
  async generateTutorResponse(
    @Body() request: ChatResponseRequestDto,
    @Query("language") language?: string,
    @Query("level") level?: string,
    @Query("userId") userId?: string,
    @Query("conversationId") conversationId?: string,
  ) {
    const userMessage = request.messages[request.messages.length - 1]?.content || "";
    const conversationHistory = request.messages.slice(0, -1).map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date(),
    }));

    return this.aiProviderService.generateTutorResponse(
      userMessage,
      conversationHistory,
      {
        language,
        level,
        userId,
        conversationId,
      },
      {
        temperature: request.temperature,
        maxTokens: request.maxTokens,
      },
    );
  }

  @Post("conversation-partner")
  @ApiOperation({ summary: "Generate conversation partner response" })
  @ApiQuery({ name: "language", required: false, type: String, description: "Target language" })
  @ApiQuery({ name: "level", required: false, type: String, description: "Language proficiency level" })
  @ApiQuery({ name: "userId", required: false, type: String, description: "User ID for context" })
  @ApiQuery({ name: "conversationId", required: false, type: String, description: "Conversation ID for context" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Conversation partner response generated successfully",
  })
  @ApiBody({ type: ChatResponseRequestDto })
  async generateConversationPartnerResponse(
    @Body() request: ChatResponseRequestDto,
    @Query("language") language?: string,
    @Query("level") level?: string,
    @Query("userId") userId?: string,
    @Query("conversationId") conversationId?: string,
  ) {
    const userMessage = request.messages[request.messages.length - 1]?.content || "";
    const conversationHistory = request.messages.slice(0, -1).map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date(),
    }));

    return this.aiProviderService.generateConversationPartnerResponse(
      userMessage,
      conversationHistory,
      {
        language,
        level,
        userId,
        conversationId,
      },
      {
        temperature: request.temperature,
        maxTokens: request.maxTokens,
      },
    );
  }

  @Post("analyze")
  @ApiOperation({ summary: "Analyze text for grammar, style, or vocabulary" })
  @ApiQuery({ name: "language", required: false, type: String, description: "Text language" })
  @ApiQuery({ name: "level", required: false, type: String, description: "User proficiency level" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Text analysis completed successfully",
  })
  @ApiBody({ type: TextAnalysisRequestDto })
  async analyzeText(
    @Body() request: TextAnalysisRequestDto,
    @Query("language") language?: string,
    @Query("level") level?: string,
  ) {
    return this.aiProviderService.analyzeText(
      request.text,
      request.analysisType,
      {
        language,
        level,
      },
      {
        model: request.model,
      },
    );
  }

  @Get("conversation-starters")
  @ApiOperation({ summary: "Generate conversation starters" })
  @ApiQuery({ name: "language", required: false, type: String, description: "Target language" })
  @ApiQuery({ name: "level", required: false, type: String, description: "Language proficiency level" })
  @ApiQuery({ name: "topics", required: false, type: String, description: "Topics of interest" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Conversation starters generated successfully",
  })
  async generateConversationStarters(
    @Query("language") language?: string,
    @Query("level") level?: string,
    @Query("topics") topics?: string,
  ) {
    return this.aiProviderService.generateConversationStarters({
      language,
      level,
      topics,
    });
  }

  @Get("models")
  @ApiOperation({ summary: "Get available AI models" })
  @ApiQuery({ name: "provider", required: false, enum: AIProvider, description: "AI provider" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Available models retrieved successfully",
  })
  async getAvailableModels(@Query("provider") provider?: AIProvider) {
    const models = await this.aiProviderService.getAvailableModels(provider);
    return {
      provider: provider || this.aiProviderService.getDefaultProvider(),
      models,
    };
  }

  @Get("providers")
  @ApiOperation({ summary: "Get available AI providers" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Available providers retrieved successfully",
  })
  async getAvailableProviders() {
    return {
      providers: Object.values(AIProvider),
      default: this.aiProviderService.getDefaultProvider(),
    };
  }

  @Get("health")
  @ApiOperation({ summary: "Check AI providers health status" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "AI providers health status",
  })
  async checkHealth() {
    const providers = Object.values(AIProvider);
    const healthChecks = await Promise.allSettled(
      providers.map(async provider => ({
        provider,
        status: await this.aiProviderService.validateProviderConnection(provider),
      })),
    );

    return {
      timestamp: new Date().toISOString(),
      providers: healthChecks.map(result =>
        result.status === "fulfilled"
          ? result.value
          : { provider: "unknown", status: false },
      ),
      overall: healthChecks.every(result =>
        result.status === "fulfilled" && result.value.status,
      ),
    };
  }
}
