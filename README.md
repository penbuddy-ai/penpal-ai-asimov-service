# Penpal AI - AI Service

AI Service for the Penpal AI language learning platform. This service handles AI-powered conversations, language corrections, and learning progress tracking.

## 🚀 Features

- **AI Conversations**: Real-time conversations with OpenAI GPT-4 and Anthropic Claude
- **Language Tutoring**: Specialized AI tutors for different languages and proficiency levels
- **Text Analysis**: Grammar, style, and vocabulary analysis with educational feedback
- **Prompt Templates**: Dynamic template system for consistent AI interactions
- **Multi-Provider Support**: OpenAI GPT-4 with extensible architecture for additional providers
- **Language Corrections**: Intelligent grammar and pronunciation corrections
- **Progress Tracking**: Learning analytics and personalized recommendations
- **WebSocket Support**: Real-time chat functionality
- **Caching**: Redis-based response caching for performance

## 🏗️ Architecture

This service is part of the Penpal AI microservices architecture:

- **Port**: 3003
- **Database**: Communicates with db-service via HTTP
- **Cache**: Redis for AI response caching
- **AI Providers**: OpenAI GPT-4, Anthropic Claude
- **Real-time**: WebSocket for live conversations

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Redis
- OpenAI API Key
- Anthropic Claude API Key (optional)

## 🛠️ Installation

### Local Development

1. **Clone and install dependencies**:

```bash
npm install
```

2. **Environment setup**:

```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Start development server**:

```bash
npm run start:dev
```

### Docker Development

1. **Start with Docker Compose**:

```bash
docker-compose up -d
```

2. **View logs**:

```bash
docker-compose logs -f ai-service
```

## 🔧 Configuration

### Environment Variables

| Variable               | Description            | Default                        |
| ---------------------- | ---------------------- | ------------------------------ |
| `NODE_ENV`             | Environment            | `development`                  |
| `PORT`                 | Service port           | `3003`                         |
| `DB_SERVICE_URL`       | Database service URL   | `http://localhost:3001/api/v1` |
| `REDIS_HOST`           | Redis host             | `localhost`                    |
| `OPENAI_API_KEY`       | OpenAI API key         | Required                       |
| `OPENAI_ORGANIZATION`  | OpenAI organization ID | Optional                       |
| `OPENAI_DEFAULT_MODEL` | Default OpenAI model   | `gpt-4`                        |
| `DEFAULT_AI_PROVIDER`  | Default AI provider    | `openai`                       |
| `CLAUDE_API_KEY`       | Claude API key         | Optional                       |

See `env.example` for complete configuration.

## 📚 API Documentation

### Health Endpoints

- `GET /api/v1/health` - Service health status
- `GET /api/v1/health/ready` - Readiness check
- `GET /api/v1/health/live` - Liveness check

### AI Provider Endpoints

- `POST /api/v1/ai/chat` - Generate general chat responses
- `POST /api/v1/ai/tutor` - Generate language tutor responses with educational context
- `POST /api/v1/ai/conversation-partner` - Generate casual conversation partner responses
- `POST /api/v1/ai/analyze` - Analyze text for grammar, style, or vocabulary improvements
- `GET /api/v1/ai/conversation-starters` - Generate conversation practice prompts
- `GET /api/v1/ai/models` - Get available AI models for each provider
- `GET /api/v1/ai/providers` - Get available AI providers and default configuration
- `GET /api/v1/ai/health` - Check AI provider connection status

### Conversation Endpoints

- `POST /api/v1/conversations` - Create conversation
- `GET /api/v1/conversations/:id` - Get conversation
- `GET /api/v1/conversations/user/:userId` - Get user conversations
- `PATCH /api/v1/conversations/:id` - Update conversation
- `DELETE /api/v1/conversations/:id` - Delete conversation

### Message Endpoints

- `POST /api/v1/conversations/:id/messages` - Add message
- `GET /api/v1/conversations/:id/messages` - Get messages

