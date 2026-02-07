// ============================================
// 💰 COST TRACKER - Real-time Cost Management
// ============================================
// Tracks costs for all 11 API providers
// Supports budgets, alerts, and analytics

export type ProviderId = 
  | 'groq' 
  | 'gemini' 
  | 'openrouter' 
  | 'mistral' 
  | 'cohere'
  | 'replicate' 
  | 'elevenlabs' 
  | 'e2b' 
  | 'firecrawl' 
  | 'tavily' 
  | 'resend';

export type TaskCategory = 
  | 'chat' 
  | 'vision' 
  | 'image_gen' 
  | 'audio_tts' 
  | 'audio_stt'
  | 'code_exec' 
  | 'search' 
  | 'scrape' 
  | 'email';

// ===== PRICING DATA (as of 2024) =====
export interface PricingTier {
  inputPer1kTokens?: number;
  outputPer1kTokens?: number;
  perRequest?: number;
  perMinute?: number;
  perImage?: number;
  perCharacter?: number;
  freeQuota?: number;
  freeQuotaUnit?: 'requests' | 'tokens' | 'minutes' | 'characters';
}

export interface ProviderPricing {
  id: ProviderId;
  name: string;
  category: TaskCategory[];
  models: Record<string, PricingTier>;
  rateLimits: {
    requestsPerMinute?: number;
    requestsPerDay?: number;
    tokensPerMinute?: number;
    tokensPerDay?: number;
  };
}

