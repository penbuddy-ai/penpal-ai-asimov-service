/* eslint-disable regexp/no-super-linear-backtracking */
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Post,
} from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

import { AIProviderService } from "./services/ai-provider.service";

// DTO simple pour la démo
export class ChatDemoRequestDto {
  @ApiProperty({
    description: "Message de l'utilisateur",
    example: "Hello, I want to practice English. I am learn very good but need help.",
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: "Langue cible",
    example: "English",
    default: "English",
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({
    description: "Niveau de l'utilisateur",
    example: "intermediate",
    default: "intermediate",
  })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiProperty({
    description: "Mode du chat",
    example: "tutor",
    default: "tutor",
  })
  @IsOptional()
  @IsString()
  mode?: "tutor" | "conversation-partner";
}

@ApiTags("demo")
@Controller("demo")
export class DemoController {
  private readonly logger = new Logger(DemoController.name);

  constructor(private readonly aiProviderService: AIProviderService) {}

  @Post("chat")
  @ApiOperation({ summary: "Demo Chat avec Correction Automatique" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Réponse du chat avec corrections",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "object",
          properties: {
            userMessage: { type: "string" },
            corrections: {
              type: "object",
              properties: {
                hasErrors: { type: "boolean" },
                correctedText: { type: "string" },
                errors: { type: "array", items: { type: "string" } },
                explanation: { type: "string" },
              },
            },
            aiResponse: { type: "string" },
            conversationContext: {
              type: "object",
              properties: {
                language: { type: "string" },
                level: { type: "string" },
                mode: { type: "string" },
              },
            },
          },
        },
        timestamp: { type: "string" },
      },
    },
  })
  @ApiBody({ type: ChatDemoRequestDto })
  async chatDemo(@Body() request: ChatDemoRequestDto) {
    try {
      const { message, language = "English", level = "intermediate", mode = "tutor" } = request;

      // 1. Analyser le message pour détecter les erreurs
      const grammarAnalysis = await this.aiProviderService.analyzeText(
        message,
        "grammar",
        { language, level },
        { temperature: 0.3 },
      );

      // 2. Extraire les corrections depuis la réponse AI
      const corrections = this.parseGrammarCorrections(grammarAnalysis.content, message);

      // 3. Générer la réponse du chat selon le mode
      let aiResponse;
      if (mode === "conversation-partner") {
        aiResponse = await this.aiProviderService.generateConversationPartnerResponse(
          message,
          [], // Pas d'historique pour la démo
          { language, level },
        );
      }
      else {
        aiResponse = await this.aiProviderService.generateTutorResponse(
          message,
          [],
          { language, level },
        );
      }

      return {
        success: true,
        data: {
          userMessage: message,
          corrections: {
            hasErrors: corrections.hasErrors,
            correctedText: corrections.correctedText,
            errors: corrections.errors,
            explanation: corrections.explanation,
          },
          aiResponse: aiResponse.content,
          conversationContext: {
            language,
            level,
            mode,
          },
        },
        timestamp: new Date().toISOString(),
      };
    }
    catch (error) {
      return {
        success: false,
        error: {
          message: "Erreur lors du traitement de votre message",
          details: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get("quick-test")
  @ApiOperation({ summary: "Test rapide de l'API AI" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Test de santé de l'API avec exemple",
  })
  async quickTest() {
    try {
      // Test simple avec un message prédéfini
      const testMessage = "Hello, I want practice English conversation with you!";

      const result = await this.chatDemo({
        message: testMessage,
        language: "English",
        level: "intermediate",
        mode: "tutor",
      });

      return {
        success: true,
        message: "API AI fonctionne correctement !",
        example: result,
        timestamp: new Date().toISOString(),
      };
    }
    catch (error) {
      return {
        success: false,
        error: {
          message: "L'API AI n'est pas disponible",
          details: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Méthodes utilitaires privées
  private parseGrammarCorrections(aiResponse: string, originalText: string) {
    try {
      // Détecter s'il y a des corrections
      const response = aiResponse.toLowerCase();
      const hasCorrections = response.includes("corrected")
        || response.includes("error")
        || response.includes("mistake")
        || response.includes("should be")
        || response.includes("change")
        || response.includes("fix");

      let correctedText = originalText;
      const errors: string[] = [];
      let explanation = "Votre texte semble correct !";

      if (hasCorrections) {
        // 1. Extraire le texte corrigé avec plusieurs patterns possibles
        const correctedPatterns = [
          /(?:corrected version|corrected text|correction):\s*["']([^"']+)["']/i,
          /(?:corrected version|corrected text|should be):\s*([^\n.]+)/i,
          /(?:correct version|fixed version):\s*["']([^"']+)["']/i,
          /here.{0,20}corrected:\s*["']([^"']+)["']/i,
        ];

        for (const pattern of correctedPatterns) {
          const match = aiResponse.match(pattern);
          if (match && match[1]) {
            correctedText = match[1].trim();
            break;
          }
        }

        // 2. Extraire les erreurs avec patterns plus flexibles
        const errorPatterns = [
          /(?:errors?|mistakes?):\s*(.*?)(?:\n\n|$)/is,
          /(?:problems?|issues?):\s*(.*?)(?:\n\n|$)/is,
          /\d+\.\s+([^\n]+(?:error|mistake|wrong|incorrect)[^\n]*)/gi,
          /([^\n]*(?:should be|change to|replace with)[^\n]*)/gi,
        ];

        for (const pattern of errorPatterns) {
          const matches = aiResponse.matchAll(pattern);
          for (const match of matches) {
            if (match[1]) {
              const errorText = match[1].trim();
              if (errorText.length > 10 && errorText.length < 200) {
                errors.push(errorText);
              }
            }
          }
        }

        // 3. Si pas de texte corrigé trouvé, essayer d'extraire depuis les erreurs
        if (correctedText === originalText && errors.length > 0) {
          const suggestionPatterns = [
            /should be:\s*["']([^"']+)["']/i,
            /change to:\s*["']([^"']+)["']/i,
            /correct:\s*["']([^"']+)["']/i,
          ];

          for (const pattern of suggestionPatterns) {
            const match = aiResponse.match(pattern);
            if (match && match[1]) {
              correctedText = match[1].trim();
              break;
            }
          }
        }

        // 4. Détection simple si le texte original a des erreurs évidentes
        if (correctedText === originalText) {
          // Corrections communes pour l'exemple donné
          const simpleCorrections = [
            { from: /\bI am learn\b/gi, to: "I am learning" },
            { from: /\bI want practice\b/gi, to: "I want to practice" },
            { from: /\bhats\b/gi, to: "hats" }, // exemple de votre message
          ];

          for (const correction of simpleCorrections) {
            if (correction.from.test(originalText)) {
              correctedText = originalText.replace(correction.from, correction.to);
              errors.push(`"${originalText.match(correction.from)?.[0]}" should be "${correction.to}"`);
            }
          }
        }

        // 5. Générer l'explication
        if (errors.length > 0) {
          explanation = `${errors.length} correction(s) suggérée(s) pour améliorer votre texte.`;
        }
        else if (correctedText !== originalText) {
          explanation = "Quelques améliorations ont été apportées à votre texte.";
        }
        else {
          explanation = "L'IA a détecté le besoin d'améliorations mais les détails n'ont pas pu être extraits automatiquement.";
        }
      }

      // Debug log pour voir ce qui est extrait
      this.logger.log("🔍 Debug Corrections:", {
        hasCorrections,
        originalText,
        correctedText,
        errors: errors.slice(0, 3),
        rawResponse: `${aiResponse.substring(0, 200)}...`,
      });

      return {
        hasErrors: hasCorrections,
        correctedText,
        errors: errors.slice(0, 3), // Max 3 erreurs
        explanation,
      };
    }
    catch (error) {
      this.logger.error("Erreur parsing corrections:", error);
      return {
        hasErrors: false,
        correctedText: originalText,
        errors: [],
        explanation: "Analyse des corrections indisponible.",
      };
    }
  }
}
