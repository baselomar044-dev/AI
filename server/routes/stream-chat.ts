// ============================================
// 🌊 STREAMING CHAT ROUTE - Real-time AI Responses
// ============================================
// Understands: Arabic, English, Franco-Arab
// ALWAYS responds in Arabic unless explicitly asked otherwise
// ============================================

import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { SmartRouter } from '../lib/smart-router';
import SYSTEM_PROMPT, { detectLanguage, getRequestedLanguage } from '../lib/personality';
import { generateUnlimitedSystemPrompt, DEFAULT_UNLIMITED_CONFIG, UNLIMITED_THINKING, generateThinkingPrompt, unlimitedAI } from '../lib/unlimited-ai';
import { generateUltimatePrompt, detectMood, getResponseLanguage, getAdaptiveStyle } from '../lib/ultimate-personality';
import KnowledgeManager from '../lib/knowledge-system';

const router = Router();

// Initialize AI clients
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize smart router
const smartRouter = new SmartRouter();

import fs from 'fs';
import path from 'path';

// Persistence
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MEMORY_FILE = path.join(DATA_DIR, 'memory.json');
const PERSONALITY_FILE = path.join(DATA_DIR, 'personality.json');

// Helper to load/save JSON
function loadJSON(file: string, defaultVal: any) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch (e) {
    console.error(`Failed to load ${file}`, e);
  }
  return defaultVal;
}

