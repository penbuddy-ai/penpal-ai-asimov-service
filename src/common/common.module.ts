import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";

import { DbClientService } from "./services/db-client.service";
import { LoggerService } from "./services/logger.service";

@Module({
  imports: [HttpModule],
  providers: [LoggerService, DbClientService],
  exports: [LoggerService, DbClientService],
})
export class CommonModule {}
