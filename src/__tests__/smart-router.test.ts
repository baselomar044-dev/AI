// ============================================
// 🧪 SMART ROUTER & COST TRACKER TESTS
// ============================================
// Comprehensive test suite for all 11 providers

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock the environment
vi.mock('process', () => ({
  env: {
    GROQ_API_KEY: 'test-groq-key',
    GEMINI_API_KEY: 'test-gemini-key',
    OPENROUTER_API_KEY: 'test-openrouter-key',
    MISTRAL_API_KEY: 'test-mistral-key',
    COHERE_API_KEY: 'test-cohere-key',
    REPLICATE_API_KEY: 'test-replicate-key',
    ELEVENLABS_API_KEY: 'test-elevenlabs-key',
    E2B_API_KEY: 'test-e2b-key',
    FIRECRAWL_API_KEY: 'test-firecrawl-key',
    TAVILY_API_KEY: 'test-tavily-key',
    RESEND_API_KEY: 'test-resend-key',
  },
}));

// Import after mocking
import { 
  SmartRouter, 
  routeRequest, 
  TaskType,
  RoutingOptions,
  PROVIDER_CAPABILITIES 
} from '../../server/lib/smart-router';

import { 
  CostTracker, 
  PROVIDER_PRICING, 
  ProviderId,
  TaskCategory,
  formatCost,
  getProviderColor,
  getCategoryIcon 
} from '../../server/lib/cost-tracker';

