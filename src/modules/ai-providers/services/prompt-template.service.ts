import { Injectable } from "@nestjs/common";

import { LoggerService } from "../../../common/services/logger.service";
import { PromptContext, PromptTemplate } from "../interfaces/ai-provider.interface";

@Injectable()
export class PromptTemplateService {
  private readonly templates: Map<string, PromptTemplate> = new Map();

  constructor(private readonly logger: LoggerService) {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: PromptTemplate[] = [
      // Conversation Templates
      {
        id: "conversation_tutor",
        name: "Language Tutor",
        description: "AI tutor for language learning conversations",
        template: `You are a friendly and encouraging {{language}} language tutor. Your student is at a {{level}} level and wants to practice conversation skills.

LEVEL-SPECIFIC GUIDELINES:

FOR BEGINNER LEVEL:
- Use VERY simple words and short sentences (5-7 words max)
- Speak like you're talking to someone who has NEVER studied {{language}} before
- Use present tense mainly (I am, you are, this is...)
- Include basic vocabulary explanations when needed
- Add simple translations or explanations in parentheses occasionally
- Ask ONE simple question at a time
- Repeat important words
- Example: "Hello! I am good. How are you? (How = comment)" instead of complex sentences

FOR INTERMEDIATE LEVEL:
- Use everyday vocabulary and moderate sentence length
- Mix present and past tenses
- Provide gentle corrections with explanations
- Ask follow-up questions to encourage speaking

FOR ADVANCED LEVEL:
- Use natural, flowing language
- Include idioms and complex grammar
- Focus on nuance and cultural context
- Challenge with sophisticated topics

Previous conversation context:
{{conversationHistory}}

Student's message: "{{userMessage}}"

Respond as a helpful tutor, adapting your language complexity to the {{level}} level. For beginners, be extra simple and clear.`,
        variables: ["language", "level", "conversationHistory", "userMessage"],
        category: "conversation",
      },

      {
        id: "conversation_friend",
        name: "Conversation Partner",
        description: "AI conversation partner for casual practice",
        template: `You are a friendly conversation partner helping someone practice {{language}}. Act like a native speaker friend who is patient and helpful.

ADAPT YOUR LANGUAGE TO THE {{level}} LEVEL:

FOR BEGINNER LEVEL:
- Use SUPER simple words only (yes, no, good, bad, I, you, like, want...)
- Keep sentences very short (3-5 words)
- Speak like talking to someone learning their first {{language}} words
- Repeat key words: "Good! That is good!"
- Use basic present tense only
- Be very encouraging and patient
- Example: "Hi! I am fine. You good?" instead of "Hey! I'm doing great, how about you?"

FOR INTERMEDIATE LEVEL:
- Use casual, everyday language
- Mix tenses naturally but keep it simple
- Show genuine interest in their topics
- Be encouraging and friendly

FOR ADVANCED LEVEL:
- Use natural, native-level conversation
- Include slang and expressions
- Challenge them with interesting topics
- Be more spontaneous and creative

Context: {{conversationHistory}}

Their message: "{{userMessage}}"

Respond as a friendly conversation partner, matching the {{level}} complexity. For beginners, be extremely simple and clear.`,
        variables: ["language", "level", "conversationHistory", "userMessage"],
        category: "conversation",
      },

      // Correction Templates
      {
        id: "grammar_correction",
        name: "Grammar Correction",
        description: "Detailed grammar analysis and correction",
        template: `Analyze the following {{language}} text for important grammatical and vocabulary errors. Focus on meaningful issues that affect comprehension and language learning.

Text: "{{text}}"
Level: {{level}}

IMPORTANT GUIDELINES:
- IGNORE capitalization errors (e.g., "hi" vs "Hi")
- IGNORE punctuation spacing (e.g., spaces before question marks)
- IGNORE minor punctuation issues unless they severely affect meaning
- FOCUS ON: verb tenses, subject-verb agreement, word order, vocabulary usage, prepositions, articles (a/an/the)
- FOCUS ON: sentence structure and meaningful grammatical mistakes

EXPLANATION STYLE BASED ON LEVEL:

FOR BEGINNER LEVEL:
- Use VERY simple explanations
- Explain basic grammar rules in simple terms
- Use examples with basic vocabulary
- Be extra encouraging ("Good try!" "Almost there!")
- Focus on 1-2 main errors only
- Example: "Use 'I am' not 'I is'. We always say 'I am happy'."

FOR INTERMEDIATE/ADVANCED LEVELS:
- Provide detailed grammatical explanations
- Include multiple examples and rules
- Challenge with more complex corrections

Please provide:
1. **Corrected Version**: The text with ONLY major grammatical/vocabulary errors fixed
2. **Error Analysis**: List each SIGNIFICANT error with explanation adapted to {{level}} level
3. **Grammar Rules**: Simple rules for beginners, detailed for others
4. **Learning Tips**: Level-appropriate suggestions

Focus on errors that truly impact language learning and communication effectiveness.`,
        variables: ["language", "text", "level"],
        category: "correction",
      },

      {
        id: "style_improvement",
        name: "Style Improvement",
        description: "Writing style analysis and suggestions",
        template: `Analyze and improve the writing style of this {{language}} text:

Text: "{{text}}"

Please provide:
1. **Style Assessment**: Evaluate formality, clarity, and flow
2. **Improved Version**: Rewrite with better style
3. **Specific Changes**: Explain each improvement made
4. **Style Tips**: General advice for better writing

Consider the {{level}} level of the learner and provide appropriate suggestions.`,
        variables: ["language", "text", "level"],
        category: "correction",
      },

      // Analysis Templates
      {
        id: "vocabulary_analysis",
        name: "Vocabulary Analysis",
        description: "Vocabulary usage analysis and enhancement",
        template: `Analyze the vocabulary usage in this {{language}} text and suggest improvements:

Text: "{{text}}"

For a {{level}} level learner, please provide:
1. **Vocabulary Assessment**: Current level and appropriateness
2. **Enhanced Version**: Text with improved vocabulary
3. **Word Explanations**: Meaning and usage of new words suggested
4. **Vocabulary Building Tips**: How to expand vocabulary at this level

Focus on making the vocabulary more sophisticated while remaining appropriate for the learner's level.`,
        variables: ["language", "text", "level"],
        category: "analysis",
      },

      // System Templates
      {
        id: "conversation_starter",
        name: "Conversation Starter",
        description: "Generate conversation starters for practice",
        template: `Generate engaging conversation starters for a {{level}} level {{language}} learner.

Topic interests: {{topics}}

Create 5 conversation starters that are:
- Appropriate for {{level}} level
- Engaging and interesting
- Encourage extended dialogue
- Cover different conversation skills (asking questions, expressing opinions, describing experiences)

Format each starter with a brief explanation of what conversation skills it practices.`,
        variables: ["level", "language", "topics"],
        category: "system",
      },
    ];

    defaultTemplates.forEach((template) => {
      this.templates.set(template.id, template);
    });

    this.logger.log(`Initialized ${defaultTemplates.length} default prompt templates`, "PromptTemplateService");
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: PromptTemplate["category"]): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(
      template => template.category === category,
    );
  }

  addTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
    this.logger.log(`Added new template: ${template.id}`, "PromptTemplateService");
  }

  renderTemplate(templateId: string, context: PromptContext): string {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let renderedTemplate = template.template;

    // Replace template variables with context values
    template.variables.forEach((variable) => {
      const placeholder = `{{${variable}}}`;
      let value = "";

      switch (variable) {
        case "language":
          value = context.language || "English";
          break;
        case "level":
          value = context.level || "intermediate";
          break;
        case "userMessage":
          value = context.userMessage || "";
          break;
        case "conversationHistory":
          value = this.formatConversationHistory(context.conversationHistory || []);
          break;
        case "text":
          value = context.userMessage || "";
          break;
        case "topics":
          value = context.additionalContext?.topics || "general conversation";
          break;
        default:
          value = context.additionalContext?.[variable] || "";
      }

      renderedTemplate = renderedTemplate.replace(new RegExp(placeholder, "g"), value);
    });

    return renderedTemplate;
  }

  private formatConversationHistory(messages: any[]): string {
    if (!messages || messages.length === 0) {
      return "No previous conversation.";
    }

    return messages
      .slice(-5) // Only include last 5 messages for context
      .map(msg => `${msg.role === "user" ? "Student" : "Tutor"}: ${msg.content}`)
      .join("\n");
  }

  validateTemplate(template: PromptTemplate): string[] {
    const errors: string[] = [];

    if (!template.id || template.id.trim() === "") {
      errors.push("Template ID is required");
    }

    if (!template.name || template.name.trim() === "") {
      errors.push("Template name is required");
    }

    if (!template.template || template.template.trim() === "") {
      errors.push("Template content is required");
    }

    if (!Array.isArray(template.variables)) {
      errors.push("Template variables must be an array");
    }

    // Check if all variables in template are declared
    const variablesInTemplate = this.extractVariablesFromTemplate(template.template);
    const undeclaredVariables = variablesInTemplate.filter(
      variable => !template.variables.includes(variable),
    );

    if (undeclaredVariables.length > 0) {
      errors.push(`Undeclared variables found: ${undeclaredVariables.join(", ")}`);
    }

    return errors;
  }

  private extractVariablesFromTemplate(template: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];

    for (const match of template.matchAll(regex)) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }
}
