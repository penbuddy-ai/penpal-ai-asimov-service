import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { catchError, tap } from "rxjs/operators";

import { PrometheusService } from "../../modules/metrics/prometheus.service";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(private readonly prometheusService: PrometheusService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    const endpoint = request.route?.path || request.url;
    const method = request.method;

    return next.handle().pipe(
      tap((data) => {
        const duration = (Date.now() - startTime) / 1000;
        const status = response.statusCode;

        // Record basic request metrics
        this.prometheusService.incrementRequests(
          endpoint,
          method,
          status.toString(),
        );
        this.prometheusService.recordRequestDuration(endpoint, duration);

        // Extract AI-specific metrics if available
        this.extractAIMetrics(request, data);
      }),
      catchError((error) => {
        const duration = (Date.now() - startTime) / 1000;
        const status = error.status || 500;

        this.prometheusService.incrementRequests(
          endpoint,
          method,
          status.toString(),
        );
        this.prometheusService.recordRequestDuration(endpoint, duration);

        throw error;
      }),
    );
  }

  private extractAIMetrics(request: any, responseData: any) {
    try {
      const endpoint = request.route?.path || request.url;

      // Extract query parameters for context
      const language = request.query?.language;
      const level = request.query?.level;
      const userId = request.query?.userId;

      // Track different types of AI interactions
      if (endpoint.includes("/ai/chat")) {
        this.prometheusService.incrementMessages(language, level, "chat");
      }
      else if (endpoint.includes("/ai/tutor")) {
        this.prometheusService.incrementMessages(language, level, "tutor");
      }
      else if (endpoint.includes("/ai/conversation-partner")) {
        this.prometheusService.incrementMessages(
          language,
          level,
          "conversation-partner",
        );
      }
      else if (endpoint.includes("/ai/analyze")) {
        this.prometheusService.incrementMessages(language, level, "analyze");
      }

      // Track conversation creation
      if (endpoint.includes("/conversations") && request.method === "POST") {
        this.prometheusService.incrementConversations(language, level, "new");
      }

      // Extract token and cost information if present in response
      if (responseData && typeof responseData === "object") {
        if (responseData.usage) {
          const { prompt_tokens, completion_tokens } = responseData.usage;
          const provider = responseData.provider || "openai";
          const model = responseData.model || "unknown";

          if (prompt_tokens) {
            this.prometheusService.incrementTokens(
              provider,
              model,
              prompt_tokens,
              "prompt",
            );
          }
          if (completion_tokens) {
            this.prometheusService.incrementTokens(
              provider,
              model,
              completion_tokens,
              "completion",
            );
          }
        }

        if (responseData.cost && responseData.cost > 0) {
          const provider = responseData.provider || "openai";
          const model = responseData.model || "unknown";
          this.prometheusService.incrementCosts(
            provider,
            model,
            responseData.cost,
            userId,
          );
        }
      }
    }
    catch (error) {
      this.logger.warn("Error extracting AI metrics:", error.message);
    }
  }
}
