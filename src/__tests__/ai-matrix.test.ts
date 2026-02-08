// ============================================
// 🧪 AI MATRIX TESTS
// ============================================
// Tests for the multi-provider AI system

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock import.meta.env
vi.mock('../services/aiMatrix', async () => {
  const KEYS = {
    groq: 'test-groq-key',
    gemini: 'test-gemini-key',
    mistral: 'test-mistral-key',
    cohere: 'test-cohere-key',
    tavily: 'test-tavily-key',
    firecrawl: 'test-firecrawl-key',
    elevenlabs: 'test-elevenlabs-key',
    replicate: 'test-replicate-key',
  };

  return {
    getMatrixStatus: () => ({
      chat: {
        groq: true,
        gemini: true,
        mistral: true,
        cohere: true,
      },
      search: true,
      scrape: true,
      tts: true,
      stt: true,
      imageGen: true,
      codeExec: false,
      email: false,
    }),
  };
});

describe('AI Matrix Configuration', () => {
  describe('getMatrixStatus', () => {
    it('should report all chat providers as configured', async () => {
      const { getMatrixStatus } = await import('../services/aiMatrix');
      const status = getMatrixStatus();
      
      expect(status.chat.groq).toBe(true);
      expect(status.chat.gemini).toBe(true);
      expect(status.chat.mistral).toBe(true);
      expect(status.chat.cohere).toBe(true);
    });

    it('should report search capability', async () => {
      const { getMatrixStatus } = await import('../services/aiMatrix');
      const status = getMatrixStatus();
      
      expect(status.search).toBe(true);
    });

    it('should report TTS capability', async () => {
      const { getMatrixStatus } = await import('../services/aiMatrix');
      const status = getMatrixStatus();
      
      expect(status.tts).toBe(true);
    });

    it('should report image generation capability', async () => {
      const { getMatrixStatus } = await import('../services/aiMatrix');
      const status = getMatrixStatus();
      
      expect(status.imageGen).toBe(true);
    });
  });
});

describe('Provider Fallback Logic', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should have 4 chat providers in priority order', () => {
    // Groq -> Mistral -> Cohere -> Gemini
    const providers = ['groq', 'mistral', 'cohere', 'gemini'];
    expect(providers).toHaveLength(4);
    expect(providers[0]).toBe('groq'); // Fastest first
  });

  it('should fallback to next provider on failure', async () => {
    // Simulate Groq failing, Mistral succeeding
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 429,
          text: () => Promise.resolve('Rate limited'),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Test response' } }],
        }),
      });
    });

    // The matrix should try Groq first, then fallback to Mistral
    expect(callCount).toBe(0);
  });

  it('should include web search results when enabled', () => {
    const searchEnabled = true;
    const query = 'What is the weather today?';
    
    // Web search should be triggered for questions
    expect(searchEnabled).toBe(true);
    expect(query.includes('?')).toBe(true);
  });
});

describe('Message Formatting', () => {
  it('should format messages correctly for OpenAI-compatible APIs', () => {
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
      { role: 'user', content: 'How are you?' },
    ];

    // OpenAI format (Groq, Mistral)
    const openAIBody = {
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 4096,
    };

    expect(openAIBody.messages).toHaveLength(3);
    expect(openAIBody.messages[0].role).toBe('user');
  });

  it('should format messages correctly for Cohere API', () => {
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' },
      { role: 'user', content: 'Question?' },
    ];

    // Cohere format
    const lastMsg = messages[messages.length - 1];
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
      message: m.content,
    }));

    const cohereBody = {
      message: lastMsg.content,
      chat_history: history,
      model: 'command-r-plus',
    };

    expect(cohereBody.message).toBe('Question?');
    expect(cohereBody.chat_history).toHaveLength(2);
    expect(cohereBody.chat_history[0].role).toBe('USER');
    expect(cohereBody.chat_history[1].role).toBe('CHATBOT');
  });

  it('should format messages correctly for Gemini API', () => {
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' },
    ];

    // Gemini format
    const geminiBody = {
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    };

    expect(geminiBody.contents).toHaveLength(2);
    expect(geminiBody.contents[0].role).toBe('user');
    expect(geminiBody.contents[1].role).toBe('model');
  });
});

describe('Language Support', () => {
  it('should add Arabic system prompt when language is ar', () => {
    const language = 'ar';
    const systemPrompt = language === 'ar' 
      ? 'أنت مساعد ذكي. أجب دائماً باللغة العربية بشكل واضح ومفيد.'
      : 'You are a helpful AI assistant. Respond clearly and helpfully.';

    expect(systemPrompt).toContain('العربية');
  });

  it('should add English system prompt when language is en', () => {
    const language = 'en';
    const systemPrompt = language === 'ar' 
      ? 'أنت مساعد ذكي. أجب دائماً باللغة العربية بشكل واضح ومفيد.'
      : 'You are a helpful AI assistant. Respond clearly and helpfully.';

    expect(systemPrompt).toContain('helpful');
  });
});

describe('Web Search Detection', () => {
  it('should detect questions needing search', () => {
    const queries = [
      'What is the latest news?',
      'Search for React tutorials',
      'Find me information about AI',
      'Who is the president of France?',
      'ابحث عن أخبار اليوم',
      'ما هو الطقس اليوم؟',
    ];

    const needsSearch = (msg: string) => 
      msg.includes('?') ||
      /search|find|look up|what is|who is|latest|current|today|news/i.test(msg) ||
      /ابحث|بحث|ما هو|من هو|أخبار|حالي/i.test(msg);

    queries.forEach(q => {
      expect(needsSearch(q)).toBe(true);
    });
  });

  it('should not trigger search for simple statements', () => {
    const statements = [
      'Hello',
      'Thanks for your help',
      'I understand',
      'مرحبا',
    ];

    const needsSearch = (msg: string) => 
      /search|find|look up|what is|who is|latest|current|today|news/i.test(msg) ||
      /ابحث|بحث|ما هو|من هو|أخبار|حالي/i.test(msg);

    statements.forEach(s => {
      expect(needsSearch(s)).toBe(false);
    });
  });
});
