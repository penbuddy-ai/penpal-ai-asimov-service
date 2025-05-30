import { HttpService } from "@nestjs/axios";
import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

@Injectable()
export class DbClientService {
  private readonly logger = new Logger(DbClientService.name);
  private readonly dbServiceUrl: string;
  private readonly apiKey: string;
  private readonly serviceName = "ai-service";

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.dbServiceUrl = this.configService.get<string>("DB_SERVICE_URL") || "http://localhost:3001/api/v1";
    this.apiKey = this.configService.get<string>("DB_SERVICE_API_KEY") || "";

    if (!this.apiKey) {
      this.logger.warn("DB_SERVICE_API_KEY not set! Inter-service authentication will fail.");
    }
  }

  private getHeaders() {
    return {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey,
      "x-service-name": this.serviceName,
    };
  }

  private async handleRequest<T>(promise: Promise<any>): Promise<T> {
    try {
      const response = await promise;
      return response.data;
    }
    catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const statusCode = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

      this.logger.error(
        `DB Service request failed: ${errorMessage}`,
        error.stack,
      );

      throw new HttpException(
        {
          statusCode,
          message: errorMessage,
          error: "DB Service Error",
        },
        statusCode,
      );
    }
  }

  // =======================
  // CONVERSATIONS ENDPOINTS
  // =======================

  async createConversation(data: any): Promise<any> {
    const request = firstValueFrom(
      this.httpService.post(`${this.dbServiceUrl}/conversations`, data, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  async getAllConversations(query?: any): Promise<any> {
    const params = new URLSearchParams(query).toString();
    const url = `${this.dbServiceUrl}/conversations${params ? `?${params}` : ""}`;

    const request = firstValueFrom(
      this.httpService.get(url, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  async getConversation(id: string): Promise<any> {
    const request = firstValueFrom(
      this.httpService.get(`${this.dbServiceUrl}/conversations/${id}`, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  async getUserConversations(userId: string): Promise<any> {
    const request = firstValueFrom(
      this.httpService.get(`${this.dbServiceUrl}/conversations/user/${userId}`, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  async updateConversation(id: string, data: any): Promise<any> {
    const request = firstValueFrom(
      this.httpService.patch(`${this.dbServiceUrl}/conversations/${id}`, data, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  async deleteConversation(id: string): Promise<any> {
    const request = firstValueFrom(
      this.httpService.delete(`${this.dbServiceUrl}/conversations/${id}`, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  async hardDeleteConversation(id: string): Promise<any> {
    const request = firstValueFrom(
      this.httpService.delete(`${this.dbServiceUrl}/conversations/${id}/hard`, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  // =================
  // MESSAGES ENDPOINTS
  // =================

  async createMessage(data: any): Promise<any> {
    const request = firstValueFrom(
      this.httpService.post(`${this.dbServiceUrl}/messages`, data, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  async getAllMessages(query: any): Promise<any> {
    const params = new URLSearchParams(query).toString();
    const url = `${this.dbServiceUrl}/messages${params ? `?${params}` : ""}`;

    const request = firstValueFrom(
      this.httpService.get(url, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  async getMessage(id: string): Promise<any> {
    const request = firstValueFrom(
      this.httpService.get(`${this.dbServiceUrl}/messages/${id}`, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  async updateMessage(id: string, data: any): Promise<any> {
    const request = firstValueFrom(
      this.httpService.patch(`${this.dbServiceUrl}/messages/${id}`, data, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  async markMessageAsRead(id: string): Promise<any> {
    const request = firstValueFrom(
      this.httpService.patch(`${this.dbServiceUrl}/messages/${id}/read`, {}, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  async addMessageCorrections(id: string, corrections: Record<string, any>): Promise<any> {
    const request = firstValueFrom(
      this.httpService.patch(`${this.dbServiceUrl}/messages/${id}/corrections`, corrections, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  async deleteMessage(id: string): Promise<any> {
    const request = firstValueFrom(
      this.httpService.delete(`${this.dbServiceUrl}/messages/${id}`, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  async deleteMessagesByConversation(conversationId: string): Promise<any> {
    const request = firstValueFrom(
      this.httpService.delete(`${this.dbServiceUrl}/messages/conversation/${conversationId}`, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  // =======================
  // DEPRECATED METHODS (pour compatibilité)
  // =======================

  /** @deprecated Use getAllMessages with conversationId query param */
  async getMessages(conversationId: string, query?: any): Promise<any> {
    const fullQuery = { ...query, conversationId };
    return this.getAllMessages(fullQuery);
  }

  // =================
  // PROGRESS ENDPOINTS
  // =================

  async createProgress(data: any): Promise<any> {
    const request = firstValueFrom(
      this.httpService.post(`${this.dbServiceUrl}/progress`, data, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  async getUserProgress(userId: string, query?: any): Promise<any> {
    const params = new URLSearchParams(query).toString();
    const url = `${this.dbServiceUrl}/progress/user/${userId}${params ? `?${params}` : ""}`;

    const request = firstValueFrom(
      this.httpService.get(url, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  // ==============
  // USER ENDPOINTS
  // ==============

  async getUser(userId: string): Promise<any> {
    const request = firstValueFrom(
      this.httpService.get(`${this.dbServiceUrl}/users/${userId}`, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  // ========================
  // AI CHARACTERS ENDPOINTS
  // ========================

  async getAICharacter(characterId: string): Promise<any> {
    const request = firstValueFrom(
      this.httpService.get(`${this.dbServiceUrl}/ai-characters/${characterId}`, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  async getAllAICharacters(): Promise<any> {
    const request = firstValueFrom(
      this.httpService.get(`${this.dbServiceUrl}/ai-characters`, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  // ===================
  // LANGUAGES ENDPOINTS
  // ===================

  async getLanguage(languageId: string): Promise<any> {
    const request = firstValueFrom(
      this.httpService.get(`${this.dbServiceUrl}/languages/${languageId}`, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }

  async getAllLanguages(): Promise<any> {
    const request = firstValueFrom(
      this.httpService.get(`${this.dbServiceUrl}/languages`, {
        headers: this.getHeaders(),
      }),
    );
    return this.handleRequest(request);
  }
}
