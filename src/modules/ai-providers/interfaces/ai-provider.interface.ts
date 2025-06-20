export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: Date;
};

export type AICompletionOptions = {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  conversationId?: string;
  userId?: string;
};

export type AICompletionResponse = {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: string;
};

export type IAIProvider = {
  generateCompletion: (
    messages: AIMessage[],
    options?: AICompletionOptions,
  ) => Promise<AICompletionResponse>;

  generateChatResponse: (
    messages: AIMessage[],
    systemPrompt?: string,
    options?: AICompletionOptions,
  ) => Promise<AICompletionResponse>;

  analyzeText: (
    text: string,
    analysisType: "grammar" | "style" | "vocabulary",
    options?: AICompletionOptions,
  ) => Promise<AICompletionResponse>;
};

export type PromptTemplate = {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: "conversation" | "correction" | "analysis" | "system";
  language?: string;
  level?: string;
};

export type PromptContext = {
  userId?: string;
  conversationId?: string;
  language?: string;
  level?: string;
  userMessage?: string;
  conversationHistory?: AIMessage[];
  additionalContext?: Record<string, any>;
};
