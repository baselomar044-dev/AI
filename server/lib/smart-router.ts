// ============================================
// 🧠 SMART ROUTER v2.0 - Ultimate Provider Selection
// ============================================
// Supports all 11 API providers with intelligent routing
// Optimizes for: Quality, Cost, Speed, and Availability

import { 
  CostTracker, 
  costTracker, 
  ProviderId, 
  TaskCategory,
  PROVIDER_PRICING,
  formatCost 
} from './cost-tracker';

// ===== TASK TYPES =====
export type TaskType = 
  | 'simple'        // Quick responses, greetings
  | 'complex'       // Deep analysis, research
  | 'code'          // Programming, debugging
  | 'math'          // Calculations, equations
  | 'creative'      // Writing, storytelling
  | 'arabic'        // Arabic language tasks
  | 'vision'        // Image analysis
  | 'reasoning'     // Logic, planning
  | 'image_gen'     // Generate images
  | 'tts'           // Text to speech
  | 'stt'           // Speech to text
  | 'search'        // Web search
  | 'scrape'        // Web scraping
  | 'code_exec'     // Code execution
  | 'email';        // Send emails

// ===== PROVIDER CAPABILITIES =====
export interface ProviderCapability {
  providerId: ProviderId;
  model: string;
  taskTypes: TaskType[];
  qualityScore: number;      // 1-10
  speedScore: number;        // 1-10
  costScore: number;         // 1-10 (higher = cheaper)
  supportsStreaming: boolean;
  supportsArabic: boolean;
  maxTokens: number;
  contextWindow: number;
}