### Interactive Documentation

Access Swagger UI at: `http://localhost:3003/api/v1/docs`

## 🤖 AI Features

### Language Tutoring

The AI tutor provides educational conversations with:

- Context-aware responses based on user proficiency level
- Gentle error corrections with explanations
- Follow-up questions to encourage conversation
- Cultural context when relevant

### Text Analysis

Comprehensive text analysis including:

- **Grammar Analysis**: Error detection with educational explanations
- **Style Improvement**: Writing style suggestions and enhancements
- **Vocabulary Enhancement**: Advanced word choices and usage explanations

### Prompt Templates

Pre-built templates for consistent AI interactions:

- `conversation_tutor` - Educational language tutor
- `conversation_friend` - Casual conversation partner
- `grammar_correction` - Detailed grammar analysis
- `style_improvement` - Writing style enhancement
- `vocabulary_analysis` - Vocabulary improvement suggestions

### Multi-Provider Architecture

Extensible AI provider system:

- Primary: OpenAI GPT-4
- Planned: Anthropic Claude integration
- Fallback mechanisms for high availability
- Provider-specific optimizations

## 🧪 Testing

```bash
# Unit tests
npm run test

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

## 🔍 Code Quality

```bash
# Linting
npm run lint

# Format code
npm run format

# Build
npm run build
```

## 🐳 Docker

### Development

```bash
docker-compose up -d
```

### Production Build

```bash
docker build --target production -t penpal-ai-service .
```

## 📊 Monitoring

### Health Checks

- Service health: `GET /health`
- Dependencies status included
- AI provider connection validation
- Docker health checks configured

### Logging

- Winston logger with daily rotation
- Structured JSON logs in production
- Console logs in development
- AI usage and token tracking

## 🔗 Service Integration

### Database Service

- HTTP client for db-service communication
- Automatic retry and error handling
- Service token authentication

### Redis Cache

- AI response caching
- Session management
- Rate limiting storage

### AI Providers

- OpenAI GPT-4 integration
- Token usage monitoring
- Error handling and fallbacks
- Connection health validation

## 🚀 Deployment

### Docker Compose (Recommended)

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

```bash
# Build
npm run build

# Start production
npm run start:prod
```

## 🤝 Development

### Project Structure

```
src/
├── common/           # Shared services and utilities
├── modules/
│   ├── conversations/  # Conversation management
│   ├── health/        # Health monitoring
│   ├── ai-providers/  # ✅ AI integrations (OpenAI, templates, orchestration)
│   ├── corrections/   # Language corrections (planned)
│   ├── websocket/     # Real-time communication (planned)
│   └── progress/      # Learning progress tracking (planned)
└── main.ts           # Application entry point
```

### AI Providers Module Structure

```
src/modules/ai-providers/
├── interfaces/
│   └── ai-provider.interface.ts    # Core AI interfaces and types
├── dto/
│   └── ai-completion.dto.ts        # Request/response DTOs with validation
├── services/
│   ├── openai.service.ts           # OpenAI GPT integration
│   ├── prompt-template.service.ts  # Template management system
│   └── ai-provider.service.ts      # Main orchestrator service
├── ai-providers.controller.ts      # REST API endpoints
└── ai-providers.module.ts          # Module configuration
```

### Adding New Features

1. Create module in `src/modules/`
2. Add to `app.module.ts`
3. Follow existing patterns for services/controllers
4. Add tests and documentation

### Adding New AI Providers

1. Implement `IAIProvider` interface
2. Add provider service to `AIProviderService`
3. Update provider enum and configuration
4. Add provider-specific health checks

## 📝 License

Private - Penpal AI Team

## 🆘 Support

For development questions and issues:

- Check the API documentation at `/api/v1/docs`
- Review logs: `docker-compose logs ai-service`
- Verify health: `curl http://localhost:3003/api/v1/health`
- Check AI providers: `curl http://localhost:3003/api/v1/ai/health`
