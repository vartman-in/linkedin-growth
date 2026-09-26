/**
 * AI Provider Abstraction Layer
 * Supports multiple LLM providers with unified interface
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface AIProviderConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  responseFormat?: 'text' | 'json';
}

export interface AIProvider {
  complete(prompt: string, options?: AICompletionOptions): Promise<string>;
  completeStructured<T>(prompt: string, schema: any, options?: AICompletionOptions): Promise<T>;
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    this.model = config.model || 'gpt-4-turbo-preview';
  }

  async complete(prompt: string, options: AICompletionOptions = {}): Promise<string> {
    try {
      const messages: any[] = [];
      
      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async completeStructured<T>(prompt: string, schema: any, options: AICompletionOptions = {}): Promise<T> {
    try {
      const messages: any[] = [];
      
      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      
      messages.push({ 
        role: 'user', 
        content: `${prompt}\n\nRespond with valid JSON matching this structure. Do not include any text outside the JSON.`
      });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 4000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content) as T;
    } catch (error: any) {
      throw new Error(`OpenAI structured completion error: ${error.message}`);
    }
  }
}

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'claude-3-opus-20240229';
  }

  async complete(prompt: string, options: AICompletionOptions = {}): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens ?? 2000,
        system: options.systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ],
      });

      return response.content[0]?.type === 'text' ? response.content[0].text : '';
    } catch (error: any) {
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  async completeStructured<T>(prompt: string, schema: any, options: AICompletionOptions = {}): Promise<T> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens ?? 4000,
        system: `${options.systemPrompt || ''}\n\nAlways respond with valid JSON. Do not include any text outside the JSON.`,
        messages: [
          { role: 'user', content: prompt }
        ],
      });

      const content = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
      // Extract JSON from response (Anthropic may include markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      return JSON.parse(jsonStr) as T;
    } catch (error: any) {
      throw new Error(`Anthropic structured completion error: ${error.message}`);
    }
  }
}

export function createAIProvider(config: AIProviderConfig): AIProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

// Singleton instance
let aiProviderInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!aiProviderInstance) {
    const provider = process.env.AI_PROVIDER as 'openai' | 'anthropic' || 'openai';
    const apiKey = process.env.AI_API_KEY;
    
    if (!apiKey) {
      throw new Error('AI_API_KEY environment variable is required');
    }

    aiProviderInstance = createAIProvider({
      provider,
      apiKey,
      model: process.env.AI_MODEL,
      baseUrl: process.env.AI_BASE_URL,
    });
  }

  return aiProviderInstance;
}

export function resetAIProvider(): void {
  aiProviderInstance = null;
}