// ============================================
// SMART ROUTER TESTS
// ============================================
describe('SmartRouter', () => {
  let router: SmartRouter;

  beforeEach(() => {
    router = new SmartRouter();
  });

  // ===== TASK DETECTION TESTS =====
  describe('Task Type Detection', () => {
    const testCases: { input: string; expected: TaskType; description: string }[] = [
      // Simple
      { input: 'hi', expected: 'simple', description: 'English greeting' },
      { input: 'hello there', expected: 'simple', description: 'English hello' },
      { input: 'مرحبا', expected: 'simple', description: 'Arabic greeting' },
      { input: 'thanks', expected: 'simple', description: 'Thanks' },
      
      // Complex
      { input: 'explain quantum computing', expected: 'complex', description: 'Explain request' },
      { input: 'analyze this data', expected: 'complex', description: 'Analysis request' },
      { input: 'why does the sun rise', expected: 'complex', description: 'Why question' },
      { input: 'شرح الذكاء الاصطناعي', expected: 'complex', description: 'Arabic explanation' },
      
      // Code
      { input: 'write a function in javascript', expected: 'code', description: 'Function request' },
      { input: 'debug this code', expected: 'code', description: 'Debug request' },
      { input: '```python\nprint("hello")```', expected: 'code', description: 'Code block' },
      { input: 'اكتبلي كود بايثون', expected: 'code', description: 'Arabic code request' },
      
      // Math
      { input: 'calculate 5 + 3', expected: 'math', description: 'Calculation' },
      { input: 'solve this equation', expected: 'math', description: 'Equation' },
      { input: '100 * 50', expected: 'math', description: 'Math expression' },
      { input: 'احسبلي النسبة المئوية', expected: 'math', description: 'Arabic math' },
      
      // Creative
      { input: 'write a story about a cat', expected: 'creative', description: 'Story request' },
      { input: 'create a poem', expected: 'creative', description: 'Poem request' },
      { input: 'اكتب قصة قصيرة', expected: 'creative', description: 'Arabic story' },
      
      // Arabic (long text)
      { 
        input: 'هذا نص عربي طويل جداً يحتوي على أكثر من عشرين حرف عربي', 
        expected: 'arabic', 
        description: 'Long Arabic text' 
      },
      
      // Reasoning
      { input: 'plan a trip to paris step by step', expected: 'reasoning', description: 'Planning' },
      { input: 'pros and cons of remote work', expected: 'reasoning', description: 'Pros and cons' },
      { input: 'تخطيط استراتيجي للمشروع', expected: 'reasoning', description: 'Arabic planning' },
      
      // Image Generation
      { input: 'generate an image of a sunset', expected: 'image_gen', description: 'Image gen' },
      { input: 'create a picture of a robot', expected: 'image_gen', description: 'Picture creation' },
      { input: 'ارسم صورة للقمر', expected: 'image_gen', description: 'Arabic image' },
      
      // TTS
      { input: 'speak this text aloud', expected: 'tts', description: 'Speak request' },
      { input: 'convert to speech', expected: 'tts', description: 'TTS conversion' },
      { input: 'اقرأ بصوت عالي', expected: 'tts', description: 'Arabic TTS' },
      
      // Search
      { input: 'search for latest news', expected: 'search', description: 'Search request' },
      { input: 'what happened today', expected: 'search', description: 'Current events' },
      { input: 'دور على اخر الاخبار', expected: 'search', description: 'Arabic search' },
      
      // Scrape
      { input: 'scrape this website', expected: 'scrape', description: 'Scrape request' },
      { input: 'get content from https://example.com', expected: 'scrape', description: 'URL extraction' },
      
      // Code Execution
      { input: 'run this code', expected: 'code_exec', description: 'Run code' },
      { input: 'execute the script', expected: 'code_exec', description: 'Execute script' },
      
      // Email
      { input: 'send an email to john', expected: 'email', description: 'Send email' },
      { input: 'compose a message', expected: 'email', description: 'Compose message' },
    ];

    testCases.forEach(({ input, expected, description }) => {
      it(`should detect "${description}" as ${expected}`, () => {
        const taskType = router.detectTaskType(input);
        expect(taskType).toBe(expected);
      });
    });

    it('should detect vision when image is attached', () => {
      const taskType = router.detectTaskType('what is this?', true);
      expect(taskType).toBe('vision');
    });
  });

  // ===== ROUTING TESTS =====
  describe('Routing Decisions', () => {
    it('should return a valid routing decision', () => {
      const decision = router.route('hello');
      
      expect(decision).toHaveProperty('provider');
      expect(decision).toHaveProperty('model');
      expect(decision).toHaveProperty('reason');
      expect(decision).toHaveProperty('confidence');
      expect(decision).toHaveProperty('fallbacks');
      expect(decision).toHaveProperty('taskType');
      expect(decision).toHaveProperty('scores');
      expect(decision.fallbacks.length).toBeGreaterThanOrEqual(0);
    });

    it('should route simple tasks to fast providers', () => {
      const decision = router.route('hi there', { priority: 'speed' });
      
      // Should use a fast provider
      const capability = PROVIDER_CAPABILITIES.find(
        p => p.providerId === decision.provider && p.model === decision.model
      );
      expect(capability?.speedScore).toBeGreaterThanOrEqual(7);
    });

    it('should route complex tasks to quality providers when priority is quality', () => {
      const decision = router.route('explain quantum physics in detail', { priority: 'quality' });
      
      const capability = PROVIDER_CAPABILITIES.find(
        p => p.providerId === decision.provider && p.model === decision.model
      );
      expect(capability?.qualityScore).toBeGreaterThanOrEqual(7);
    });

    it('should respect cost priority', () => {
      const decision = router.route('simple question', { priority: 'cost' });
      
      const capability = PROVIDER_CAPABILITIES.find(
        p => p.providerId === decision.provider && p.model === decision.model
      );
      expect(capability?.costScore).toBeGreaterThanOrEqual(7);
    });

    it('should respect Arabic requirement', () => {
      const decision = router.route('مرحبا كيف حالك', { requireArabic: true });
      
      const capability = PROVIDER_CAPABILITIES.find(
        p => p.providerId === decision.provider && p.model === decision.model
      );
      expect(capability?.supportsArabic).toBe(true);
    });

    it('should respect streaming requirement', () => {
      const decision = router.route('tell me a story', { requireStreaming: true });
      
      const capability = PROVIDER_CAPABILITIES.find(
        p => p.providerId === decision.provider && p.model === decision.model
      );
      expect(capability?.supportsStreaming).toBe(true);
    });

    it('should respect excluded providers', () => {
      const decision = router.route('hello', { 
        excludeProviders: ['groq', 'gemini'] 
      });
      
      expect(decision.provider).not.toBe('groq');
      expect(decision.provider).not.toBe('gemini');
    });

    it('should prefer specified providers', () => {
      const decision = router.route('hello', { 
        preferProviders: ['mistral'] 
      });
      
      // Mistral should be selected or be first fallback
      const isMistralSelected = decision.provider === 'mistral' ||
        decision.fallbacks.some(f => f.provider === 'mistral');
      expect(isMistralSelected).toBe(true);
    });
  });

  // ===== FALLBACK TESTS =====
  describe('Fallback System', () => {
    it('should provide fallback options', () => {
      const decision = router.route('complex analysis task');
      expect(decision.fallbacks.length).toBeGreaterThan(0);
    });

    it('should get next fallback correctly', () => {
      const decision = router.route('hello');
      const failed = [`${decision.provider}/${decision.model}`];
      
      const nextDecision = router.getNextFallback(decision, failed);
      
      if (decision.fallbacks.length > 0) {
        expect(nextDecision).not.toBeNull();
        expect(nextDecision?.provider).not.toBe(decision.provider);
      }
    });

    it('should return null when no fallbacks available', () => {
      const decision = router.route('hello');
      const allFailed = [
        `${decision.provider}/${decision.model}`,
        ...decision.fallbacks.map(f => `${f.provider}/${f.model}`)
      ];
      
      const nextDecision = router.getNextFallback(decision, allFailed);
      expect(nextDecision).toBeNull();
    });
  });

  // ===== HEALTH TRACKING TESTS =====
  describe('Health Tracking', () => {
    it('should record successful results', () => {
      const decision = router.route('test');
      router.recordResult(decision, true, 100);
      
      const health = router.getProviderHealth(decision.provider, decision.model);
      expect(health).not.toBeNull();
    });

    it('should record failed results', () => {
      const decision = router.route('test');
      router.recordResult(decision, false, 5000, undefined, 'Test error');
      
      const health = router.getProviderHealth(decision.provider, decision.model);
      expect(health?.failures).toBeGreaterThan(0);
    });

    it('should mark provider as unhealthy after multiple failures', () => {
      const decision = router.route('test');
      
      // Record multiple failures
      for (let i = 0; i < 5; i++) {
        router.recordResult(decision, false, 1000, undefined, 'Error');
      }
      
      const healthStatus = router.getAllHealthStatus();
      const key = `${decision.provider}/${decision.model}`;
      expect(healthStatus[key].healthy).toBe(false);
    });
  });

  // ===== PROVIDER AVAILABILITY TESTS =====
  describe('Provider Availability', () => {
    it('should list available providers', () => {
      const providers = router.getAvailableProviders();
      expect(providers.length).toBeGreaterThan(0);
    });

    it('should filter providers by task type', () => {
      const imageProviders = router.getAvailableProviders('image_gen');
      
      imageProviders.forEach(p => {
        expect(p.taskTypes).toContain('image_gen');
      });
    });

    it('should get recommendations', () => {
      const rec = router.getRecommendation('chat', 'balanced');
      
      expect(rec).toHaveProperty('recommended');
      expect(rec).toHaveProperty('alternatives');
      expect(rec).toHaveProperty('reasoning');
    });
  });
});

