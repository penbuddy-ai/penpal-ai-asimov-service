import { Injectable, LoggerService as NestLoggerService } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as winston from "winston";
import * as DailyRotateFile from "winston-daily-rotate-file";

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    const logLevel = this.configService.get("LOG_LEVEL", "info");
    const serviceName = this.configService.get("SERVICE_NAME", "ai-service");
    const nodeEnv = this.configService.get("NODE_ENV", "development");

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
          winston.format.printf(({ timestamp, level, message, context, trace }) => {
            const contextStr = context ? ` [${context}]` : "";
            const traceStr = trace ? `\n${trace}` : "";
            return `${timestamp} [${serviceName}] ${level}${contextStr}: ${message}${traceStr}`;
          }),
        ),
      }),
    ];

    if (nodeEnv === "production") {
      transports.push(
        new DailyRotateFile({
          filename: "logs/error-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          level: "error",
          maxSize: this.configService.get("LOG_FILE_MAX_SIZE", "20m"),
          maxFiles: this.configService.get("LOG_FILE_MAX_FILES", "14d"),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new DailyRotateFile({
          filename: "logs/combined-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          maxSize: this.configService.get("LOG_FILE_MAX_SIZE", "20m"),
          maxFiles: this.configService.get("LOG_FILE_MAX_FILES", "14d"),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      transports,
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { context, trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