function saveJSON(file: string, data: any) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Failed to save ${file}`, e);
  }
}

// In-memory stores backed by file
let personalityStore: Record<string, any> = loadJSON(PERSONALITY_FILE, {});
let memoryStore: Record<string, any[]> = loadJSON(MEMORY_FILE, {});

// Simple personality manager
class PersonalityManager {
  userId: string;
  data: any = { currentMood: 'neutral' };
  
  constructor(userId: string) {
    this.userId = userId;
  }
  
  async load() {
    this.data = personalityStore[this.userId] || { currentMood: 'neutral' };
  }
  
  async update(updates: any) {
    this.data = { ...this.data, ...updates };
    personalityStore[this.userId] = this.data;
    saveJSON(PERSONALITY_FILE, personalityStore);
  }
  
  getSystemPrompt() {
    return SYSTEM_PROMPT;
  }
}

// Simple memory manager
class MemoryManager {
  userId: string;
  
  constructor(userId: string) {
    this.userId = userId;
  }
  
  async getRelevantContext(_message: string): Promise<string> {
    const memories = memoryStore[this.userId] || [];
    if (memories.length === 0) return '';
    
    // Return last 20 relevant memories (Increased from 5)
    const relevant = memories.slice(-20);
    return '\n\n📝 ذكريات سابقة (User Memories):\n' + relevant.map(m => `- ${m.content}`).join('\n');
  }
  
  async saveMemory(memory: { content: string; category: string }) {
    if (!memoryStore[this.userId]) {
      memoryStore[this.userId] = [];
    }
    
    // Check for duplicates
    const exists = memoryStore[this.userId].some(m => m.content === memory.content);
    if (!exists) {
        memoryStore[this.userId].push({
        ...memory,
        timestamp: new Date().toISOString()
        });
        saveJSON(MEMORY_FILE, memoryStore);
    }
  }
}

// Mood detection
function detectMood(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Happy indicators
  if (/😊|😄|😃|happy|great|awesome|شكرا|ممتاز|حلو|جميل|7elw|gameel|shokran/.test(lowerText)) {
    return 'happy';
  }
  
  // Frustrated indicators  
  if (/😤|😡|wtf|ugh|مش|ليه كدا|زهقت|msh|za7a8t|leih keda/.test(lowerText)) {
    return 'frustrated';
  }
  
  // Curious indicators
  if (/\?|؟|كيف|ازاي|ezay|how|what|why|ايه|eh|eih/.test(lowerText)) {
    return 'curious';
  }
  
  return 'neutral';
}

// Extract memories from message
function extractMemories(message: string): any[] {
  const memories: any[] = [];
  
  // Detect preferences
  const prefPatterns = [
    /i (love|like|prefer|enjoy|hate|dislike) (.+)/i,
    /أنا (أحب|بحب|أفضل|أكره) (.+)/,
    /ana (b7eb|ba7eb|bafadel|bakrah) (.+)/i,
  ];
  
  for (const pattern of prefPatterns) {
    const match = message.match(pattern);
    if (match) {
      memories.push({
        content: message,
        category: 'preference'
      });
    }
  }
  
  // Detect facts about user
  const factPatterns = [
    /my name is (.+)/i,
    /i am (\d+) years old/i,
    /i work (at|as|in) (.+)/i,
    /i live in (.+)/i,
    /اسمي (.+)/,
    /عمري (.+)/,
    /أعمل (.+)/,
    /أسكن في (.+)/,
    /esmi (.+)/i,
    /3omri (.+)/i,
    /bashta8al (.+)/i,
  ];
  
  for (const pattern of factPatterns) {
    const match = message.match(pattern);
    if (match) {
      memories.push({
        content: message,
        category: 'fact'
      });
    }
  }
  
  return memories;
}

// SSE Headers helper
function setSSEHeaders(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
}

// Send SSE event
function sendEvent(res: Response, type: string, data: any) {
  res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
}

// ================== STREAMING CHAT ENDPOINT ==================

router.post('/stream', async (req: Request, res: Response) => {
  const { 
    message, 
    images, 
    files, 
    systemPrompt: customSystemPrompt,
    temperature = 0.7,
    maxTokens = 4096,
    unlimitedConfig = DEFAULT_UNLIMITED_CONFIG,
    conversationHistory = [],
    apiKeys = {}, // Receive API keys from client
  } = req.body;
  
  // Update process.env with client keys if provided (for this request context)
  // Note: We use a helper or local variables instead of mutating process.env globally to avoid race conditions,
  // but for simplicity in this architecture, we'll prioritize checking apiKeys object in provider calls.
  
  const userId = (req as any).user?.id || 'anonymous';
  
  // Set SSE headers
  setSSEHeaders(res);
  
  console.log('📝 New Chat Request:', { 
    messageLength: message?.length, 
    hasImages: !!images, 
    providerKeys: Object.keys(apiKeys).filter(k => !!apiKeys[k]),
    serverKeys: Object.keys(process.env).filter(k => k.endsWith('_API_KEY'))
  });

  try {
    // Initialize AI clients with fallback to provided keys
    const geminiKey = apiKeys.gemini || process.env.GEMINI_API_KEY || '';
    const groqKey = apiKeys.groq || process.env.GROQ_API_KEY || '';
    
    // Re-initialize clients for this request if keys are provided
    const requestGemini = new GoogleGenerativeAI(geminiKey);
    const requestGroq = new Groq({ apiKey: groqKey });

    // Instantiate Managers for this request
    const personalityManager = new PersonalityManager(userId);
    const memoryManager = new MemoryManager(userId);
    const knowledgeManager = new KnowledgeManager(userId);
    
    await personalityManager.load();
    
    // Detect mood with enhanced detection
    const moodData = detectMood(message);
    await personalityManager.update({ currentMood: moodData.mood });
    
    // Get relevant memories (legacy)
    const memoryContext = await memoryManager.getRelevantContext(message);
    
    // Get knowledge context (new system - automatic)
    let knowledgeContext = '';
    try {
      knowledgeContext = await knowledgeManager.generateContext(message);
    } catch (e) {
      console.log('Knowledge system not available, using memories only');
    }
    
    // Auto-extract and save new knowledge from message
    try {
      await knowledgeManager.extractAndSave(message, { mood: moodData.mood });
    } catch (e) {
      // Silent fail - knowledge extraction is optional
    }
    
    // Extract new memories from message (legacy system)
    const newMemories = extractMemories(message);
    for (const memory of newMemories) {
      await memoryManager.saveMemory(memory);
    }
    
    // Detect languages
    const inputLang = detectLanguage(message);
    const responseLang = getResponseLanguage(message);
    console.log(`📝 Input: ${inputLang}, Response will be: ${responseLang}`);
    
    // Get adaptive style based on conversation
    const adaptiveStyle = getAdaptiveStyle(message, conversationHistory);
    
    // Build ULTIMATE system prompt
    const userContext = knowledgeContext || memoryContext;
    const ultimatePrompt = generateUltimatePrompt(adaptiveStyle, userContext);
    
    // Language instruction
    let languageInstruction = '';
    
    // Strict Arabic enforcement (unless explicit request)
    const explicitLanguage = getRequestedLanguage(message);
    
    if (explicitLanguage === 'english') {
       languageInstruction = '\n\n🔴 Language: Respond in English (User explicitly requested English).';
    } else {
       // Default to Arabic for EVERYTHING (Arabic, Franco, English inputs)
       languageInstruction = '\n\n🔴 تعليمات اللغة: رد بالعربية دائماً (حتى لو السؤال بالإنجليزي أو الفرانكو)!';
    }
    
    // Check if user explicitly requested a language
    const requestedLang = getRequestedLanguage(message);
    if (requestedLang) {
      languageInstruction = `\n\n🔴 Language instruction: Respond in ${requestedLang} as requested by user.`;
    }
    
    // Add UNLIMITED THINKING capabilities
    const unlimitedThinkingPrompt = generateThinkingPrompt(UNLIMITED_THINKING);
    
    // Combine all prompts with UNLIMITED THINKING
    const fullSystemPrompt = customSystemPrompt 
      ? `${ultimatePrompt}${languageInstruction}\n\n${unlimitedThinkingPrompt}\n\n${customSystemPrompt}`
      : `${ultimatePrompt}${languageInstruction}\n\n${unlimitedThinkingPrompt}`;
    
    // Detect task type and get best provider
    const taskType = smartRouter.detectTaskType(message, !!images);
    
    console.log('🤔 Routing request:', { taskType });
    
    const routingDecision = smartRouter.route(message, { 
      priority: 'balanced', 
      taskType,
      clientKeys: apiKeys 
    });
    
    console.log('👉 Selected Provider:', routingDecision.provider, routingDecision.model);
    
    // Send metadata
    sendEvent(res, 'metadata', {
      model: routingDecision.model,
      provider: routingDecision.provider,
      taskType,
      inputLanguage: inputLang,
      responseLanguage: responseLang,
      mood: moodData.mood,
      moodEmoji: moodData.emoji,
      hasKnowledge: !!knowledgeContext,
      cached: false,
    });
    
    // Route to appropriate provider
    if (routingDecision.provider === 'groq') {
      await streamGroq(res, {
        message,
        systemPrompt: fullSystemPrompt,
        model: routingDecision.model,
        temperature,
        maxTokens,
        memoryContext,
        client: requestGroq, // Pass specific client
      });
    } else if (routingDecision.provider === 'gemini') {
      await streamGemini(res, {
        message,
        systemPrompt: fullSystemPrompt,
        model: routingDecision.model,
        temperature,
        maxTokens,
        images,
        memoryContext,
        client: requestGemini, // Pass specific client
      });
    } else if (routingDecision.provider === 'mistral') {
      await streamMistral(res, {
        message,
        systemPrompt: fullSystemPrompt,
        model: routingDecision.model,
        temperature,
        maxTokens,
        memoryContext,
        apiKey: apiKeys.mistral || process.env.MISTRAL_API_KEY,
      });
    } else if (routingDecision.provider === 'cohere') {
      await streamCohere(res, {
        message,
        systemPrompt: fullSystemPrompt,
        model: routingDecision.model,
        temperature,
        maxTokens,
        memoryContext,
        apiKey: apiKeys.cohere || process.env.COHERE_API_KEY,
      });
    } else {
      await streamOpenRouter(res, {
        message,
        systemPrompt: fullSystemPrompt,
        model: routingDecision.model,
        temperature,
        maxTokens,
        memoryContext,
        apiKey: apiKeys.openrouter || process.env.OPENROUTER_API_KEY,
      });
    }
    
    // End stream
    res.write('data: [DONE]\n\n');
    res.end();
    
  } catch (error: any) {
    console.error('Streaming error:', error);
    sendEvent(res, 'error', { message: error.message || 'AI provider error - check your API keys' });
    res.end();
  }
});

// ================== PROVIDER STREAMING FUNCTIONS ==================

async function streamGroq(
  res: Response,
  options: {
    message: string;
    systemPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    memoryContext: string;
    client: Groq;
  }
) {
  const { message, systemPrompt, model, temperature, maxTokens, memoryContext, client } = options;
  
  const stream = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt + memoryContext },
      { role: 'user', content: message },
    ],
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      sendEvent(res, 'token', { content });
    }
  }
}

async function streamGemini(
  res: Response,
  options: {
    message: string;
    systemPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    images?: string[];
    memoryContext: string;
    client: GoogleGenerativeAI;
  }
) {
  const { message, systemPrompt, model, temperature, maxTokens, images, memoryContext, client } = options;
  
  const genModel = client.getGenerativeModel({ 
    model,
    systemInstruction: systemPrompt + memoryContext,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });
  
  // Build content parts
  const parts: any[] = [{ text: message }];
  
  // Add images if present
  if (images && images.length > 0) {
    for (const imageData of images) {
      // Assume base64 data
      const [mimeType, base64] = imageData.split(';base64,');
      parts.push({
        inlineData: {
          mimeType: mimeType.replace('data:', ''),
          data: base64,
        },
      });
    }
  }
  
  const result = await genModel.generateContentStream(parts);
  
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      sendEvent(res, 'token', { content: text });
    }
  }
}

async function streamMistral(
  res: Response,
  options: {
    message: string;
    systemPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    memoryContext: string;
    apiKey: string;
  }
) {
  const { message, systemPrompt, model, temperature, maxTokens, memoryContext, apiKey } = options;
  
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt + memoryContext },
        { role: 'user', content: message },
      ],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Mistral error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6));
          const content = data.choices?.[0]?.delta?.content;
          if (content) {
            sendEvent(res, 'token', { content });
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }
}

async function streamCohere(
  res: Response,
  options: {
    message: string;
    systemPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    memoryContext: string;
    apiKey: string;
  }
) {
  const { message, systemPrompt, model, temperature, maxTokens, memoryContext, apiKey } = options;
  
  const response = await fetch('https://api.cohere.com/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      model,
      message,
      preamble: systemPrompt + memoryContext,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Cohere error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.event_type === 'text-generation' && data.text) {
          sendEvent(res, 'token', { content: data.text });
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }
}

async function streamOpenRouter(
  res: Response,
  options: {
    message: string;
    systemPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    memoryContext: string;
    apiKey: string;
  }
) {
  const { message, systemPrompt, model, temperature, maxTokens, memoryContext, apiKey } = options;
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt + memoryContext },
        { role: 'user', content: message },
      ],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.statusText}`);
  }
  
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');
  
  const decoder = new TextDecoder();
  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6));
          const content = data.choices?.[0]?.delta?.content;
          if (content) {
            sendEvent(res, 'token', { content });
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }
}