export const PROVIDER_PRICING: Record<ProviderId, ProviderPricing> = {
  groq: {
    id: 'groq',
    name: 'Groq',
    category: ['chat', 'audio_stt'],
    models: {
      'llama-3.3-70b-versatile': {
        inputPer1kTokens: 0.00059,
        outputPer1kTokens: 0.00079,
        freeQuota: 14400,
        freeQuotaUnit: 'requests',
      },
      'deepseek-r1-distill-llama-70b': {
        inputPer1kTokens: 0.00075,
        outputPer1kTokens: 0.00099,
      },
      'whisper-large-v3': {
        perMinute: 0.0005,
        freeQuota: 60,
        freeQuotaUnit: 'minutes',
      },
      'llama-3.2-90b-vision-preview': {
        inputPer1kTokens: 0.0009,
        outputPer1kTokens: 0.0009,
      },
    },
    rateLimits: {
      requestsPerMinute: 30,
      requestsPerDay: 14400,
      tokensPerMinute: 6000,
    },
  },

  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    category: ['chat', 'vision'],
    models: {
      'gemini-1.5-flash': {
        inputPer1kTokens: 0.000075,
        outputPer1kTokens: 0.0003,
        freeQuota: 1500,
        freeQuotaUnit: 'requests',
      },
      'gemini-1.5-pro': {
        inputPer1kTokens: 0.00125,
        outputPer1kTokens: 0.005,
        freeQuota: 50,
        freeQuotaUnit: 'requests',
      },
      'gemini-2.0-flash': {
        inputPer1kTokens: 0.0001,
        outputPer1kTokens: 0.0004,
      },
    },
    rateLimits: {
      requestsPerMinute: 15,
      requestsPerDay: 1500,
      tokensPerMinute: 32000,
    },
  },

  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    category: ['chat', 'vision', 'code_exec'],
    models: {
      'meta-llama/llama-3.2-3b-instruct:free': {
        inputPer1kTokens: 0,
        outputPer1kTokens: 0,
        freeQuota: 200,
        freeQuotaUnit: 'requests',
      },
      'anthropic/claude-3-haiku:beta': {
        inputPer1kTokens: 0.00025,
        outputPer1kTokens: 0.00125,
      },
      'anthropic/claude-3.5-sonnet': {
        inputPer1kTokens: 0.003,
        outputPer1kTokens: 0.015,
      },
      'openai/gpt-4o': {
        inputPer1kTokens: 0.005,
        outputPer1kTokens: 0.015,
      },
      'openai/gpt-4o-mini': {
        inputPer1kTokens: 0.00015,
        outputPer1kTokens: 0.0006,
      },
      'deepseek/deepseek-chat': {
        inputPer1kTokens: 0.00014,
        outputPer1kTokens: 0.00028,
      },
    },
    rateLimits: {
      requestsPerMinute: 20,
      requestsPerDay: 200,
    },
  },

  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    category: ['chat', 'code_exec'],
    models: {
      'mistral-large-latest': {
        inputPer1kTokens: 0.002,
        outputPer1kTokens: 0.006,
      },
      'mistral-small-latest': {
        inputPer1kTokens: 0.0002,
        outputPer1kTokens: 0.0006,
      },
      'codestral-latest': {
        inputPer1kTokens: 0.0002,
        outputPer1kTokens: 0.0006,
      },
      'open-mistral-nemo': {
        inputPer1kTokens: 0.00015,
        outputPer1kTokens: 0.00015,
        freeQuota: 1000000,
        freeQuotaUnit: 'tokens',
      },
    },
    rateLimits: {
      requestsPerMinute: 30,
      tokensPerMinute: 500000,
    },
  },

  cohere: {
    id: 'cohere',
    name: 'Cohere',
    category: ['chat', 'search'],
    models: {
      'command-r-plus': {
        inputPer1kTokens: 0.003,
        outputPer1kTokens: 0.015,
      },
      'command-r': {
        inputPer1kTokens: 0.0005,
        outputPer1kTokens: 0.0015,
      },
      'command-r-08-2024': {
        inputPer1kTokens: 0.00015,
        outputPer1kTokens: 0.0006,
        freeQuota: 1000,
        freeQuotaUnit: 'requests',
      },
    },
    rateLimits: {
      requestsPerMinute: 20,
      requestsPerDay: 1000,
    },
  },

  replicate: {
    id: 'replicate',
    name: 'Replicate',
    category: ['image_gen', 'audio_tts', 'vision'],
    models: {
      'sdxl': {
        perImage: 0.0023,
      },
      'stable-diffusion-3': {
        perImage: 0.035,
      },
      'flux-schnell': {
        perImage: 0.003,
      },
      'flux-pro': {
        perImage: 0.055,
      },
      'ideogram-v2': {
        perImage: 0.08,
      },
    },
    rateLimits: {
      requestsPerMinute: 10,
    },
  },

  elevenlabs: {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    category: ['audio_tts'],
    models: {
      'eleven_multilingual_v2': {
        perCharacter: 0.00003,
        freeQuota: 10000,
        freeQuotaUnit: 'characters',
      },
      'eleven_turbo_v2': {
        perCharacter: 0.000015,
      },
      'eleven_flash_v2': {
        perCharacter: 0.000008,
      },
    },
    rateLimits: {
      requestsPerMinute: 20,
    },
  },

  e2b: {
    id: 'e2b',
    name: 'E2B',
    category: ['code_exec'],
    models: {
      'sandbox': {
        perRequest: 0.0001, // per second of compute
        freeQuota: 100,
        freeQuotaUnit: 'requests',
      },
    },
    rateLimits: {
      requestsPerMinute: 20,
    },
  },

  firecrawl: {
    id: 'firecrawl',
    name: 'Firecrawl',
    category: ['scrape'],
    models: {
      'scrape': {
        perRequest: 0.001,
        freeQuota: 500,
        freeQuotaUnit: 'requests',
      },
      'crawl': {
        perRequest: 0.002,
      },
    },
    rateLimits: {
      requestsPerMinute: 20,
      requestsPerDay: 500,
    },
  },

  tavily: {
    id: 'tavily',
    name: 'Tavily',
    category: ['search'],
    models: {
      'search': {
        perRequest: 0.001,
        freeQuota: 1000,
        freeQuotaUnit: 'requests',
      },
      'search-deep': {
        perRequest: 0.005,
      },
    },
    rateLimits: {
      requestsPerMinute: 20,
      requestsPerDay: 1000,
    },
  },

  resend: {
    id: 'resend',
    name: 'Resend',
    category: ['email'],
    models: {
      'email': {
        perRequest: 0.001,
        freeQuota: 3000,
        freeQuotaUnit: 'requests',
      },
    },
    rateLimits: {
      requestsPerMinute: 10,
      requestsPerDay: 100,
    },
  },
};

// ===== USAGE RECORD =====
export interface UsageRecord {
  id: string;
  timestamp: Date;
  providerId: ProviderId;
  model: string;
  taskCategory: TaskCategory;
  
  // Token-based
  inputTokens?: number;
  outputTokens?: number;
  
  // Request-based
  requestCount?: number;
  
  // Other metrics
  audioMinutes?: number;
  characters?: number;
  images?: number;
  
  // Cost
  calculatedCost: number;
  
  // Metadata
  userId?: string;
  sessionId?: string;
  success: boolean;
  latencyMs: number;
  errorMessage?: string;
}

