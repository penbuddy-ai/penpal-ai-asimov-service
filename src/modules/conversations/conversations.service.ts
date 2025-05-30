import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { DbClientService } from "../../common/services/db-client.service";
import { LoggerService } from "../../common/services/logger.service";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { CreateMessageDto } from "./dto/create-message.dto";

@Injectable()
export class ConversationsService {
  constructor(
    private readonly dbClient: DbClientService,
    private readonly logger: LoggerService,
  ) {}

  async create(createConversationDto: CreateConversationDto) {
    try {
      this.logger.log(
        `Creating conversation for user ${createConversationDto.userId}`,
        "ConversationsService",
      );

      const conversation = await this.dbClient.createConversation({
        ...createConversationDto,
        status: "active",
        messageCount: 0,
        lastActivity: new Date(),
      });

      this.logger.log(
        `Conversation created with ID: ${conversation.id}`,
        "ConversationsService",
      );

      return conversation;
    }
    catch (error) {
      this.logger.error(
        `Failed to create conversation: ${error.message}`,
        error.stack,
        "ConversationsService",
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Failed to create conversation",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      this.logger.log(`Fetching conversation with ID: ${id}`, "ConversationsService");

      const conversation = await this.dbClient.getConversation(id);

      if (!conversation) {
        throw new HttpException(
          `Conversation with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      return conversation;
    }
    catch (error) {
      this.logger.error(
        `Failed to fetch conversation ${id}: ${error.message}`,
        error.stack,
        "ConversationsService",
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Failed to fetch conversation",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findByUser(userId: string, query: any = {}) {
    try {
      this.logger.log(
        `Fetching conversations for user: ${userId}`,
        "ConversationsService",
      );

      const conversations = await this.dbClient.getAllConversations({
        ...query,
        userId,
      });

      return conversations;
    }
    catch (error) {
      this.logger.error(
        `Failed to fetch conversations for user ${userId}: ${error.message}`,
        error.stack,
        "ConversationsService",
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Failed to fetch user conversations",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateData: any) {
    try {
      this.logger.log(`Updating conversation with ID: ${id}`, "ConversationsService");

      // Verify conversation exists
      await this.findOne(id);

      const updatedConversation = await this.dbClient.updateConversation(id, {
        ...updateData,
        lastActivity: new Date(),
      });

      this.logger.log(
        `Conversation ${id} updated successfully`,
        "ConversationsService",
      );

      return updatedConversation;
    }
    catch (error) {
      this.logger.error(
        `Failed to update conversation ${id}: ${error.message}`,
        error.stack,
        "ConversationsService",
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Failed to update conversation",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      this.logger.log(`Deleting conversation with ID: ${id}`, "ConversationsService");

      // Verify conversation exists
      await this.findOne(id);

      const result = await this.dbClient.deleteConversation(id);

      this.logger.log(
        `Conversation ${id} deleted successfully`,
        "ConversationsService",
      );

      return result;
    }
    catch (error) {
      this.logger.error(
        `Failed to delete conversation ${id}: ${error.message}`,
        error.stack,
        "ConversationsService",
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Failed to delete conversation",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addMessage(conversationId: string, createMessageDto: CreateMessageDto) {
    try {
      this.logger.log(
        `Adding message to conversation ${conversationId}`,
        "ConversationsService",
      );

      // Verify conversation exists
      await this.findOne(conversationId);

      const message = await this.dbClient.createMessage({
        conversationId,
        ...createMessageDto,
        timestamp: new Date(),
      });

      // Update conversation's last activity and message count
      await this.dbClient.updateConversation(conversationId, {
        lastActivity: new Date(),
        $inc: { messageCount: 1 },
      });

      this.logger.log(
        `Message added to conversation ${conversationId}`,
        "ConversationsService",
      );

      return message;
    }
    catch (error) {
      this.logger.error(
        `Failed to add message to conversation ${conversationId}: ${error.message}`,
        error.stack,
        "ConversationsService",
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Failed to add message",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getMessages(conversationId: string, query: any = {}) {
    try {
      this.logger.log(
        `Fetching messages for conversation ${conversationId}`,
        "ConversationsService",
      );

      // Verify conversation exists
      await this.findOne(conversationId);

      const messages = await this.dbClient.getMessages(conversationId, query);

      return messages;
    }
    catch (error) {
      this.logger.error(
        `Failed to fetch messages for conversation ${conversationId}: ${error.message}`,
        error.stack,
        "ConversationsService",
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        "Failed to fetch messages",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