// ================== NON-STREAMING ENDPOINT (Fallback) ==================

router.post('/complete', async (req: Request, res: Response) => {
  const { message, images } = req.body;
  const userId = (req as any).user?.id || 'anonymous';
  
  try {
    // Initialize managers
    const knowledgeManager = new KnowledgeManager(userId);
    const personalityManager = new PersonalityManager(userId);
    const memoryManager = new MemoryManager(userId); // Add memory manager

    // Load context
    let knowledgeContext = '';
    try {
      knowledgeContext = await knowledgeManager.generateContext(message);
    } catch (e) {
      console.log('Knowledge system skipped for completion');
    }
    
    // Build Prompt
    const adaptiveStyle = getAdaptiveStyle(message, []);
    const ultimatePrompt = generateUltimatePrompt(adaptiveStyle, knowledgeContext);

    // Detect task and route
    const taskType = smartRouter.detectTaskType(message, !!images);
    const routingDecision = smartRouter.route(message, { 
      priority: 'balanced', 
      taskType,
      clientKeys: (req.body as any).apiKeys 
    });
    
    // Check if user requested specific response language
    const requestedLang = getRequestedLanguage(message);
    const languageInstruction = requestedLang 
      ? `Respond in ${requestedLang}.`
      : 'رد بالعربية دائماً - Always respond in Arabic.';
    
    const fullSystemPrompt = `${ultimatePrompt}\n\n${languageInstruction}`;

    let response: string;
    
    if (routingDecision.provider === 'groq') {
      const completion = await groq.chat.completions.create({
        model: routingDecision.model,
        messages: [
          { role: 'system', content: fullSystemPrompt },
          { role: 'user', content: message }
        ],
      });
      response = completion.choices[0]?.message?.content || '';
    } else {
      const model = gemini.getGenerativeModel({ 
        model: routingDecision.model,
        systemInstruction: fullSystemPrompt,
      });
      const result = await model.generateContent(message);
      response = result.response.text();
    }
    
    res.json({
      response,
      metadata: {
        model: routingDecision.model,
        provider: routingDecision.provider,
        taskType,
        hasKnowledge: !!knowledgeContext
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================== DEEP THINKING ENDPOINT ==================

router.post('/deep-think', async (req: Request, res: Response) => {
  const { 
    message, 
    thinkingDepth = 'unlimited',
    showReasoning = true,
    multiPerspective = false,
    maxTokens = 16384,
    temperature = 0.9,
  } = req.body;
  
  try {
    const result = await unlimitedAI.deepThink({
      messages: [{ role: 'user', content: message }],
      thinkingDepth,
      showReasoning,
      multiPerspective,
      maxTokens,
      temperature,
    });
    
    res.json({
      response: result.content,
      model: result.model,
      provider: result.provider,
      thinkingMode: 'unlimited',
      noBoundaries: true,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================== CHAIN OF THOUGHT ENDPOINT ==================

router.post('/chain-of-thought', async (req: Request, res: Response) => {
  const { question } = req.body;
  
  try {
    const result = await unlimitedAI.chainOfThought(question);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================== MULTI-PERSPECTIVE ANALYSIS ENDPOINT ==================

router.post('/analyze', async (req: Request, res: Response) => {
  const { 
    topic, 
    perspectives = ['logical', 'creative', 'critical', 'practical'] 
  } = req.body;
  
  try {
    const result = await unlimitedAI.multiPerspectiveAnalysis(topic, perspectives);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================== USAGE STATS ENDPOINT ==================

router.get('/stats', (_req: Request, res: Response) => {
  const healthStatus = smartRouter.getAllHealthStatus();
  const availableProviders = smartRouter.getAvailableProviders();
  res.json({ 
    healthStatus, 
    availableProviders, 
    unlimitedThinking: true,
    noBoundaries: true,
    timestamp: new Date().toISOString() 
  });
});

export default router;
