import { ChatMessage, AIResponse, ChatProvider } from './types';
import { KEYS, UNIVERSAL_SYSTEM_PROMPT, ENGLISH_SYSTEM_PROMPT, ARABIC_SYSTEM_PROMPT } from './env';
import { memoryManager } from './memory';
import { webSearch } from './tools';
import { getHealthyProviders, selectBestProvider, recordSuccess, recordFailure, CHAT_PROVIDERS } from './providers';

// ===== RESPONSE CACHE =====
const responseCache = new Map<string, { response: AIResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(messages: ChatMessage[]): string {
  return JSON.stringify(messages.slice(-3));
}

function getCachedResponse(key: string): AIResponse | null {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.response;
  }
  responseCache.delete(key);
  return null;
}

function setCachedResponse(key: string, response: AIResponse) {
  responseCache.set(key, { response, timestamp: Date.now() });
}

// ===== MAIN CHAT FUNCTION =====
export async function chat(
  messages: ChatMessage[],
  options: {
    systemPrompt?: string;
    requireVision?: boolean;
    requireCode?: boolean; // Added hint for code tasks
    timeout?: number;
    forceProvider?: string; // Allow forcing a specific provider
  } = {}
): Promise<AIResponse> {
  const { systemPrompt, requireVision = false, requireCode = false, timeout = 30000, forceProvider } = options;
  
  // Check cache
  const cacheKey = getCacheKey(messages);
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    return { ...cached, provider: `${cached.provider} (cached)` };
  }
  
  // Get healthy providers
  let allHealthy = getHealthyProviders();
  
  // Filter by capabilities
  if (requireVision) {
    allHealthy = allHealthy.filter(p => p.supportsVision);
  }
  
  // Determine priority order
  let priorityNames: string[] = [];
  if (forceProvider) {
    priorityNames = [forceProvider];
  } else {
    priorityNames = selectBestProvider(requireVision, requireCode);
  }
  
  // Sort providers based on priority list
  const providers = priorityNames
    .map(name => allHealthy.find(p => p.name === name))
    .filter((p): p is ChatProvider => !!p);
    
  // Add any remaining healthy providers to the end as fallback
  const remaining = allHealthy.filter(p => !priorityNames.includes(p.name));
  providers.push(...remaining);
  
  if (providers.length === 0) {
    throw new Error('لا يوجد مزودين متاحين حالياً. جرب تاني بعد شوية. (No available providers)');
  }
  
  const errors: string[] = [];
  const thinkingSteps: string[] = [];
  
  for (const provider of providers) {
    thinkingSteps.push(`جاري المحاولة مع ${provider.name} (${provider.model})...`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: provider.getHeaders(),
        body: JSON.stringify(provider.formatBody(messages, systemPrompt)),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText.substring(0, 200)}`);
      }
      
      const data = await response.json();
      const content = provider.parseResponse(data);
      
      recordSuccess(provider.name);
      
      const result: AIResponse = {
        content,
        provider: provider.name,
        model: provider.model,
        thinkingSteps,
      };
      
      // Cache the response
      setCachedResponse(cacheKey, result);
      
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`❌ ${provider.name} failed:`, errorMsg);
      thinkingSteps.push(`❌ ${provider.name} فشل: ${errorMsg.substring(0, 50)}...`);
      errors.push(`${provider.name}: ${errorMsg}`);
      recordFailure(provider.name);
    }
  }
  
  throw new Error(`كل المزودين فشلوا. جرب تاني.\n${errors.join('\n')}`);
}

// ===== VISION / IMAGE ANALYSIS =====
export async function analyzeImage(imageBase64: string, question?: string): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: question || 'إيه اللي في الصورة دي؟ اوصفها بالتفصيل.',
      image: imageBase64,
    },
  ];
  
  const response = await chat(messages, { requireVision: true });
  return response.content;
}

// ===== SMART CHAT (with memory + optional search) =====
export async function smartChat(
  messages: ChatMessage[],
  options: {
    enableWebSearch?: boolean;
    enableMemory?: boolean;
    language?: 'ar' | 'en';
  } = {}
): Promise<AIResponse> {
  const { enableWebSearch = false, enableMemory = true, language = 'ar' } = options;
  
  const enrichedMessages = [...messages];
  const lastUserMsg = messages.filter(m => m.role === 'user').pop();
  
  // Add memory context
  if (enableMemory) {
    const memoryContext = memoryManager.getMemoryContext();
    if (memoryContext && enrichedMessages.length > 0) {
      enrichedMessages[0] = {
        ...enrichedMessages[0],
        content: enrichedMessages[0].content + memoryContext,
      };
    }
  }
  
  // Add web search if enabled and looks like a search query
  if (enableWebSearch && lastUserMsg) {
    const searchIndicators = ['ابحث', 'دور', 'search', 'find', 'إيه', 'مين', 'فين', 'إمتى', 'ليه', 'كيف', 'ازاي'];
    const needsSearch = searchIndicators.some(i => lastUserMsg.content.toLowerCase().includes(i.toLowerCase()));
    
    if (needsSearch) {
      try {
        const results = await webSearch(lastUserMsg.content);
        if (results.length > 0) {
          const searchContext = `\n\n[نتائج البحث]:\n${results.slice(0, 3).map(r => `- ${r.title}: ${r.snippet}`).join('\n')}`;
          enrichedMessages[enrichedMessages.length - 1] = {
            ...enrichedMessages[enrichedMessages.length - 1],
            content: enrichedMessages[enrichedMessages.length - 1].content + searchContext,
          };
        }
      } catch (e) {
        console.warn('Web search failed, continuing without it');
      }
    }
  }
  
  // Select system prompt based on language
  const systemPrompt = language === 'en' ? ENGLISH_SYSTEM_PROMPT : ARABIC_SYSTEM_PROMPT;
  
  const response = await chat(enrichedMessages, { systemPrompt });
  
  // Extract memories from conversation
  if (enableMemory && lastUserMsg) {
    memoryManager.extractMemoriesFromChat(lastUserMsg.content);
  }
  
  return response;
}

// ===== STREAM CHAT - Client-side implementation =====
export async function streamChat(
  message: string,
  conversationId: string,
  callbacks: {
    onToken?: (token: string) => void;
    onComplete?: (fullText: string) => void;
    onError?: (error: Error) => void;
  },
  options?: {
    history?: ChatMessage[];
    systemPrompt?: string;
  }
): Promise<void> {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('sb-access-token');

    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        message,
        conversationHistory: options?.history || [],
        systemPrompt: options?.systemPrompt,
        apiKeys: KEYS, // Pass client-side keys to server
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server error (${response.status}): ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || ''; // Keep the last incomplete part

      for (const part of parts) {
        if (part.startsWith('data: ')) {
          const dataStr = part.slice(6).trim();
          if (dataStr === '[DONE]') {
            callbacks.onComplete?.(fullText);
            return;
          }
          
          try {
            const event = JSON.parse(dataStr);
            if (event.type === 'token' && event.content) {
              fullText += event.content;
              callbacks.onToken?.(event.content);
            } else if (event.type === 'error') {
              const errMsg = event.message || 'Stream error';
              console.error('Server reported error:', errMsg);
              callbacks.onError?.(new Error(errMsg));
              return;
            }
          } catch (e) {
            // Only ignore JSON parse errors, not our explicit error handling if we were to throw
            // But since we handle error above by return, this catch is mostly for JSON.parse
          }
        }
      }
    }
    
    // Fallback if [DONE] is missed but stream ends
    if (fullText) {
      callbacks.onComplete?.(fullText);
    }

  } catch (error: any) {
    console.error('streamChat error:', error);
    callbacks.onError?.(error);
  }
}
