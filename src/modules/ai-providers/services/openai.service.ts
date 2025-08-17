import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

import { LoggerService } from "../../../common/services/logger.service";
import { AICompletionOptions, AICompletionResponse, AIMessage, IAIProvider } from "../interfaces/ai-provider.interface";

@Injectable()
export class OpenAIService implements IAIProvider {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;
  private readonly defaultModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required");
    }

    this.openai = new OpenAI({
      apiKey,
      organization: this.configService.get<string>("OPENAI_ORGANIZATION"),
    });

    this.defaultModel = this.configService.get<string>("OPENAI_DEFAULT_MODEL", "gpt-4o-mini");

    this.logger.log("OpenAI service initialized");
  }

  async generateCompletion(
    messages: AIMessage[],
    options?: AICompletionOptions,
  ): Promise<AICompletionResponse> {
    try {
      this.loggerService.log(
        `Generating completion with ${messages.length} messages`,
        "OpenAIService",
      );

      const completion = await this.openai.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1000,
      });

      const response: AICompletionResponse = {
        content: completion.choices[0]?.message?.content || "",
        model: completion.model,
        finishReason: completion.choices[0]?.finish_reason || undefined,
        usage: completion.usage
          ? {
              promptTokens: completion.usage.prompt_tokens,
              completionTokens: completion.usage.completion_tokens,
              totalTokens: completion.usage.total_tokens,
            }
          : undefined,
      };

      this.loggerService.log(
        `Completion generated successfully, tokens used: ${response.usage?.totalTokens || 0}`,
        "OpenAIService",
      );

      return response;
    }
    catch (error) {
      this.loggerService.error(
        `Failed to generate completion: ${error.message}`,
        error.stack,
        "OpenAIService",
      );
      throw error;
    }
  }

  async generateChatResponse(
    messages: AIMessage[],
    systemPrompt?: string,
    options?: AICompletionOptions,
  ): Promise<AICompletionResponse> {
    try {
      const enhancedMessages: AIMessage[] = [];

      // Add system prompt if provided
      if (systemPrompt) {
        enhancedMessages.push({
          role: "system",
          content: systemPrompt,
        });
      }

      // Add conversation messages
      enhancedMessages.push(...messages);

      return this.generateCompletion(enhancedMessages, options);
    }
    catch (error) {
      this.loggerService.error(
        `Failed to generate chat response: ${error.message}`,
        error.stack,
        "OpenAIService",
      );
      throw error;
    }
  }

  async analyzeText(
    text: string,
    analysisType: "grammar" | "style" | "vocabulary",
    options?: AICompletionOptions,
  ): Promise<AICompletionResponse> {
    try {
      this.loggerService.log(
        `Analyzing text for ${analysisType}`,
        "OpenAIService",
      );

      const analysisPrompts = {
        grammar: `Analyze the following text for important grammatical and vocabulary errors. Focus ONLY on meaningful issues that affect comprehension and language learning.

Text: "${text}"

IMPORTANT GUIDELINES:
- IGNORE capitalization errors (e.g., "hi" vs "Hi")
- IGNORE punctuation spacing (e.g., spaces before question marks)
- IGNORE minor punctuation issues unless they severely affect meaning
- FOCUS ON: verb tenses, subject-verb agreement, word order, vocabulary usage, prepositions, articles (a/an/the)

Please provide:
1. A corrected version with ONLY major grammatical/vocabulary errors fixed
2. Explanation of each SIGNIFICANT error found (ignore capitalization/punctuation)
3. Relevant grammar rules for major issues

Focus on errors that truly impact language learning effectiveness.`,

        style: `Analyze the following text for writing style and provide suggestions for improvement:

Text: "${text}"

Please provide:
1. Style assessment (formal/informal, clarity, flow)
2. Specific suggestions for improvement
3. Alternative phrasings where appropriate

Focus on making the text more natural and effective.`,

        vocabulary: `Analyze the following text for vocabulary usage and provide enhancement suggestions:

Text: "${text}"

Please provide:
1. Vocabulary level assessment
2. Suggestions for more advanced or appropriate word choices
3. Explanations of word usage and context

Help improve the richness and accuracy of vocabulary.`,
      };

      const messages: AIMessage[] = [
        {
          role: "user",
          content: analysisPrompts[analysisType],
        },
      ];

      return this.generateCompletion(messages, {
        ...options,
        temperature: 0.3, // Lower temperature for more consistent analysis
      });
    }
    catch (error) {
      this.loggerService.error(
        `Failed to analyze text: ${error.message}`,
        error.stack,
        "OpenAIService",
      );
      throw error;
    }
  }
}