export const PROVIDER_CAPABILITIES: ProviderCapability[] = [
  // ===== CHAT PROVIDERS =====
  {
    providerId: 'groq',
    model: 'llama-3.3-70b-versatile',
    taskTypes: ['simple', 'complex', 'code', 'math', 'creative', 'arabic', 'reasoning'],
    qualityScore: 8,
    speedScore: 10,      // Fastest!
    costScore: 9,        // Very cheap
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 8192,
    contextWindow: 128000,
  },
  {
    providerId: 'groq',
    model: 'deepseek-r1-distill-llama-70b',
    taskTypes: ['complex', 'code', 'math', 'reasoning'],
    qualityScore: 9,
    speedScore: 9,
    costScore: 8,
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 8192,
    contextWindow: 64000,
  },
  {
    providerId: 'groq',
    model: 'llama-3.2-90b-vision-preview',
    taskTypes: ['vision', 'simple', 'complex'],
    qualityScore: 8,
    speedScore: 9,
    costScore: 8,
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 8192,
    contextWindow: 128000,
  },
  {
    providerId: 'gemini',
    model: 'gemini-1.5-flash',
    taskTypes: ['simple', 'complex', 'creative', 'arabic', 'vision'],
    qualityScore: 7,
    speedScore: 9,
    costScore: 10,       // Cheapest!
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 8192,
    contextWindow: 1000000,
  },
  {
    providerId: 'gemini',
    model: 'gemini-1.5-pro',
    taskTypes: ['complex', 'code', 'math', 'creative', 'arabic', 'vision', 'reasoning'],
    qualityScore: 9,
    speedScore: 7,
    costScore: 6,
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 8192,
    contextWindow: 2000000,
  },
  {
    providerId: 'gemini',
    model: 'gemini-2.0-flash',
    taskTypes: ['simple', 'complex', 'code', 'creative', 'arabic', 'vision'],
    qualityScore: 8,
    speedScore: 10,
    costScore: 9,
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 8192,
    contextWindow: 1000000,
  },
  {
    providerId: 'openrouter',
    model: 'meta-llama/llama-3.2-3b-instruct:free',
    taskTypes: ['simple'],
    qualityScore: 5,
    speedScore: 8,
    costScore: 10,       // Free!
    supportsStreaming: true,
    supportsArabic: false,
    maxTokens: 4096,
    contextWindow: 8192,
  },
  {
    providerId: 'openrouter',
    model: 'anthropic/claude-3-haiku:beta',
    taskTypes: ['simple', 'complex', 'code', 'creative'],
    qualityScore: 8,
    speedScore: 9,
    costScore: 8,
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 4096,
    contextWindow: 200000,
  },
  {
    providerId: 'openrouter',
    model: 'anthropic/claude-3.5-sonnet',
    taskTypes: ['complex', 'code', 'math', 'creative', 'reasoning'],
    qualityScore: 10,    // Best quality!
    speedScore: 6,
    costScore: 3,
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 8192,
    contextWindow: 200000,
  },
  {
    providerId: 'openrouter',
    model: 'openai/gpt-4o',
    taskTypes: ['complex', 'code', 'math', 'creative', 'vision', 'reasoning'],
    qualityScore: 10,
    speedScore: 6,
    costScore: 2,
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 4096,
    contextWindow: 128000,
  },
  {
    providerId: 'openrouter',
    model: 'openai/gpt-4o-mini',
    taskTypes: ['simple', 'complex', 'code', 'creative'],
    qualityScore: 8,
    speedScore: 8,
    costScore: 8,
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 16384,
    contextWindow: 128000,
  },
  {
    providerId: 'openrouter',
    model: 'deepseek/deepseek-chat',
    taskTypes: ['simple', 'complex', 'code', 'math', 'reasoning'],
    qualityScore: 8,
    speedScore: 7,
    costScore: 9,
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 8192,
    contextWindow: 64000,
  },
  {
    providerId: 'mistral',
    model: 'mistral-large-latest',
    taskTypes: ['complex', 'code', 'creative', 'reasoning'],
    qualityScore: 9,
    speedScore: 7,
    costScore: 5,
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 8192,
    contextWindow: 128000,
  },
  {
    providerId: 'mistral',
    model: 'mistral-small-latest',
    taskTypes: ['simple', 'complex', 'code'],
    qualityScore: 7,
    speedScore: 9,
    costScore: 9,
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 8192,
    contextWindow: 32000,
  },
  {
    providerId: 'mistral',
    model: 'codestral-latest',
    taskTypes: ['code'],
    qualityScore: 9,
    speedScore: 8,
    costScore: 8,
    supportsStreaming: true,
    supportsArabic: false,
    maxTokens: 8192,
    contextWindow: 32000,
  },
  {
    providerId: 'mistral',
    model: 'open-mistral-nemo',
    taskTypes: ['simple', 'creative'],
    qualityScore: 6,
    speedScore: 9,
    costScore: 10,
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 4096,
    contextWindow: 128000,
  },
  {
    providerId: 'cohere',
    model: 'command-r-plus',
    taskTypes: ['complex', 'search', 'reasoning'],
    qualityScore: 8,
    speedScore: 6,
    costScore: 4,
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 4096,
    contextWindow: 128000,
  },
  {
    providerId: 'cohere',
    model: 'command-r',
    taskTypes: ['simple', 'complex', 'search'],
    qualityScore: 7,
    speedScore: 8,
    costScore: 8,
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 4096,
    contextWindow: 128000,
  },
  {
    providerId: 'cohere',
    model: 'command-r-08-2024',
    taskTypes: ['simple', 'complex'],
    qualityScore: 7,
    speedScore: 8,
    costScore: 9,
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 4096,
    contextWindow: 128000,
  },

  // ===== SPECIALIZED PROVIDERS =====
  {
    providerId: 'replicate',
    model: 'flux-schnell',
    taskTypes: ['image_gen'],
    qualityScore: 8,
    speedScore: 9,
    costScore: 9,
    supportsStreaming: false,
    supportsArabic: false,
    maxTokens: 0,
    contextWindow: 0,
  },
  {
    providerId: 'replicate',
    model: 'flux-pro',
    taskTypes: ['image_gen'],
    qualityScore: 10,
    speedScore: 5,
    costScore: 4,
    supportsStreaming: false,
    supportsArabic: false,
    maxTokens: 0,
    contextWindow: 0,
  },
  {
    providerId: 'replicate',
    model: 'sdxl',
    taskTypes: ['image_gen'],
    qualityScore: 7,
    speedScore: 8,
    costScore: 10,
    supportsStreaming: false,
    supportsArabic: false,
    maxTokens: 0,
    contextWindow: 0,
  },
  {
    providerId: 'replicate',
    model: 'stable-diffusion-3',
    taskTypes: ['image_gen'],
    qualityScore: 9,
    speedScore: 6,
    costScore: 6,
    supportsStreaming: false,
    supportsArabic: false,
    maxTokens: 0,
    contextWindow: 0,
  },
  {
    providerId: 'elevenlabs',
    model: 'eleven_multilingual_v2',
    taskTypes: ['tts'],
    qualityScore: 10,
    speedScore: 8,
    costScore: 6,
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 0,
    contextWindow: 0,
  },
  {
    providerId: 'elevenlabs',
    model: 'eleven_turbo_v2',
    taskTypes: ['tts'],
    qualityScore: 8,
    speedScore: 10,
    costScore: 8,
    supportsStreaming: true,
    supportsArabic: true,
    maxTokens: 0,
    contextWindow: 0,
  },
  {
    providerId: 'elevenlabs',
    model: 'eleven_flash_v2',
    taskTypes: ['tts'],
    qualityScore: 7,
    speedScore: 10,
    costScore: 10,
    supportsStreaming: true,
    supportsArabic: false,
    maxTokens: 0,
    contextWindow: 0,
  },
  {
    providerId: 'e2b',
    model: 'sandbox',
    taskTypes: ['code_exec'],
    qualityScore: 9,
    speedScore: 8,
    costScore: 9,
    supportsStreaming: false,
    supportsArabic: false,
    maxTokens: 0,
    contextWindow: 0,
  },
  {
    providerId: 'firecrawl',
    model: 'scrape',
    taskTypes: ['scrape'],
    qualityScore: 9,
    speedScore: 7,
    costScore: 9,
    supportsStreaming: false,
    supportsArabic: true,
    maxTokens: 0,
    contextWindow: 0,
  },
  {
    providerId: 'tavily',
    model: 'search',
    taskTypes: ['search'],
    qualityScore: 9,
    speedScore: 9,
    costScore: 9,
    supportsStreaming: false,
    supportsArabic: true,
    maxTokens: 0,
    contextWindow: 0,
  },
  {
    providerId: 'tavily',
    model: 'search-deep',
    taskTypes: ['search'],
    qualityScore: 10,
    speedScore: 5,
    costScore: 6,
    supportsStreaming: false,
    supportsArabic: true,
    maxTokens: 0,
    contextWindow: 0,
  },
  {
    providerId: 'resend',
    model: 'email',
    taskTypes: ['email'],
    qualityScore: 9,
    speedScore: 9,
    costScore: 9,
    supportsStreaming: false,
    supportsArabic: true,
    maxTokens: 0,
    contextWindow: 0,
  },
];

