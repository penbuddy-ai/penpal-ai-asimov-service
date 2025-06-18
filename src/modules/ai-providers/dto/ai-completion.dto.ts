import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";

export enum MessageRole {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
}

export enum AnalysisType {
  GRAMMAR = "grammar",
  STYLE = "style",
  VOCABULARY = "vocabulary",
}

export class AIMessageDto {
  @ApiProperty({
    description: "Role of the message sender",
    enum: MessageRole,
    example: MessageRole.USER,
  })
  @IsEnum(MessageRole)
  role: MessageRole;

  @ApiProperty({
    description: "Content of the message",
    example: "Hello, I would like to practice my English conversation skills.",
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class AICompletionRequestDto {
  @ApiProperty({
    description: "Array of messages for the conversation",
    type: [AIMessageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AIMessageDto)
  messages: AIMessageDto[];

  @ApiPropertyOptional({
    description: "Temperature for response generation (0.0 to 2.0)",
    minimum: 0,
    maximum: 2,
    default: 0.7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({
    description: "Maximum tokens for the response",
    minimum: 1,
    maximum: 4000,
    default: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  maxTokens?: number;

  @ApiPropertyOptional({
    description: "AI model to use",
    example: "gpt-4",
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    description: "Conversation ID for context",
    example: "conv_123456",
  })
  @IsOptional()
  @IsString()
  conversationId?: string;
}

export class ChatResponseRequestDto {
  @ApiProperty({
    description: "Array of conversation messages",
    type: [AIMessageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AIMessageDto)
  messages: AIMessageDto[];

  @ApiPropertyOptional({
    description: "System prompt to guide the AI's behavior",
    example: "You are a helpful English language tutor. Help the user practice conversation skills.",
  })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiPropertyOptional({
    description: "Temperature for response generation",
    minimum: 0,
    maximum: 2,
    default: 0.7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({
    description: "Maximum tokens for the response",
    default: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  maxTokens?: number;
}

export class TextAnalysisRequestDto {
  @ApiProperty({
    description: "Text to analyze",
    example: "I am learn English and want to improve my grammer.",
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: "Type of analysis to perform",
    enum: AnalysisType,
    example: AnalysisType.GRAMMAR,
  })
  @IsEnum(AnalysisType)
  analysisType: AnalysisType;

  @ApiPropertyOptional({
    description: "AI model to use for analysis",
    example: "gpt-4",
  })
  @IsOptional()
  @IsString()
  model?: string;
}
