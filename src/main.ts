import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from "@nestjs/swagger";
import * as compression from "compression";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { MetricsInterceptor } from "./common/interceptors/metrics.interceptor";

async function bootstrap() {
  const logger = new Logger("AI Service");
  logger.log("Starting Penpal AI - AI Service...");

  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });
  const configService = app.get(ConfigService);

  // Configuration du niveau de log basé sur l'environnement
  const logLevel = configService.get<string>("LOG_LEVEL") || "debug";
  logger.log(`Application running with LOG_LEVEL: ${logLevel}`);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: [
      "http://localhost:3000", // Frontend service
      "http://localhost:3001", // DB service
      "http://localhost:3002", // Auth service
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "x-api-key",
      "x-service-name",
    ],
    exposedHeaders: ["Content-Length", "Content-Range"],
    credentials: true,
    maxAge: 86400, // 24 hours
  });

  // Performance
  app.use(compression());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      disableErrorMessages:
        configService.get<boolean>("api.validation.disableErrorMessages")
        || false,
    }),
  );

  // Global Interceptors - Metrics
  app.useGlobalInterceptors(app.get(MetricsInterceptor));

  // Global prefix
  const prefix = configService.get<string>("API_PREFIX") || "/api";
  const version = configService.get<string>("API_VERSION") || "v1";
  const globalPrefix = `${prefix}/${version}`;
  app.setGlobalPrefix(globalPrefix);

  // Documentation
  const config = new DocumentBuilder()
    .setTitle("Penpal AI - AI Service")
    .setDescription(
      `
      Service IA pour l'application Penpal AI.
      
      ## Caractéristiques
      
      - **Conversations IA**: Intégration OpenAI GPT-4 et Anthropic Claude
      - **Corrections linguistiques**: Analyse grammaticale et suggestions
      - **Suivi de progression**: Analytics d'apprentissage personnalisées
      - **WebSocket**: Communication temps réel
      - **Cache**: Optimisation des performances avec mise en cache
      
      ## Authentification Inter-Services
      
      Ce service utilise l'authentification par headers:
      - x-api-key: Clé API pour l'authentification
      - x-service-name: Nom du service appelant
      
      ## Configuration
      
      Consultez le fichier README.md pour plus d'informations.
    `,
    )
    .setVersion("1.0.0")
    .setContact("Penpal AI Team", "https://penpal.ai", "support@penpal.ai")
    .setLicense("MIT", "https://opensource.org/licenses/MIT")
    .addTag("conversations", "Gestion des conversations IA")
    .addTag("ai-providers", "Intégration fournisseurs IA")
    .addTag("corrections", "Corrections linguistiques")
    .addTag("progress", "Suivi de progression")
    .addTag("websocket", "Communication temps réel")
    .addTag("health", "Monitoring et statut de l'API")
    .addServer(`http://localhost:${configService.get<number>("PORT") || 3003}`)
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    extraModels: [],
  });

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: "none",
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      displayRequestDuration: true,
    },
    customSiteTitle: "Penpal AI - AI Service API Documentation",
    customCss: ".swagger-ui .topbar { display: none }",
  };

  SwaggerModule.setup(`${globalPrefix}/docs`, app, document, customOptions);

  // Start server
  await app.listen(configService.get<number>("PORT") || 3003);
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(
    `API documentation available at: ${await app.getUrl()}${globalPrefix}/docs`,
  );
  logger.log("AI Service is ready to accept connections");
}

bootstrap().catch((error) => {
  console.error("Failed to start AI service:", error);
  process.exit(1);
});