// ===== ROUTING DECISION =====
export interface RoutingDecision {
  provider: ProviderId;
  model: string;
  reason: string;
  confidence: number;
  estimatedCost: number;
  fallbacks: { provider: ProviderId; model: string; reason: string }[];
  taskType: TaskType;
  scores: {
    quality: number;
    speed: number;
    cost: number;
    combined: number;
  };
}

// ===== ROUTING OPTIONS =====
export interface RoutingOptions {
  priority: 'quality' | 'cost' | 'speed' | 'balanced';
  requireArabic?: boolean;
  requireStreaming?: boolean;
  requireVision?: boolean;
  requireFunctionCalling?: boolean;
  maxCost?: number;
  minQuality?: number;
  excludeProviders?: ProviderId[];
  preferProviders?: ProviderId[];
  inputTokens?: number;
  outputTokens?: number;
  // Dynamic keys passed from client
  clientKeys?: Partial<Record<ProviderId, string>>;
}

// ===== TASK PATTERNS =====
const TASK_PATTERNS: Record<TaskType, RegExp[]> = {
  simple: [
    /^(hi|hello|hey|thanks|ok|yes|no|sure|bye)\b/i,
    /^what (is|are) (the )?(time|date|weather)/i,
    /^(مرحبا|شكرا|نعم|لا|أهلا|تمام|ماشي|اوك)/,
    /^(إزيك|عامل إيه|أخبارك)/,
  ],
  complex: [
    /explain|analyze|compare|evaluate|assess|research|investigate/i,
    /why (does|do|is|are|did|would|should)/i,
    /what are the (implications|consequences|effects|benefits|drawbacks)/i,
    /شرح|تحليل|مقارنة|تقييم|بحث/,
    /اشرحلي|حللي|قارنلي/,
  ],
  code: [
    /\b(code|function|class|variable|bug|error|debug|programming|compile|syntax)\b/i,
    /\b(javascript|python|typescript|java|c\+\+|rust|go|react|node|html|css)\b/i,
    /```[\s\S]*```/,
    /برمجة|كود|دالة|خطأ|برنامج/,
    /اكتبلي كود|عدل الكود|فيه bug/,
  ],
  math: [
    /\b(calculate|compute|solve|equation|formula|math|algebra|calculus)\b/i,
    /\d+\s*[\+\-\*\/\^]\s*\d+/,
    /\b(integral|derivative|matrix|probability|statistics|percentage)\b/i,
    /حساب|معادلة|رياضيات|جمع|طرح|ضرب|قسمة/,
    /احسبلي|كم يساوي/,
  ],
  creative: [
    /\b(write|create|compose|imagine|story|poem|essay|article|blog)\b/i,
    /\b(creative|artistic|design|brainstorm|ideas|invent)\b/i,
    /اكتب|قصة|شعر|إبداع|تصميم|مقال|رواية/,
    /اكتبلي|ألفلي|اقترحلي/,
  ],
  arabic: [
    /[\u0600-\u06FF]{20,}/,  // 20+ Arabic characters
    /اللغة العربية|بالعربي|عربي/,
  ],
  vision: [
    /\b(image|picture|photo|screenshot|diagram|chart|graph|see|look)\b/i,
    /صورة|رسم|مخطط|شوف|اقرأ الصورة/,
    /what('s| is) (in |this )/i,
    /describe (this |the )?image/i,
  ],
  reasoning: [
    /\b(plan|strategy|decision|logic|reason|think|analyze|deduce)\b/i,
    /\b(step by step|pros and cons|trade-offs|implications)\b/i,
    /تخطيط|استراتيجية|قرار|منطق|تفكير/,
    /خطوة بخطوة|إيجابيات وسلبيات/,
  ],
  image_gen: [
    /\b(generate|create|draw|make|design) (an? )?(image|picture|art|illustration)\b/i,
    /\b(dall-?e|midjourney|stable diffusion|flux)\b/i,
    /ارسم|صمم|اعمل صورة|ولدلي صورة/,
  ],
  tts: [
    /\b(speak|say|read aloud|voice|audio|tts|text.to.speech)\b/i,
    /\b(convert to (speech|audio)|generate (voice|audio))\b/i,
    /اقرأ بصوت|حول لصوت|كلمني/,
  ],
  stt: [
    /\b(transcribe|speech.to.text|stt|recognize speech)\b/i,
    /حول الصوت|اكتب اللي بيتقال/,
  ],
  search: [
    /\b(search|find|look up|google|research online|latest news)\b/i,
    /\b(what happened|current|today|recent)\b/i,
    /دور|ابحث|اخر اخبار|جديد/,
  ],
  scrape: [
    /\b(scrape|extract|crawl|fetch|get content from)\b/i,
    /\b(website|webpage|url|link)\b/i,
    /هات المحتوى|اقرأ الموقع|استخرج/,
  ],
  code_exec: [
    /\b(run|execute|test) (this |the )?(code|script|program)\b/i,
    /\b(sandbox|runtime|interpreter)\b/i,
    /شغل الكود|نفذ|جرب الكود/,
  ],
  email: [
    /\b(send|compose|write|draft) (an? )?(email|mail|message)\b/i,
    /\b(email|mail) to\b/i,
    /ابعت إيميل|رسالة إلكترونية/,
  ],
};

// ===== PROVIDER HEALTH TRACKING =====
interface ProviderHealth {
  failures: number;
  lastFailure: number;
  avgLatency: number;
  latencies: number[];
  lastSuccess: number;
}

// ===== SMART ROUTER CLASS =====
export class SmartRouter {
  private health: Map<string, ProviderHealth> = new Map();
  private costTracker: CostTracker;
  private configuredProviders: Set<ProviderId> = new Set();

  constructor(costTracker?: CostTracker) {
    this.costTracker = costTracker || new CostTracker();
    this.detectConfiguredProviders();
  }

  // ===== DETECT TASK TYPE =====
  detectTaskType(input: string, hasImage?: boolean): TaskType {
    // Vision takes priority if image is attached
    if (hasImage) return 'vision';

    // Check each pattern
    for (const [taskType, patterns] of Object.entries(TASK_PATTERNS) as [TaskType, RegExp[]][]) {
      for (const pattern of patterns) {
        if (pattern.test(input)) {
          return taskType;
        }
      }
    }

    // Default based on length and complexity
    if (input.length < 50) return 'simple';
    if (input.length > 500) return 'complex';
    
    return 'simple';
  }

  // ===== ROUTE REQUEST =====
  route(input: string, options: RoutingOptions = { priority: 'balanced' }): RoutingDecision {
    const taskType = this.detectTaskType(input, options.requireVision);
    
    // Determine effective configured providers (Server Env + Client Keys)
    const effectiveProviders = new Set(this.configuredProviders);
    if (options.clientKeys) {
      for (const provider of Object.keys(options.clientKeys)) {
        if (options.clientKeys[provider as ProviderId]) {
          effectiveProviders.add(provider as ProviderId);
        }
      }
    }
    
    // Get all capable providers
    let candidates = PROVIDER_CAPABILITIES.filter(p => {
      // Must support the task type
      if (!p.taskTypes.includes(taskType)) return false;
      
      // Must be configured
      if (!effectiveProviders.has(p.providerId)) return false;
      
      // Check requirements
      if (options.requireArabic && !p.supportsArabic) return false;
      if (options.requireStreaming && !p.supportsStreaming) return false;
      if (options.requireVision && !p.taskTypes.includes('vision')) return false;
      
      // Check exclusions
      if (options.excludeProviders?.includes(p.providerId)) return false;
      
      // Check minimum quality
      if (options.minQuality && p.qualityScore < options.minQuality) return false;
      
      // Check health
      if (this.isProviderUnhealthy(`${p.providerId}/${p.model}`)) return false;
      
      return true;
    });

    // If no candidates, try fallback
    if (candidates.length === 0) {
      candidates = PROVIDER_CAPABILITIES.filter(p => 
        effectiveProviders.has(p.providerId) &&
        !this.isProviderUnhealthy(`${p.providerId}/${p.model}`)
      );
    }

    if (candidates.length === 0) {
      throw new Error('No available providers for this request');
    }

    // Score candidates
    const scored = candidates.map(p => ({
      ...p,
      combinedScore: this.calculateScore(p, options),
      estimatedCost: this.estimateCost(p.providerId, p.model, options),
    }));

    // Sort by score (highest first)
    scored.sort((a, b) => b.combinedScore - a.combinedScore);

    // Boost preferred providers
    if (options.preferProviders?.length) {
      scored.sort((a, b) => {
        const aPreferred = options.preferProviders!.includes(a.providerId) ? 1 : 0;
        const bPreferred = options.preferProviders!.includes(b.providerId) ? 1 : 0;
        if (aPreferred !== bPreferred) return bPreferred - aPreferred;
        return b.combinedScore - a.combinedScore;
      });
    }

    // Check max cost
    if (options.maxCost !== undefined) {
      const affordable = scored.filter(p => p.estimatedCost <= options.maxCost!);
      if (affordable.length > 0) {
        scored.splice(0, scored.length, ...affordable);
      }
    }

    const best = scored[0];
    const fallbacks = scored.slice(1, 4).map(p => ({
      provider: p.providerId,
      model: p.model,
      reason: `Score: ${p.combinedScore.toFixed(2)}`,
    }));

    return {
      provider: best.providerId,
      model: best.model,
      reason: this.generateReason(best, options),
      confidence: Math.min(best.combinedScore / 10, 1),
      estimatedCost: best.estimatedCost,
      fallbacks,
      taskType,
      scores: {
        quality: best.qualityScore,
        speed: best.speedScore,
        cost: best.costScore,
        combined: best.combinedScore,
      },
    };
  }

  // ===== RECORD RESULT =====
  recordResult(
    decision: RoutingDecision,
    success: boolean,
    latencyMs: number,
    actualCost?: number,
    error?: string
  ): void {
    const key = `${decision.provider}/${decision.model}`;
    const health = this.health.get(key) || {
      failures: 0,
      lastFailure: 0,
      avgLatency: 0,
      latencies: [],
      lastSuccess: 0,
    };

    if (success) {
      health.failures = Math.max(0, health.failures - 1);
      health.lastSuccess = Date.now();
      health.latencies.push(latencyMs);
      if (health.latencies.length > 100) {
        health.latencies = health.latencies.slice(-100);
      }
      health.avgLatency = health.latencies.reduce((a, b) => a + b, 0) / health.latencies.length;
    } else {
      health.failures += 1;
      health.lastFailure = Date.now();
    }

    this.health.set(key, health);

    // Record to cost tracker
    const taskCategory = this.taskTypeToCategory(decision.taskType);
    this.costTracker.recordUsage({
      timestamp: new Date(),
      providerId: decision.provider,
      model: decision.model,
      taskCategory,
      requestCount: 1,
      success,
      latencyMs,
      errorMessage: error,
    });
  }

  // ===== GET NEXT FALLBACK =====
  getNextFallback(
    currentDecision: RoutingDecision,
    failedProviders: string[]
  ): RoutingDecision | null {
    const available = currentDecision.fallbacks.filter(
      f => !failedProviders.includes(`${f.provider}/${f.model}`)
    );

    if (available.length === 0) return null;

    const next = available[0];
    const capability = PROVIDER_CAPABILITIES.find(
      p => p.providerId === next.provider && p.model === next.model
    );

    if (!capability) return null;

    return {
      ...currentDecision,
      provider: next.provider,
      model: next.model,
      reason: `Fallback: ${next.reason}`,
      confidence: currentDecision.confidence * 0.9,
      fallbacks: available.slice(1),
    };
  }

  // ===== GET AVAILABLE PROVIDERS =====
  getAvailableProviders(taskType?: TaskType): ProviderCapability[] {
    let providers = PROVIDER_CAPABILITIES.filter(p => 
      this.configuredProviders.has(p.providerId)
    );

    if (taskType) {
      providers = providers.filter(p => p.taskTypes.includes(taskType));
    }

    return providers.map(p => ({
      ...p,
      isHealthy: !this.isProviderUnhealthy(`${p.providerId}/${p.model}`),
    }));
  }

  // ===== GET PROVIDER HEALTH =====
  getProviderHealth(providerId: ProviderId, model: string): ProviderHealth | null {
    return this.health.get(`${providerId}/${model}`) || null;
  }

  // ===== GET ALL HEALTH STATUS =====
  getAllHealthStatus(): Record<string, { healthy: boolean; avgLatency: number; failures: number }> {
    const status: Record<string, { healthy: boolean; avgLatency: number; failures: number }> = {};

    for (const provider of PROVIDER_CAPABILITIES) {
      if (!this.configuredProviders.has(provider.providerId)) continue;
      
      const key = `${provider.providerId}/${provider.model}`;
      const health = this.health.get(key);
      
      status[key] = {
        healthy: !this.isProviderUnhealthy(key),
        avgLatency: health?.avgLatency || 0,
        failures: health?.failures || 0,
      };
    }

    return status;
  }

  // ===== GET RECOMMENDATION =====
  getRecommendation(taskType: TaskType, priority: RoutingOptions['priority'] = 'balanced'): {
    recommended: ProviderCapability;
    alternatives: ProviderCapability[];
    reasoning: string;
  } {
    const decision = this.route('', { priority });
    const recommended = PROVIDER_CAPABILITIES.find(
      p => p.providerId === decision.provider && p.model === decision.model
    )!;

    const alternatives = PROVIDER_CAPABILITIES
      .filter(p => 
        p.taskTypes.includes(taskType) && 
        this.configuredProviders.has(p.providerId) &&
        !(p.providerId === decision.provider && p.model === decision.model)
      )
      .slice(0, 3);

    let reasoning = `Recommended ${recommended.providerId}/${recommended.model} for ${taskType} tasks. `;
    
    switch (priority) {
      case 'quality':
        reasoning += `Quality score: ${recommended.qualityScore}/10.`;
        break;
      case 'cost':
        reasoning += `Most cost-effective option with score: ${recommended.costScore}/10.`;
        break;
      case 'speed':
        reasoning += `Fastest option with speed score: ${recommended.speedScore}/10.`;
        break;
      default:
        reasoning += `Balanced score: ${decision.scores.combined.toFixed(2)}.`;
    }

    return { recommended, alternatives, reasoning };
  }

  // ===== REFRESH CONFIGURED PROVIDERS =====
  refreshConfiguredProviders(): void {
    this.detectConfiguredProviders();
  }

  // ===== METHODS FOR UNLIMITED-AI COMPATIBILITY =====
  
  async getBestProvider(): Promise<{ name: string; defaultModel: string }> {
    const decision = this.route('', { priority: 'balanced' });
    return { 
      name: decision.provider, 
      defaultModel: decision.model 
    };
  }

  async getFallbackProviders(excludeProvider: string): Promise<{ name: string; defaultModel: string }[]> {
    const available = this.getAvailableProviders();
    return available
      .filter(p => p.providerId !== excludeProvider)
      .slice(0, 3)
      .map(p => ({ name: p.providerId, defaultModel: p.model }));
  }

  recordSuccess(providerName: string): void {
    const key = `${providerName}/default`;
    const existing = this.health.get(key) || { failures: 0, avgLatency: 0, lastFailure: 0 };
    existing.failures = Math.max(0, existing.failures - 1);
    this.health.set(key, existing);
  }

  recordFailure(providerName: string): void {
    const key = `${providerName}/default`;
    const existing = this.health.get(key) || { failures: 0, avgLatency: 0, lastFailure: 0 };
    existing.failures += 1;
    existing.lastFailure = Date.now();
    this.health.set(key, existing);
  }

  getStatus(): { availableProviders: string[]; healthyCount: number; configuredCount: number } {
    const healthStatus = this.getAllHealthStatus();
    return {
      availableProviders: Array.from(this.configuredProviders),
      healthyCount: Object.values(healthStatus).filter(h => h.healthy).length,
      configuredCount: this.configuredProviders.size,
    };
  }

  // ===== PRIVATE METHODS =====
  private detectConfiguredProviders(): void {
    this.configuredProviders.clear();
    
    const envKeys: Record<ProviderId, string> = {
      groq: 'GROQ_API_KEY',
      gemini: 'GEMINI_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      mistral: 'MISTRAL_API_KEY',
      cohere: 'COHERE_API_KEY',
      replicate: 'REPLICATE_API_KEY',
      elevenlabs: 'ELEVENLABS_API_KEY',
      e2b: 'E2B_API_KEY',
      firecrawl: 'FIRECRAWL_API_KEY',
      tavily: 'TAVILY_API_KEY',
      resend: 'RESEND_API_KEY',
    };

    for (const [providerId, envKey] of Object.entries(envKeys) as [ProviderId, string][]) {
      if (process.env[envKey]) {
        this.configuredProviders.add(providerId);
      }
    }
  }

  private calculateScore(provider: ProviderCapability, options: RoutingOptions): number {
    let weights = { quality: 0.33, speed: 0.33, cost: 0.34 };

    switch (options.priority) {
      case 'quality':
        weights = { quality: 0.6, speed: 0.2, cost: 0.2 };
        break;
      case 'cost':
        weights = { quality: 0.2, speed: 0.2, cost: 0.6 };
        break;
      case 'speed':
        weights = { quality: 0.2, speed: 0.6, cost: 0.2 };
        break;
    }

    const score = 
      provider.qualityScore * weights.quality +
      provider.speedScore * weights.speed +
      provider.costScore * weights.cost;

    // Adjust for health
    const health = this.health.get(`${provider.providerId}/${provider.model}`);
    if (health) {
      // Penalize for failures
      const failurePenalty = Math.min(health.failures * 0.5, 2);
      // Penalize for high latency
      const latencyPenalty = health.avgLatency > 5000 ? 0.5 : 0;
      return Math.max(score - failurePenalty - latencyPenalty, 1);
    }

    return score;
  }

  private estimateCost(
    providerId: ProviderId,
    model: string,
    options: RoutingOptions
  ): number {
    return this.costTracker.calculateCost(providerId, model, {
      inputTokens: options.inputTokens || 500,
      outputTokens: options.outputTokens || 500,
      requestCount: 1,
    });
  }

  private isProviderUnhealthy(key: string): boolean {
    const health = this.health.get(key);
    if (!health) return false;

    // Unhealthy if 3+ failures in last hour
    const hourAgo = Date.now() - 60 * 60 * 1000;
    if (health.failures >= 3 && health.lastFailure > hourAgo) {
      return true;
    }

    return false;
  }

  private generateReason(
    provider: ProviderCapability & { combinedScore: number; estimatedCost: number },
    options: RoutingOptions
  ): string {
    const reasons: string[] = [];

    switch (options.priority) {
      case 'quality':
        reasons.push(`Best quality (${provider.qualityScore}/10)`);
        break;
      case 'cost':
        reasons.push(`Cheapest option (~${formatCost(provider.estimatedCost)})`);
        break;
      case 'speed':
        reasons.push(`Fastest (${provider.speedScore}/10)`);
        break;
      default:
        reasons.push(`Best balance (score: ${provider.combinedScore.toFixed(1)})`);
    }

    if (provider.supportsArabic && options.requireArabic) {
      reasons.push('Arabic support');
    }

    if (provider.supportsStreaming) {
      reasons.push('Streaming');
    }

    return reasons.join(' • ');
  }

  private taskTypeToCategory(taskType: TaskType): TaskCategory {
    const mapping: Record<TaskType, TaskCategory> = {
      simple: 'chat',
      complex: 'chat',
      code: 'chat',
      math: 'chat',
      creative: 'chat',
      arabic: 'chat',
      vision: 'vision',
      reasoning: 'chat',
      image_gen: 'image_gen',
      tts: 'audio_tts',
      stt: 'audio_stt',
      search: 'search',
      scrape: 'scrape',
      code_exec: 'code_exec',
      email: 'email',
    };
    return mapping[taskType] || 'chat';
  }
}

// ===== SINGLETON INSTANCE =====
export const smartRouter = new SmartRouter(costTracker);

// ===== CONVENIENCE FUNCTION =====
export function routeRequest(
  input: string,
  options?: RoutingOptions
): RoutingDecision {
  return smartRouter.route(input, options);
}

// ===== EXPORT TYPES =====
export type { ProviderHealth };
