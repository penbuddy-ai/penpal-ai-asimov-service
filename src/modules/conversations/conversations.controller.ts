import { CacheInterceptor, CacheKey, CacheTTL } from "@nestjs/cache-manager";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { ServiceAuthGuard } from "../../common/guards/service-auth.guard";
import { ConversationsService } from "./conversations.service";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { CreateMessageDto } from "./dto/create-message.dto";

@ApiTags("conversations")
@Controller("conversations")
@UseGuards(ServiceAuthGuard)
@ApiHeader({
  name: "x-api-key",
  description: "Clé API pour l'authentification inter-services",
  required: true,
})
@ApiHeader({
  name: "x-service-name",
  description: "Nom du service appelant (ex: frontend-service, auth-service)",
  required: true,
})
export class ConversationsController {
  private readonly logger = new Logger(ConversationsController.name);

  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new conversation" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "The conversation has been successfully created.",
  })
  @ApiResponse({ status: 400, description: "Bad request - invalid input data." })
  @ApiResponse({ status: 500, description: "Internal server error during conversation creation." })
  @ApiBody({ type: CreateConversationDto })
  async create(@Body() createConversationDto: CreateConversationDto) {
    this.logger.log(`Creating new conversation for user: ${createConversationDto.userId}`);
    return this.conversationsService.create(createConversationDto);
  }

  @Get(":id")
  @UseInterceptors(CacheInterceptor)
  @CacheKey("conversation_by_id")
  @CacheTTL(3600)
  @ApiOperation({ summary: "Get conversation by ID" })
  @ApiParam({ name: "id", type: "string", description: "Conversation ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Return the conversation.",
  })
  @ApiResponse({ status: 404, description: "Conversation not found." })
  @ApiResponse({ status: 500, description: "Internal server error while retrieving conversation." })
  async findOne(@Param("id") id: string) {
    this.logger.log(`Retrieving conversation with ID: ${id}`);
    return this.conversationsService.findOne(id);
  }

  @Get("user/:userId")
  @UseInterceptors(CacheInterceptor)
  @CacheKey("user_conversations")
  @CacheTTL(1800)
  @ApiOperation({ summary: "Get conversations for a user" })
  @ApiParam({ name: "userId", type: "string", description: "User ID" })
  @ApiQuery({ name: "page", required: false, type: Number, description: "Page number" })
  @ApiQuery({ name: "limit", required: false, type: Number, description: "Items per page" })
  @ApiQuery({ name: "language", required: false, type: String, description: "Filter by language" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Return user conversations.",
  })
  @ApiResponse({ status: 500, description: "Internal server error while retrieving user conversations." })
  async findByUser(
    @Param("userId") userId: string,
    @Query() query: any,
  ) {
    this.logger.log(`Retrieving conversations for user: ${userId}`);
    return this.conversationsService.findByUser(userId, query);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update conversation" })
  @ApiParam({ name: "id", type: "string", description: "Conversation ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "The conversation has been successfully updated.",
  })
  @ApiResponse({ status: 400, description: "Bad request - invalid input data." })
  @ApiResponse({ status: 404, description: "Conversation not found." })
  @ApiResponse({ status: 500, description: "Internal server error while updating conversation." })
  async update(@Param("id") id: string, @Body() updateData: any) {
    this.logger.log(`Updating conversation with ID: ${id}`);
    return this.conversationsService.update(id, updateData);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete conversation" })
  @ApiParam({ name: "id", type: "string", description: "Conversation ID" })
  @ApiResponse({ status: 204, description: "The conversation has been successfully deleted." })
  @ApiResponse({ status: 404, description: "Conversation not found." })
  @ApiResponse({ status: 500, description: "Internal server error while deleting conversation." })
  async remove(@Param("id") id: string): Promise<void> {
    this.logger.log(`Deleting conversation with ID: ${id}`);
    await this.conversationsService.remove(id);
  }

  @Post(":id/messages")
  @ApiOperation({ summary: "Add message to conversation" })
  @ApiParam({ name: "id", type: "string", description: "Conversation ID" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "The message has been successfully added.",
  })
  @ApiResponse({ status: 400, description: "Bad request - invalid input data." })
  @ApiResponse({ status: 404, description: "Conversation not found." })
  @ApiResponse({ status: 500, description: "Internal server error while adding message." })
  @ApiBody({ type: CreateMessageDto })
  async addMessage(
    @Param("id") conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    this.logger.log(`Adding message to conversation: ${conversationId}`);
    return this.conversationsService.addMessage(
      conversationId,
      createMessageDto,
    );
  }

  @Get(":id/messages")
  @UseInterceptors(CacheInterceptor)
  @CacheKey("conversation_messages")
  @CacheTTL(1800)
  @ApiOperation({ summary: "Get messages from conversation" })
  @ApiParam({ name: "id", type: "string", description: "Conversation ID" })
  @ApiQuery({ name: "page", required: false, type: Number, description: "Page number" })
  @ApiQuery({ name: "limit", required: false, type: Number, description: "Items per page" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Return conversation messages.",
  })
  @ApiResponse({ status: 404, description: "Conversation not found." })
  @ApiResponse({ status: 500, description: "Internal server error while retrieving messages." })
  async getMessages(
    @Param("id") conversationId: string,
    @Query() query: any,
  ) {
    this.logger.log(`Retrieving messages for conversation: ${conversationId}`);
    return this.conversationsService.getMessages(conversationId, query);
  }
}
