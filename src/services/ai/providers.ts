import { KEYS, UNIVERSAL_SYSTEM_PROMPT } from './env';
import { ChatMessage, ChatProvider } from './types';

// ===== PROVIDER HEALTH TRACKING =====
const providerHealth = new Map<string, { failures: number; lastFailure: number }>();

export const CHAT_PROVIDERS: ChatProvider[] = [
  {
    name: 'gemini',
    model: 'gemini-1.5-flash',
    endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${KEYS.gemini}`,
    supportsVision: true,
    getHeaders: () => ({
      'Content-Type': 'application/json',
    }),
    formatBody: (messages: ChatMessage[], systemPrompt?: string) => {
      const contents: any[] = [];
      const systemInstruction = systemPrompt || UNIVERSAL_SYSTEM_PROMPT;
      
      for (const m of messages) {
        if (m.role === 'system') continue;
        
        const parts: any[] = [];
        
        if (m.content) {
          parts.push({ text: m.content });
        }
        
        if (m.image) {
          parts.push({
            inline_data: {
              mime_type: 'image/jpeg',
              data: m.image.replace(/^data:image\/\w+;base64,/, ''),
            },
          });
        }
        
        contents.push({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts,
        });
      }
      
      return {
        contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      };
    },
    parseResponse: (data: any) => {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini');
      return text;
    },
  },
  {
    name: 'groq',
    model: 'llama-3.3-70b-versatile',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    supportsVision: false,
    getHeaders: () => ({
      'Authorization': `Bearer ${KEYS.groq}`,
      'Content-Type': 'application/json',
    }),
    formatBody: (messages: ChatMessage[], systemPrompt?: string) => {
      const formattedMessages = [];
      
      formattedMessages.push({
        role: 'system',
        content: systemPrompt || UNIVERSAL_SYSTEM_PROMPT,
      });
      
      for (const m of messages) {
        if (m.role !== 'system') {
          formattedMessages.push({
            role: m.role,
            content: m.content,
          });
        }
      }
      
      return {
        model: 'llama-3.3-70b-versatile',
        messages: formattedMessages,
        max_tokens: 4096,
        temperature: 0.7,
      };
    },
    parseResponse: (data: any) => data.choices[0].message.content,
  },
  {
    name: 'openrouter',
    model: 'meta-llama/llama-3.2-90b-vision-instruct:free',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    supportsVision: true,
    getHeaders: () => ({
      'Authorization': `Bearer ${KEYS.openrouter}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Try-It! AI',
    }),
    formatBody: (messages: ChatMessage[], systemPrompt?: string) => {
      const formattedMessages = [];
      
      formattedMessages.push({
        role: 'system',
        content: systemPrompt || UNIVERSAL_SYSTEM_PROMPT,
      });
      
      for (const m of messages) {
        if (m.role !== 'system') {
          if (m.image) {
            formattedMessages.push({
              role: m.role,
              content: [
                { type: 'text', text: m.content },
                { type: 'image_url', image_url: { url: m.image } },
              ],
            });
          } else {
            formattedMessages.push({
              role: m.role,
              content: m.content,
            });
          }
        }
      }
      
      return {
        model: 'meta-llama/llama-3.2-90b-vision-instruct:free',
        messages: formattedMessages,
        max_tokens: 4096,
        temperature: 0.7,
      };
    },
    parseResponse: (data: any) => data.choices[0].message.content,
  },
  {
    name: 'mistral',
    model: 'mistral-large-latest',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    supportsVision: false,
    getHeaders: () => ({
      'Authorization': `Bearer ${KEYS.mistral}`,
      'Content-Type': 'application/json',
    }),
    formatBody: (messages: ChatMessage[], systemPrompt?: string) => {
      const formattedMessages = [];
      
      formattedMessages.push({
        role: 'system',
        content: systemPrompt || UNIVERSAL_SYSTEM_PROMPT,
      });
      
      for (const m of messages) {
        if (m.role !== 'system') {
          formattedMessages.push({
            role: m.role,
            content: m.content,
          });
        }
      }
      
      return {
        model: 'mistral-large-latest',
        messages: formattedMessages,
        max_tokens: 4096,
      };
    },
    parseResponse: (data: any) => data.choices[0].message.content,
  },
  {
    name: 'cohere',
    model: 'command-r-08-2024',
    endpoint: 'https://api.cohere.ai/v1/chat',
    supportsVision: false,
    getHeaders: () => ({
      'Authorization': `Bearer ${KEYS.cohere}`,
      'Content-Type': 'application/json',
    }),
    formatBody: (messages: ChatMessage[], systemPrompt?: string) => {
      const lastMsg = messages[messages.length - 1];
      const history = messages.slice(0, -1)
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
          message: m.content,
        }));
      
      return {
        message: lastMsg.content,
        chat_history: history,
        model: 'command-r-08-2024',
        preamble: systemPrompt || UNIVERSAL_SYSTEM_PROMPT,
      };
    },
    parseResponse: (data: any) => data.text,
  },
  {
    name: 'anthropic',
    model: 'claude-3-5-sonnet-20240620',
    endpoint: 'https://api.anthropic.com/v1/messages',
    supportsVision: true,
    getHeaders: () => ({
      'x-api-key': KEYS.anthropic,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true', // Allow client-side usage
    }),
    formatBody: (messages: ChatMessage[], systemPrompt?: string) => {
      const formattedMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => {
          if (m.image) {
            return {
              role: m.role,
              content: [
                { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: m.image.replace(/^data:image\/\w+;base64,/, '') } },
                { type: 'text', text: m.content || 'Analyze this image' }
              ]
            };
          }
          return { role: m.role, content: m.content };
        });

      return {
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 4096,
        messages: formattedMessages,
        system: systemPrompt || UNIVERSAL_SYSTEM_PROMPT,
      };
    },
    parseResponse: (data: any) => data.content[0].text,
  },
  {
    name: 'openai',
    model: 'gpt-4o',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    supportsVision: true,
    getHeaders: () => ({
      'Authorization': `Bearer ${KEYS.openai}`,
      'Content-Type': 'application/json',
    }),
    formatBody: (messages: ChatMessage[], systemPrompt?: string) => {
      const formattedMessages = [];
      
      formattedMessages.push({
        role: 'system',
        content: systemPrompt || UNIVERSAL_SYSTEM_PROMPT,
      });
      
      for (const m of messages) {
        if (m.role !== 'system') {
          if (m.image) {
            formattedMessages.push({
              role: m.role,
              content: [
                { type: 'text', text: m.content },
                { type: 'image_url', image_url: { url: m.image } },
              ],
            });
          } else {
            formattedMessages.push({
              role: m.role,
              content: m.content,
            });
          }
        }
      }
      
      return {
        model: 'gpt-4o',
        messages: formattedMessages,
        max_tokens: 4096,
        temperature: 0.7,
      };
    },
    parseResponse: (data: any) => data.choices[0].message.content,
  },
];

