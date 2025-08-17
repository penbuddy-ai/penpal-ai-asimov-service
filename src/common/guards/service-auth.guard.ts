import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";

@Injectable()
export class ServiceAuthGuard implements CanActivate {
  private readonly logger = new Logger(ServiceAuthGuard.name);
  private readonly apiKey: string;
  private readonly allowedServices: string[];

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>("AI_SERVICE_API_KEY") || "";
    this.allowedServices = this.configService.get<string>("ALLOWED_SERVICES")?.split(",") || ["frontend-service", "frontend-app", "auth-service"];

    if (!this.apiKey) {
      this.logger.warn("AI_SERVICE_API_KEY is not set. Service authentication is disabled!");
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    if (!this.apiKey && process.env.NODE_ENV !== "production") {
      this.logger.warn("Allowing access without API key in non-production environment");
      return true;
    }

    const apiKey = request.headers["x-api-key"] as string;
    const serviceName = request.headers["x-service-name"] as string;

    if (!apiKey) {
      this.logger.warn("Request denied: Missing API key");
      throw new UnauthorizedException("API key is required");
    }

    if (!serviceName || !this.allowedServices.includes(serviceName)) {
      this.logger.warn(`Request denied: Service ${serviceName} not allowed`);
      throw new UnauthorizedException("Service not authorized");
    }

    if (apiKey !== this.apiKey) {
      this.logger.warn(`Request denied: Invalid API key from ${serviceName}`);
      throw new UnauthorizedException("Invalid API key");
    }

    this.logger.log(`Authorized request from service: ${serviceName}`);
    return true;
  }
}