// ===== BUDGET CONFIGURATION =====
export interface BudgetConfig {
  dailyLimit: number;
  monthlyLimit: number;
  alertThreshold: number; // 0-1 (e.g., 0.8 = alert at 80%)
  perProviderLimits?: Partial<Record<ProviderId, number>>;
  perCategoryLimits?: Partial<Record<TaskCategory, number>>;
}

// ===== COST SUMMARY =====
export interface CostSummary {
  period: 'hour' | 'day' | 'week' | 'month' | 'all';
  totalCost: number;
  totalRequests: number;
  byProvider: Record<ProviderId, { cost: number; requests: number }>;
  byCategory: Record<TaskCategory, { cost: number; requests: number }>;
  byModel: Record<string, { cost: number; requests: number }>;
  avgCostPerRequest: number;
  avgLatency: number;
  successRate: number;
  savings: number; // Estimated savings from smart routing
}

// ===== ALERT =====
export interface CostAlert {
  id: string;
  type: 'budget_warning' | 'budget_exceeded' | 'rate_limit' | 'high_cost_request';
  message: string;
  timestamp: Date;
  threshold: number;
  currentValue: number;
  acknowledged: boolean;
}

// ===== COST TRACKER CLASS =====
export class CostTracker {
  private usageRecords: UsageRecord[] = [];
  private budget: BudgetConfig;
  private alerts: CostAlert[] = [];
  private onAlert?: (alert: CostAlert) => void;

  constructor(budget?: Partial<BudgetConfig>, onAlert?: (alert: CostAlert) => void) {
    this.budget = {
      dailyLimit: budget?.dailyLimit ?? 10,
      monthlyLimit: budget?.monthlyLimit ?? 100,
      alertThreshold: budget?.alertThreshold ?? 0.8,
      perProviderLimits: budget?.perProviderLimits,
      perCategoryLimits: budget?.perCategoryLimits,
    };
    this.onAlert = onAlert;
  }

  // ===== CALCULATE COST =====
  calculateCost(
    providerId: ProviderId,
    model: string,
    metrics: {
      inputTokens?: number;
      outputTokens?: number;
      requestCount?: number;
      audioMinutes?: number;
      characters?: number;
      images?: number;
    }
  ): number {
    const provider = PROVIDER_PRICING[providerId];
    if (!provider) return 0;

    const pricing = provider.models[model];
    if (!pricing) {
      // Try to find a matching model
      const modelKey = Object.keys(provider.models).find(k => 
        model.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(model.toLowerCase())
      );
      if (modelKey) {
        return this.calculateCost(providerId, modelKey, metrics);
      }
      return 0;
    }

    let cost = 0;

    // Token-based pricing
    if (metrics.inputTokens && pricing.inputPer1kTokens) {
      cost += (metrics.inputTokens / 1000) * pricing.inputPer1kTokens;
    }
    if (metrics.outputTokens && pricing.outputPer1kTokens) {
      cost += (metrics.outputTokens / 1000) * pricing.outputPer1kTokens;
    }

    // Request-based pricing
    if (metrics.requestCount && pricing.perRequest) {
      cost += metrics.requestCount * pricing.perRequest;
    }

    // Audio pricing
    if (metrics.audioMinutes && pricing.perMinute) {
      cost += metrics.audioMinutes * pricing.perMinute;
    }

    // Character pricing (TTS)
    if (metrics.characters && pricing.perCharacter) {
      cost += metrics.characters * pricing.perCharacter;
    }

    // Image pricing
    if (metrics.images && pricing.perImage) {
      cost += metrics.images * pricing.perImage;
    }

    return Math.round(cost * 1000000) / 1000000; // 6 decimal precision
  }

  // ===== RECORD USAGE =====
  recordUsage(usage: Omit<UsageRecord, 'id' | 'calculatedCost'>): UsageRecord {
    const calculatedCost = this.calculateCost(usage.providerId, usage.model, {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      requestCount: usage.requestCount,
      audioMinutes: usage.audioMinutes,
      characters: usage.characters,
      images: usage.images,
    });

    const record: UsageRecord = {
      ...usage,
      id: this.generateId(),
      calculatedCost,
    };

    this.usageRecords.push(record);
    this.checkBudgetAlerts();

    return record;
  }

