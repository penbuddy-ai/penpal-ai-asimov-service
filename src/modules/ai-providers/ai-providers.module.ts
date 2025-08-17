import { Module } from "@nestjs/common";

import { CommonModule } from "../../common/common.module";
import { AIProvidersController } from "./ai-providers.controller";
import { DemoController } from "./demo.controller";
import { AIProviderService } from "./services/ai-provider.service";
import { OpenAIService } from "./services/openai.service";
import { PromptTemplateService } from "./services/prompt-template.service";

@Module({
  imports: [CommonModule],
  controllers: [AIProvidersController, DemoController],
  providers: [
    OpenAIService,
    PromptTemplateService,
    AIProviderService,
  ],
  exports: [
    OpenAIService,
    PromptTemplateService,
    AIProviderService,
  ],
})
export class AIProvidersModule {}
