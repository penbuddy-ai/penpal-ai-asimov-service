import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export enum ConversationLanguage {
  ENGLISH = "en",
  FRENCH = "fr",
  SPANISH = "es",
  GERMAN = "de",
  ITALIAN = "it",
}

export enum ConversationLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

export class CreateConversationDto {
  @ApiProperty({
    description: "User ID who owns the conversation",
    example: "507f1f77bcf86cd799439011",
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: "Title of the conversation",
    example: "Daily English Practice",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: "Language of the conversation",
    enum: ConversationLanguage,
    example: ConversationLanguage.ENGLISH,
  })
  @IsEnum(ConversationLanguage)
  language: ConversationLanguage;

  @ApiProperty({
    description: "Level of the conversation",
    enum: ConversationLevel,
    example: ConversationLevel.INTERMEDIATE,
  })
  @IsEnum(ConversationLevel)
  level: ConversationLevel;

  @ApiPropertyOptional({
    description: "Topic or theme of the conversation",
    example: "Travel and Tourism",
  })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({
    description: "Special instructions for the AI",
    example: "Focus on pronunciation and grammar correction",
  })
  @IsOptional()
  @IsString()
  instructions?: string;
}