  // ===== GET COST SUMMARY =====
  getCostSummary(period: CostSummary['period'] = 'day'): CostSummary {
    const now = new Date();
    const records = this.filterByPeriod(period, now);

    const byProvider: CostSummary['byProvider'] = {} as any;
    const byCategory: CostSummary['byCategory'] = {} as any;
    const byModel: CostSummary['byModel'] = {};

    let totalCost = 0;
    let totalRequests = 0;
    let totalLatency = 0;
    let successCount = 0;

    for (const record of records) {
      totalCost += record.calculatedCost;
      totalRequests += 1;
      totalLatency += record.latencyMs;
      if (record.success) successCount += 1;

      // By provider
      if (!byProvider[record.providerId]) {
        byProvider[record.providerId] = { cost: 0, requests: 0 };
      }
      byProvider[record.providerId].cost += record.calculatedCost;
      byProvider[record.providerId].requests += 1;

      // By category
      if (!byCategory[record.taskCategory]) {
        byCategory[record.taskCategory] = { cost: 0, requests: 0 };
      }
      byCategory[record.taskCategory].cost += record.calculatedCost;
      byCategory[record.taskCategory].requests += 1;

      // By model
      const modelKey = `${record.providerId}/${record.model}`;
      if (!byModel[modelKey]) {
        byModel[modelKey] = { cost: 0, requests: 0 };
      }
      byModel[modelKey].cost += record.calculatedCost;
      byModel[modelKey].requests += 1;
    }

    // Calculate estimated savings (comparing to most expensive option)
    const savings = this.calculateSavings(records);

    return {
      period,
      totalCost: Math.round(totalCost * 1000000) / 1000000,
      totalRequests,
      byProvider,
      byCategory,
      byModel,
      avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      avgLatency: totalRequests > 0 ? totalLatency / totalRequests : 0,
      successRate: totalRequests > 0 ? successCount / totalRequests : 1,
      savings,
    };
  }

