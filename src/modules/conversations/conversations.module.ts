import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";

import { CommonModule } from "../../common/common.module";
import { ConversationsController } from "./conversations.controller";
import { ConversationsService } from "./conversations.service";

@Module({
  imports: [CommonModule, HttpModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
