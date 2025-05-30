import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

export class CreateMessageDto {
  @ApiProperty({
    description: "Content of the message",
    example: "Hello, I would like to practice my English conversation skills.",
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: "Role of the message sender",
    enum: MessageRole,
    example: MessageRole.USER,
  })
  @IsEnum(MessageRole)
  role: MessageRole;

  @ApiPropertyOptional({
    description: "Whether to request corrections for this message",
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requestCorrections?: boolean;

  @ApiPropertyOptional({
    description: "Additional metadata for the message",
    example: { audioUrl: "https://example.com/audio.mp3" },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