  // ===== GET USAGE HISTORY =====
  getUsageHistory(options?: {
    providerId?: ProviderId;
    category?: TaskCategory;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): UsageRecord[] {
    let records = [...this.usageRecords];

    if (options?.providerId) {
      records = records.filter(r => r.providerId === options.providerId);
    }
    if (options?.category) {
      records = records.filter(r => r.taskCategory === options.category);
    }
    if (options?.startDate) {
      records = records.filter(r => new Date(r.timestamp) >= options.startDate!);
    }
    if (options?.endDate) {
      records = records.filter(r => new Date(r.timestamp) <= options.endDate!);
    }

    records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (options?.limit) {
      records = records.slice(0, options.limit);
    }

    return records;
  }

  // ===== GET BUDGET STATUS =====
  getBudgetStatus(): {
    daily: { used: number; limit: number; percentage: number };
    monthly: { used: number; limit: number; percentage: number };
    isOverBudget: boolean;
    alerts: CostAlert[];
  } {
    const dailySummary = this.getCostSummary('day');
    const monthlySummary = this.getCostSummary('month');

    return {
      daily: {
        used: dailySummary.totalCost,
        limit: this.budget.dailyLimit,
        percentage: (dailySummary.totalCost / this.budget.dailyLimit) * 100,
      },
      monthly: {
        used: monthlySummary.totalCost,
        limit: this.budget.monthlyLimit,
        percentage: (monthlySummary.totalCost / this.budget.monthlyLimit) * 100,
      },
      isOverBudget: 
        dailySummary.totalCost > this.budget.dailyLimit ||
        monthlySummary.totalCost > this.budget.monthlyLimit,
      alerts: this.alerts.filter(a => !a.acknowledged),
    };
  }

  // ===== SET BUDGET =====
  setBudget(budget: Partial<BudgetConfig>): void {
    this.budget = { ...this.budget, ...budget };
  }

  // ===== GET PROVIDER STATS =====
  getProviderStats(providerId: ProviderId): {
    totalCost: number;
    totalRequests: number;
    avgLatency: number;
    successRate: number;
    lastUsed: Date | null;
    remainingFreeQuota: Record<string, number>;
  } {
    const records = this.usageRecords.filter(r => r.providerId === providerId);
    
    const totalCost = records.reduce((sum, r) => sum + r.calculatedCost, 0);
    const totalRequests = records.length;
    const avgLatency = records.length > 0 
      ? records.reduce((sum, r) => sum + r.latencyMs, 0) / records.length 
      : 0;
    const successRate = records.length > 0
      ? records.filter(r => r.success).length / records.length
      : 1;
    const lastUsed = records.length > 0 
      ? new Date(Math.max(...records.map(r => new Date(r.timestamp).getTime())))
      : null;

    // Calculate remaining free quota
    const remainingFreeQuota: Record<string, number> = {};
    const provider = PROVIDER_PRICING[providerId];
    const todayRecords = this.filterByPeriod('day', new Date()).filter(r => r.providerId === providerId);

    for (const [model, pricing] of Object.entries(provider.models)) {
      if (pricing.freeQuota) {
        const modelRecords = todayRecords.filter(r => r.model === model);
        let used = 0;
        
        switch (pricing.freeQuotaUnit) {
          case 'requests':
            used = modelRecords.length;
            break;
          case 'tokens':
            used = modelRecords.reduce((sum, r) => sum + (r.inputTokens || 0) + (r.outputTokens || 0), 0);
            break;
          case 'minutes':
            used = modelRecords.reduce((sum, r) => sum + (r.audioMinutes || 0), 0);
            break;
          case 'characters':
            used = modelRecords.reduce((sum, r) => sum + (r.characters || 0), 0);
            break;
        }
        
        remainingFreeQuota[model] = Math.max(0, pricing.freeQuota - used);
      }
    }

    return {
      totalCost,
      totalRequests,
      avgLatency,
      successRate,
      lastUsed,
      remainingFreeQuota,
    };
  }

  // ===== GET COST OPTIMIZATION SUGGESTIONS =====
  getCostOptimizationSuggestions(): {
    type: 'switch_provider' | 'use_free_tier' | 'batch_requests' | 'reduce_tokens';
    message: string;
    potentialSavings: number;
  }[] {
    const suggestions: ReturnType<typeof this.getCostOptimizationSuggestions> = [];
    const summary = this.getCostSummary('week');

    // Check if using expensive providers for simple tasks
    for (const [model, stats] of Object.entries(summary.byModel)) {
      if (model.includes('gpt-4o') && !model.includes('mini')) {
        suggestions.push({
          type: 'switch_provider',
          message: `Consider using GPT-4o-mini instead of GPT-4o for simple tasks. Currently: ${stats.requests} requests at $${stats.cost.toFixed(4)}`,
          potentialSavings: stats.cost * 0.7,
        });
      }
      if (model.includes('claude-3.5-sonnet')) {
        suggestions.push({
          type: 'switch_provider',
          message: `Consider using Claude Haiku for simple tasks instead of Sonnet. Currently: ${stats.requests} requests`,
          potentialSavings: stats.cost * 0.8,
        });
      }
    }

    // Check for underutilized free tiers
    for (const providerId of Object.keys(PROVIDER_PRICING) as ProviderId[]) {
      const providerStats = this.getProviderStats(providerId);
      for (const [model, remaining] of Object.entries(providerStats.remainingFreeQuota)) {
        if (remaining > 100) {
          suggestions.push({
            type: 'use_free_tier',
            message: `${PROVIDER_PRICING[providerId].name} ${model} has ${remaining} free quota remaining today`,
            potentialSavings: 0.01 * remaining,
          });
        }
      }
    }

    return suggestions;
  }

  // ===== ACKNOWLEDGE ALERT =====
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  // ===== EXPORT DATA =====
  exportData(): {
    usageRecords: UsageRecord[];
    budget: BudgetConfig;
    alerts: CostAlert[];
  } {
    return {
      usageRecords: this.usageRecords,
      budget: this.budget,
      alerts: this.alerts,
    };
  }

  // ===== IMPORT DATA =====
  importData(data: {
    usageRecords?: UsageRecord[];
    budget?: BudgetConfig;
    alerts?: CostAlert[];
  }): void {
    if (data.usageRecords) {
      this.usageRecords = data.usageRecords;
    }
    if (data.budget) {
      this.budget = data.budget;
    }
    if (data.alerts) {
      this.alerts = data.alerts;
    }
  }

  // ===== CLEAR DATA =====
  clearData(olderThan?: Date): number {
    if (!olderThan) {
      const count = this.usageRecords.length;
      this.usageRecords = [];
      this.alerts = [];
      return count;
    }

    const before = this.usageRecords.length;
    this.usageRecords = this.usageRecords.filter(
      r => new Date(r.timestamp) > olderThan
    );
    return before - this.usageRecords.length;
  }

  // ===== PRIVATE METHODS =====
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private filterByPeriod(period: CostSummary['period'], now: Date): UsageRecord[] {
    let startDate: Date;

    switch (period) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'all':
      default:
        return this.usageRecords;
    }

    return this.usageRecords.filter(r => new Date(r.timestamp) >= startDate);
  }

