/**
 * LLM Configuration and Token Costs
 * Centralized configuration for different LLM models and their usage
 */

export type UserPlan = 'free' | 'premium' | 'pro' | null; // null = no auth

export interface LLMConfig {
  provider: 'openrouter' | 'xai';
  model: string;
  baseURL: string;
  maxTokens: number;
  temperature: number;
  apiKeyEnv: string;
  // Token cost per use (for future token tracking)
  tokenCost?: number;
}

/**
 * LLM configurations based on user plan and use case
 */
export const LLM_CONFIGS = {
  // Report generation models
  reportGeneration: {
    noAuth: {
      provider: 'xai',
      model: 'grok-4-1-fast-reasoning',
      baseURL: 'https://api.x.ai/v1',
      maxTokens: 4000,
      temperature: 0.7,
      apiKeyEnv: 'GROK_API_KEY',
      tokenCost: 5, // 5 tokens per report
    } as LLMConfig,
    free: {
      provider: 'openrouter',
      model: 'meta-llama/llama-3.3-70b-instruct',
      baseURL: 'https://openrouter.ai/api/v1',
      maxTokens: 8000,
      temperature: 0.7,
      apiKeyEnv: 'OPEN_ROUTER_KEY',
      tokenCost: 5, // 5 tokens per report
    } as LLMConfig,
    premium: {
      provider: 'openrouter',
      model: 'meta-llama/llama-3.3-70b-instruct',
      baseURL: 'https://openrouter.ai/api/v1',
      maxTokens: 16000,
      temperature: 0.7,
      apiKeyEnv: 'OPEN_ROUTER_KEY',
      tokenCost: 3, // 4 tokens per report
    } as LLMConfig,
    pro: {
      provider: 'openrouter',
      model: 'anthropic/claude-sonnet-4.5', // Better model for Pro
      baseURL: 'https://openrouter.ai/api/v1',
      maxTokens: 32000,
      temperature: 0.7,
      apiKeyEnv: 'OPEN_ROUTER_KEY',
      tokenCost: 2, // 3 tokens per report
    } as LLMConfig,
  },

  // Chat models
  chat: {
    questions: {
      provider: 'xai',
      model: 'grok-4-1-fast-reasoning',
      baseURL: 'https://api.x.ai/v1',
      maxTokens: 500,
      temperature: 0.7,
      apiKeyEnv: 'GROK_API_KEY',
      tokenCost: 1, // 1 token per question
    } as LLMConfig,
    edits: {
      provider: 'openrouter',
      model: 'anthropic/claude-4.5-haiku-20251001',
      baseURL: 'https://openrouter.ai/api/v1',
      maxTokens: 2000,
      temperature: 0.7,
      apiKeyEnv: 'OPEN_ROUTER_KEY',
      tokenCost: 2, // 2 tokens per edit
    } as LLMConfig,
    regenerate: {
      provider: 'openrouter',
      model: 'anthropic/claude-4.5-haiku-20251001',
      baseURL: 'https://openrouter.ai/api/v1',
      maxTokens: 5000,
      temperature: 0.7,
      apiKeyEnv: 'OPEN_ROUTER_KEY',
      tokenCost: 3, // 3 tokens per regeneration
    } as LLMConfig,
  },
};

/**
 * Default token/credit allocation for users
 */
export const DEFAULT_USER_TOKENS = {
  free: 20,
  premium: 130, // Premium users get credits (not unlimited), configurable later
  pro: 300,
};

/**
 * Report generation limits
 */
export const REPORT_LIMITS = {
  anonymous: 1, // Anonymous users can only create 1 report before login
  free: 5, // Free users limited by tokens (50 reports max)
  premium: 1000, // Premium users limited by credits (1000 reports max, configurable)
  pro: 3000,
};

/**
 * File upload limits (Size in bytes, Rows count)
 */
export const FILE_LIMITS = {
  anonymous: {
    maxSize: 2 * 1024 * 1024, // 2MB
    maxRows: 100,
  },
  free: {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxRows: 500,
  },
  premium: {
    maxSize: 20 * 1024 * 1024, // 20MB
    maxRows: 10000,
  },
  pro: {
    maxSize: 50 * 1024 * 1024, // 50MB
    maxRows: 50000,
  },
};

/**
 * Get LLM config for report generation based on user plan
 */
export function getReportGenerationConfig(userPlan: UserPlan): LLMConfig {
  if (!userPlan) {
    return LLM_CONFIGS.reportGeneration.noAuth;
  }
  if (userPlan === 'pro') {
    return LLM_CONFIGS.reportGeneration.pro;
  }
  if (userPlan === 'premium') {
    return LLM_CONFIGS.reportGeneration.premium;
  }
  return LLM_CONFIGS.reportGeneration.free;
}

/**
 * Get LLM config for chat based on request type
 */
export function getChatConfig(requestType: 'question' | 'edit' | 'regenerate'): LLMConfig {
  if (requestType === 'question') {
    return LLM_CONFIGS.chat.questions;
  }
  if (requestType === 'regenerate') {
    return LLM_CONFIGS.chat.regenerate;
  }
  return LLM_CONFIGS.chat.edits;
}

/**
 * Calculate dynamic report cost based on row count
 * Formula: Base Cost + (1 credit per 300 rows)
 */
export function calculateReportCost(rowCount: number, baseCost: number): number {
  // If base cost is 0 (Unlimited plans), return 0
  if (baseCost === 0) return 0;

  // Variable cost: 1 extra credit for every 300 rows
  const variableCost = Math.ceil(rowCount / 500);

  return baseCost + variableCost;
}