// ============================================
// COST TRACKER TESTS
// ============================================
describe('CostTracker', () => {
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = new CostTracker({
      dailyLimit: 10,
      monthlyLimit: 100,
      alertThreshold: 0.8,
    });
  });

  // ===== COST CALCULATION TESTS =====
  describe('Cost Calculation', () => {
    it('should calculate token-based costs correctly', () => {
      const cost = tracker.calculateCost('groq', 'llama-3.3-70b-versatile', {
        inputTokens: 1000,
        outputTokens: 1000,
      });
      
      // Expected: (1000/1000 * 0.00059) + (1000/1000 * 0.00079) = 0.00138
      expect(cost).toBeCloseTo(0.00138, 5);
    });

    it('should calculate image generation costs', () => {
      const cost = tracker.calculateCost('replicate', 'flux-schnell', {
        images: 1,
      });
      
      expect(cost).toBe(0.003);
    });

    it('should calculate TTS costs', () => {
      const cost = tracker.calculateCost('elevenlabs', 'eleven_multilingual_v2', {
        characters: 1000,
      });
      
      // Expected: 1000 * 0.00003 = 0.03
      expect(cost).toBeCloseTo(0.03, 5);
    });

    it('should calculate search costs', () => {
      const cost = tracker.calculateCost('tavily', 'search', {
        requestCount: 1,
      });
      
      expect(cost).toBe(0.001);
    });

    it('should return 0 for unknown providers', () => {
      const cost = tracker.calculateCost('unknown' as ProviderId, 'unknown', {
        requestCount: 1,
      });
      
      expect(cost).toBe(0);
    });
  });

  // ===== USAGE RECORDING TESTS =====
  describe('Usage Recording', () => {
    it('should record usage correctly', () => {
      const record = tracker.recordUsage({
        timestamp: new Date(),
        providerId: 'groq',
        model: 'llama-3.3-70b-versatile',
        taskCategory: 'chat',
        inputTokens: 500,
        outputTokens: 500,
        success: true,
        latencyMs: 100,
      });

      expect(record.id).toBeDefined();
      expect(record.calculatedCost).toBeGreaterThan(0);
    });

    it('should accumulate costs in summary', () => {
      // Record multiple usages
      for (let i = 0; i < 5; i++) {
        tracker.recordUsage({
          timestamp: new Date(),
          providerId: 'groq',
          model: 'llama-3.3-70b-versatile',
          taskCategory: 'chat',
          inputTokens: 1000,
          outputTokens: 1000,
          success: true,
          latencyMs: 100,
        });
      }

      const summary = tracker.getCostSummary('day');
      expect(summary.totalRequests).toBe(5);
      expect(summary.totalCost).toBeGreaterThan(0);
    });
  });

  // ===== BUDGET TESTS =====
  describe('Budget Management', () => {
    it('should track budget status', () => {
      const status = tracker.getBudgetStatus();
      
      expect(status.daily).toHaveProperty('used');
      expect(status.daily).toHaveProperty('limit');
      expect(status.daily).toHaveProperty('percentage');
      expect(status.monthly).toHaveProperty('used');
    });

    it('should update budget limits', () => {
      tracker.setBudget({ dailyLimit: 20 });
      
      const status = tracker.getBudgetStatus();
      expect(status.daily.limit).toBe(20);
    });

    it('should detect over-budget status', () => {
      // Record expensive usage
      for (let i = 0; i < 100; i++) {
        tracker.recordUsage({
          timestamp: new Date(),
          providerId: 'openrouter',
          model: 'openai/gpt-4o',
          taskCategory: 'chat',
          inputTokens: 10000,
          outputTokens: 10000,
          success: true,
          latencyMs: 1000,
        });
      }

      const status = tracker.getBudgetStatus();
      expect(status.isOverBudget).toBe(true);
    });
  });

  // ===== PROVIDER STATS TESTS =====
  describe('Provider Statistics', () => {
    beforeEach(() => {
      // Add some usage data
      tracker.recordUsage({
        timestamp: new Date(),
        providerId: 'groq',
        model: 'llama-3.3-70b-versatile',
        taskCategory: 'chat',
        inputTokens: 1000,
        outputTokens: 1000,
        success: true,
        latencyMs: 150,
      });
    });

    it('should return provider stats', () => {
      const stats = tracker.getProviderStats('groq');
      
      expect(stats.totalRequests).toBe(1);
      expect(stats.totalCost).toBeGreaterThan(0);
      expect(stats.avgLatency).toBe(150);
      expect(stats.successRate).toBe(1);
    });

    it('should calculate remaining free quota', () => {
      const stats = tracker.getProviderStats('groq');
      
      expect(stats.remainingFreeQuota).toBeDefined();
      expect(stats.remainingFreeQuota['llama-3.3-70b-versatile']).toBeDefined();
    });
  });

  // ===== OPTIMIZATION SUGGESTIONS TESTS =====
  describe('Cost Optimization', () => {
    it('should provide optimization suggestions', () => {
      // Record expensive model usage
      for (let i = 0; i < 10; i++) {
        tracker.recordUsage({
          timestamp: new Date(),
          providerId: 'openrouter',
          model: 'openai/gpt-4o',
          taskCategory: 'chat',
          inputTokens: 5000,
          outputTokens: 5000,
          success: true,
          latencyMs: 2000,
        });
      }

      const suggestions = tracker.getCostOptimizationSuggestions();
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  // ===== DATA EXPORT/IMPORT TESTS =====
  describe('Data Management', () => {
    it('should export data', () => {
      tracker.recordUsage({
        timestamp: new Date(),
        providerId: 'groq',
        model: 'llama-3.3-70b-versatile',
        taskCategory: 'chat',
        inputTokens: 100,
        outputTokens: 100,
        success: true,
        latencyMs: 50,
      });

      const exported = tracker.exportData();
      
      expect(exported.usageRecords.length).toBe(1);
      expect(exported.budget).toBeDefined();
    });

    it('should import data', () => {
      const newTracker = new CostTracker();
      
      newTracker.importData({
        budget: { dailyLimit: 50, monthlyLimit: 500, alertThreshold: 0.9 },
      });

      const status = newTracker.getBudgetStatus();
      expect(status.daily.limit).toBe(50);
    });

    it('should clear data', () => {
      tracker.recordUsage({
        timestamp: new Date(),
        providerId: 'groq',
        model: 'llama-3.3-70b-versatile',
        taskCategory: 'chat',
        inputTokens: 100,
        outputTokens: 100,
        success: true,
        latencyMs: 50,
      });

      const cleared = tracker.clearData();
      expect(cleared).toBe(1);

      const summary = tracker.getCostSummary('all');
      expect(summary.totalRequests).toBe(0);
    });
  });
});

// ============================================
// PRICING DATA TESTS
// ============================================
describe('Pricing Data', () => {
  it('should have all 11 providers defined', () => {
    const expectedProviders: ProviderId[] = [
      'groq', 'gemini', 'openrouter', 'mistral', 'cohere',
      'replicate', 'elevenlabs', 'e2b', 'firecrawl', 'tavily', 'resend'
    ];

    expectedProviders.forEach(provider => {
      expect(PROVIDER_PRICING[provider]).toBeDefined();
      expect(PROVIDER_PRICING[provider].name).toBeDefined();
      expect(PROVIDER_PRICING[provider].models).toBeDefined();
    });
  });

  it('should have valid pricing for each model', () => {
    Object.values(PROVIDER_PRICING).forEach(provider => {
      Object.entries(provider.models).forEach(([model, pricing]) => {
        // At least one pricing type should be defined
        const hasPricing = 
          pricing.inputPer1kTokens !== undefined ||
          pricing.outputPer1kTokens !== undefined ||
          pricing.perRequest !== undefined ||
          pricing.perMinute !== undefined ||
          pricing.perCharacter !== undefined ||
          pricing.perImage !== undefined;
        
        expect(hasPricing).toBe(true);
      });
    });
  });
});

// ============================================
// UTILITY FUNCTIONS TESTS
// ============================================
describe('Utility Functions', () => {
  describe('formatCost', () => {
    it('should format small costs in millicents', () => {
      expect(formatCost(0.001)).toBe('$1.000m');
    });

    it('should format medium costs with 4 decimals', () => {
      expect(formatCost(0.1234)).toBe('$0.1234');
    });

    it('should format large costs with 2 decimals', () => {
      expect(formatCost(12.34)).toBe('$12.34');
    });
  });

  describe('getProviderColor', () => {
    it('should return a color for each provider', () => {
      const providers: ProviderId[] = [
        'groq', 'gemini', 'openrouter', 'mistral', 'cohere',
        'replicate', 'elevenlabs', 'e2b', 'firecrawl', 'tavily', 'resend'
      ];

      providers.forEach(provider => {
        const color = getProviderColor(provider);
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('getCategoryIcon', () => {
    it('should return an icon for each category', () => {
      const categories: TaskCategory[] = [
        'chat', 'vision', 'image_gen', 'audio_tts', 'audio_stt',
        'code_exec', 'search', 'scrape', 'email'
      ];

      categories.forEach(category => {
        const icon = getCategoryIcon(category);
        expect(icon.length).toBeGreaterThan(0);
      });
    });
  });
});

// ============================================
// INTEGRATION TESTS
// ============================================
describe('Integration Tests', () => {
  it('should work end-to-end: route -> record -> analyze', () => {
    const router = new SmartRouter();
    const tracker = new CostTracker();

    // 1. Route a request
    const decision = router.route('explain machine learning', { priority: 'balanced' });
    expect(decision.provider).toBeDefined();

    // 2. Simulate successful execution
    router.recordResult(decision, true, 1500, 0.005);

    // 3. Record cost
    const record = tracker.recordUsage({
      timestamp: new Date(),
      providerId: decision.provider,
      model: decision.model,
      taskCategory: 'chat',
      inputTokens: 500,
      outputTokens: 2000,
      success: true,
      latencyMs: 1500,
    });

    expect(record.calculatedCost).toBeGreaterThan(0);

    // 4. Get summary
    const summary = tracker.getCostSummary('day');
    expect(summary.totalRequests).toBe(1);

    // 5. Check health
    const health = router.getAllHealthStatus();
    expect(Object.keys(health).length).toBeGreaterThan(0);
  });

  it('should handle fallback scenario', () => {
    const router = new SmartRouter();

    // Get initial decision
    const decision = router.route('test request');
    const initialProvider = decision.provider;

    // Record failure
    router.recordResult(decision, false, 5000, undefined, 'Rate limited');

    // Get fallback
    const fallback = router.getNextFallback(decision, [`${decision.provider}/${decision.model}`]);

    if (decision.fallbacks.length > 0) {
      expect(fallback).not.toBeNull();
      expect(`${fallback!.provider}/${fallback!.model}`).not.toBe(`${initialProvider}/${decision.model}`);
    }
  });

  it('should calculate realistic daily costs', () => {
    const tracker = new CostTracker();

    // Simulate a day's usage
    const usagePatterns = [
      { provider: 'groq' as ProviderId, model: 'llama-3.3-70b-versatile', count: 50, tokens: 500 },
      { provider: 'gemini' as ProviderId, model: 'gemini-1.5-flash', count: 30, tokens: 1000 },
      { provider: 'tavily' as ProviderId, model: 'search', count: 10, tokens: 0 },
      { provider: 'elevenlabs' as ProviderId, model: 'eleven_turbo_v2', count: 5, chars: 500 },
    ];

    usagePatterns.forEach(pattern => {
      for (let i = 0; i < pattern.count; i++) {
        tracker.recordUsage({
          timestamp: new Date(),
          providerId: pattern.provider,
          model: pattern.model,
          taskCategory: 'chat',
          inputTokens: pattern.tokens,
          outputTokens: pattern.tokens,
          characters: pattern.chars || 0,
          requestCount: pattern.provider === 'tavily' ? 1 : 0,
          success: true,
          latencyMs: 200,
        });
      }
    });

    const summary = tracker.getCostSummary('day');
    
    // Realistic daily cost should be under $1 for free tier usage
    expect(summary.totalCost).toBeLessThan(1);
    expect(summary.totalRequests).toBe(95); // 50 + 30 + 10 + 5
  });
});