  private checkBudgetAlerts(): void {
    const status = this.getBudgetStatus();

    // Daily budget warning
    if (status.daily.percentage >= this.budget.alertThreshold * 100 && status.daily.percentage < 100) {
      this.createAlert({
        type: 'budget_warning',
        message: `Daily budget ${Math.round(status.daily.percentage)}% used ($${status.daily.used.toFixed(4)} / $${status.daily.limit})`,
        threshold: this.budget.alertThreshold,
        currentValue: status.daily.percentage / 100,
      });
    }

    // Daily budget exceeded
    if (status.daily.percentage >= 100) {
      this.createAlert({
        type: 'budget_exceeded',
        message: `Daily budget exceeded! ($${status.daily.used.toFixed(4)} / $${status.daily.limit})`,
        threshold: 1,
        currentValue: status.daily.percentage / 100,
      });
    }

    // Monthly budget warning
    if (status.monthly.percentage >= this.budget.alertThreshold * 100 && status.monthly.percentage < 100) {
      this.createAlert({
        type: 'budget_warning',
        message: `Monthly budget ${Math.round(status.monthly.percentage)}% used ($${status.monthly.used.toFixed(4)} / $${status.monthly.limit})`,
        threshold: this.budget.alertThreshold,
        currentValue: status.monthly.percentage / 100,
      });
    }

    // Monthly budget exceeded
    if (status.monthly.percentage >= 100) {
      this.createAlert({
        type: 'budget_exceeded',
        message: `Monthly budget exceeded! ($${status.monthly.used.toFixed(4)} / $${status.monthly.limit})`,
        threshold: 1,
        currentValue: status.monthly.percentage / 100,
      });
    }
  }

  private createAlert(data: Omit<CostAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    // Don't create duplicate alerts
    const recentAlert = this.alerts.find(
      a => a.type === data.type && 
           a.message === data.message && 
           !a.acknowledged &&
           new Date().getTime() - new Date(a.timestamp).getTime() < 60 * 60 * 1000 // 1 hour
    );

    if (recentAlert) return;

    const alert: CostAlert = {
      ...data,
      id: this.generateId(),
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.push(alert);

    if (this.onAlert) {
      this.onAlert(alert);
    }
  }

  private calculateSavings(records: UsageRecord[]): number {
    // Estimate what costs would have been without smart routing
    // Assume 50% of requests would have gone to expensive providers
    let estimatedFullCost = 0;
    
    for (const record of records) {
      // If using a cheap provider, estimate cost with expensive alternative
      if (['groq', 'gemini'].includes(record.providerId) && record.taskCategory === 'chat') {
        // Estimate GPT-4 cost
        const tokens = (record.inputTokens || 0) + (record.outputTokens || 0);
        estimatedFullCost += (tokens / 1000) * 0.03; // GPT-4 average
      } else {
        estimatedFullCost += record.calculatedCost * 1.5;
      }
    }

    const actualCost = records.reduce((sum, r) => sum + r.calculatedCost, 0);
    return Math.max(0, estimatedFullCost - actualCost);
  }
}

// ===== SINGLETON INSTANCE =====
export const costTracker = new CostTracker();

// ===== HELPER FUNCTIONS =====
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 1000).toFixed(3)}m`; // millicents
  }
  if (cost < 1) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

export function getProviderColor(providerId: ProviderId): string {
  const colors: Record<ProviderId, string> = {
    groq: '#FF6B35',
    gemini: '#4285F4',
    openrouter: '#9333EA',
    mistral: '#FF9500',
    cohere: '#39C3EF',
    replicate: '#000000',
    elevenlabs: '#00A67E',
    e2b: '#3B82F6',
    firecrawl: '#EF4444',
    tavily: '#10B981',
    resend: '#000000',
  };
  return colors[providerId] || '#6B7280';
}

export function getCategoryIcon(category: TaskCategory): string {
  const icons: Record<TaskCategory, string> = {
    chat: '💬',
    vision: '👁️',
    image_gen: '🎨',
    audio_tts: '🔊',
    audio_stt: '🎤',
    code_exec: '💻',
    search: '🔍',
    scrape: '🌐',
    email: '📧',
  };
  return icons[category] || '📦';
}
