import { Injectable } from "@nestjs/common";
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  register,
} from "prom-client";

@Injectable()
export class PrometheusService {
  private readonly aiRequestsTotal: Counter<string>;
  private readonly aiRequestDuration: Histogram<string>;
  private readonly aiTokensConsumed: Counter<string>;
  private readonly aiCostsTotal: Counter<string>;
  private readonly aiActiveConnections: Gauge<string>;
  private readonly aiCacheHits: Counter<string>;
  private readonly aiConversationsCreated: Counter<string>;
  private readonly aiMessagesProcessed: Counter<string>;
  private readonly aiProvidersHealth: Gauge<string>;
  private readonly aiRateLimitHits: Counter<string>;

  constructor() {
    // Enable default metrics collection
    collectDefaultMetrics({ prefix: "ai_service_" });

    // AI Requests metrics
    this.aiRequestsTotal = new Counter({
      name: "ai_requests_total",
      help: "Total number of AI requests",
      labelNames: ["endpoint", "method", "status", "provider", "model"],
    });

    this.aiRequestDuration = new Histogram({
      name: "ai_request_duration_seconds",
      help: "Duration of AI requests in seconds",
      labelNames: ["endpoint", "provider", "model"],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    });

    // Tokens and costs
    this.aiTokensConsumed = new Counter({
      name: "ai_tokens_consumed_total",
      help: "Total number of AI tokens consumed",
      labelNames: ["provider", "model", "type"], // type: prompt, completion
    });

    this.aiCostsTotal = new Counter({
      name: "ai_costs_total",
      help: "Total cost of AI usage in USD",
      labelNames: ["provider", "model", "user_id"],
    });

    // Active connections
    this.aiActiveConnections = new Gauge({
      name: "ai_active_websocket_connections",
      help: "Number of active WebSocket connections",
    });

    // Cache metrics
    this.aiCacheHits = new Counter({
      name: "ai_cache_operations_total",
      help: "Total number of cache operations",
      labelNames: ["operation", "result"], // operation: get, set; result: hit, miss
    });

    // Business metrics
    this.aiConversationsCreated = new Counter({
      name: "ai_conversations_created_total",
      help: "Total number of conversations created",
      labelNames: ["language", "level", "type"], // type: tutor, conversation-partner
    });

    this.aiMessagesProcessed = new Counter({
      name: "ai_messages_processed_total",
      help: "Total number of messages processed",
      labelNames: ["language", "level", "type"],
    });

    // Provider health
    this.aiProvidersHealth = new Gauge({
      name: "ai_providers_health_status",
      help: "Health status of AI providers (1 = healthy, 0 = unhealthy)",
      labelNames: ["provider"],
    });

    // Rate limiting
    this.aiRateLimitHits = new Counter({
      name: "ai_rate_limit_hits_total",
      help: "Total number of rate limit hits",
      labelNames: ["endpoint", "user_id"],
    });
  }

  // Request metrics
  incrementRequests(
    endpoint: string,
    method: string,
    status: string,
    provider?: string,
    model?: string,
  ) {
    this.aiRequestsTotal.inc({
      endpoint,
      method,
      status,
      provider: provider || "unknown",
      model: model || "unknown",
    });
  }

  recordRequestDuration(
    endpoint: string,
    duration: number,
    provider?: string,
    model?: string,
  ) {
    this.aiRequestDuration.observe(
      {
        endpoint,
        provider: provider || "unknown",
        model: model || "unknown",
      },
      duration,
    );
  }

  // Token and cost metrics
  incrementTokens(
    provider: string,
    model: string,
    tokens: number,
    type: "prompt" | "completion",
  ) {
    this.aiTokensConsumed.inc(
      {
        provider,
        model,
        type,
      },
      tokens,
    );
  }

  incrementCosts(
    provider: string,
    model: string,
    cost: number,
    userId?: string,
  ) {
    this.aiCostsTotal.inc(
      {
        provider,
        model,
        user_id: userId || "unknown",
      },
      cost,
    );
  }

  // Connection metrics
  setActiveConnections(count: number) {
    this.aiActiveConnections.set(count);
  }

  incrementActiveConnections() {
    this.aiActiveConnections.inc();
  }

  decrementActiveConnections() {
    this.aiActiveConnections.dec();
  }

  // Cache metrics
  incrementCacheOperation(operation: "get" | "set", result: "hit" | "miss") {
    this.aiCacheHits.inc({
      operation,
      result,
    });
  }

  // Business metrics
  incrementConversations(language?: string, level?: string, type?: string) {
    this.aiConversationsCreated.inc({
      language: language || "unknown",
      level: level || "unknown",
      type: type || "unknown",
    });
  }

  incrementMessages(language?: string, level?: string, type?: string) {
    this.aiMessagesProcessed.inc({
      language: language || "unknown",
      level: level || "unknown",
      type: type || "unknown",
    });
  }

  // Provider health
  setProviderHealth(provider: string, isHealthy: boolean) {
    this.aiProvidersHealth.set({ provider }, isHealthy ? 1 : 0);
  }

  // Rate limiting
  incrementRateLimitHits(endpoint: string, userId?: string) {
    this.aiRateLimitHits.inc({
      endpoint,
      user_id: userId || "unknown",
    });
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