export function getHealthyProviders(): ChatProvider[] {
  const now = Date.now();
  const COOLDOWN = 60000; // 1 minute cooldown after 3 failures
  
  const healthy = CHAT_PROVIDERS.filter(p => {
    const health = providerHealth.get(p.name);
    if (!health) return true;
    if (health.failures < 3) return true;
    if (now - health.lastFailure > COOLDOWN) {
      providerHealth.delete(p.name);
      return true;
    }
    return false;
  });

  // If all providers are down, reset health for all to try again immediately
  if (healthy.length === 0) {
    console.warn('All providers marked as unhealthy. Resetting health status to force retry.');
    providerHealth.clear();
    return CHAT_PROVIDERS;
  }

  return healthy;
}

export function recordFailure(providerName: string) {
  const health = providerHealth.get(providerName) || { failures: 0, lastFailure: 0 };
  health.failures++;
  health.lastFailure = Date.now();
  providerHealth.set(providerName, health);
}

export function recordSuccess(providerName: string) {
  providerHealth.delete(providerName);
}

export function selectBestProvider(requireVision: boolean, requireCode: boolean): string[] {
  // Priority List for "Best & Cheapest"
  // 1. Groq (Llama 3 70B) - Extremely fast, often free/cheap, great reasoning/code.
  // 2. Gemini (1.5 Pro) - High context, multimodal, free tier available.
  // 3. OpenRouter (Free models) - Backup.
  // 4. Claude 3.5 Sonnet / GPT-4o - Premium backup for complex tasks.
  
  if (requireVision) {
    return ['gemini', 'openrouter', 'anthropic', 'openai'];
  }
  
  if (requireCode) {
    return ['groq', 'anthropic', 'openai', 'gemini', 'mistral', 'openrouter', 'cohere'];
  }
  
  // General Chat
  return ['groq', 'gemini', 'openrouter', 'anthropic', 'openai', 'mistral', 'cohere'];
}

export function getMatrixStatus(): {
  providers: { name: string; status: 'healthy' | 'degraded' | 'down' }[];
  activeKeys: Record<string, boolean>;
} {
  const status: Record<string, boolean> = {};
  for (const key in KEYS) {
    status[key] = !!KEYS[key as keyof typeof KEYS];
  }
  
  const providers = [
    { name: 'Gemini', key: 'gemini' },
    { name: 'Groq', key: 'groq' },
    { name: 'OpenRouter', key: 'openrouter' },
    { name: 'Mistral', key: 'mistral' },
    { name: 'Cohere', key: 'cohere' },
  ].map(p => ({
    name: p.name,
    status: status[p.key] ? ('healthy' as const) : ('down' as const),
  }));
  
  return { providers, activeKeys: status };
}
