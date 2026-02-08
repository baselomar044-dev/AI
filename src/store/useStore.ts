// ============================================
// 🗃️ ZUSTAND STORE - Global State Management
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { toast } from 'react-hot-toast';

// ================== FALLBACK STORAGE (works when localStorage disabled) ==================

const memoryStorage: Record<string, string> = {};

const createFallbackStorage = (): StateStorage => {
  return {
    getItem: (name: string): string | null => {
      try {
        return localStorage.getItem(name);
      } catch {
        try {
          return sessionStorage.getItem(name);
        } catch {
          return memoryStorage[name] || null;
        }
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        localStorage.setItem(name, value);
      } catch {
        try {
          sessionStorage.setItem(name, value);
        } catch {
          memoryStorage[name] = value;
        }
      }
    },
    removeItem: (name: string): void => {
      try {
        localStorage.removeItem(name);
      } catch {
        try {
          sessionStorage.removeItem(name);
        } catch {
          delete memoryStorage[name];
        }
      }
    },
  };
};

const fallbackStorage = createFallbackStorage();

// ================== TYPES ==================

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  avatarUrl?: string;
  isDemo?: boolean; // Demo mode flag
}

interface Conversation {
  id: string;
  title: string;
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  isArchived: boolean;
}

interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  fullContent?: string; // Hidden full content (e.g. huge file dumps) for AI context
  metadata?: {
    model?: string;
    provider?: string;
    tokens?: number;
    latencyMs?: number;
  };
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
  }>;
  createdAt: Date;
}

interface VoiceConfig {
  inputDevice?: string;
  outputDevice?: string;
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
  language: 'ar' | 'en' | 'auto';
}

interface AIConfig {
  thinkingDepth: 'fast' | 'balanced' | 'deep' | 'unlimited';
  creativityLevel: number;
  temperature: number;
  maxTokens: number;
  showThinking: boolean;
}

// AI Memory - What the AI remembers about the user
interface AIMemory {
  userName?: string;
  preferences: Record<string, string>;      // User preferences AI learned
  facts: string[];                          // Facts about user
  importantDates: Record<string, string>;   // Birthdays, deadlines, etc.
  lastTopics: string[];                     // Recent conversation topics
  customInstructions?: string;              // User's custom instructions
  autoLearn: boolean;                       // Auto-learn from conversations
}

interface SpecialSettings {
  incognitoMode: boolean;
  matrixMode: boolean;
  voiceCloneEnabled: boolean;
  autoForget: boolean;
  
  // New Interactive Intelligence Features
  devilAdvocate: boolean;
  mirrorMode: boolean;
  eli5Mode: boolean;
  mechanicalSounds: boolean;
  brainDump: boolean;
  smartPomodoro: boolean;
  eyeTracking: boolean; // Experimental
  cinematicFocus: boolean;
}

interface APIKeys {
  groq: boolean;
  gemini: boolean;
  openRouter: boolean;
  mistral: boolean;
  cohere: boolean;
  replicate: boolean;
  elevenLabs: boolean;
  e2b: boolean;
  firecrawl: boolean;
  tavily: boolean;
  resend: boolean;
  github: boolean;
  supabase: boolean;
  vercel: boolean;
  netlify: boolean;
  twilio: boolean;
  railway: boolean;
}

interface Store {
  // Auth
  user: User | null;
  isLoading: boolean;
  
  // API Keys Status
  apiKeys: APIKeys;

  // UI
  theme: string;
  language: 'ar' | 'en';
  sidebarCollapsed: boolean;
  conversationSidebarOpen: boolean;  // NEW: Sliding conversation sidebar
  
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Map<string, Message[]>;
  
  // Voice
  voiceConfig: VoiceConfig;
  isInVoiceCall: boolean;
  
  // AI Settings
  aiConfig: AIConfig;
  specialSettings: SpecialSettings;
  
  // AI Memory - persisted across sessions
  aiMemory: AIMemory;
  
  // Provider stats
  providerStats: {
    groq: { used: number; limit: number };
    gemini: { used: number; limit: number };
    openrouter: { used: number; limit: number };
  };
  
  // Live Preview
  previewContent: string | null;

  // Actions
  setPreviewContent: (content: string | null) => void;
  
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithProvider: (provider: 'google' | 'github') => Promise<void>;
  loginAsDemo: () => void;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  
  setTheme: (theme: string) => void;
  setLanguage: (language: 'ar' | 'en') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setConversationSidebarOpen: (open: boolean) => void;  // NEW
  
  createConversation: (title?: string, agentId?: string) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'createdAt'> & { id?: string }) => Message;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  getMessages: (conversationId: string) => Message[];
  clearMessages: (conversationId: string) => void;
  
  setVoiceConfig: (config: Partial<VoiceConfig>) => void;
  setIsInVoiceCall: (inCall: boolean) => void;
  
  setAIConfig: (config: Partial<AIConfig>) => void;
  setSpecialSettings: (settings: Partial<SpecialSettings>) => void;
  setUser: (user: User | null) => void;
  
  // AI Memory actions
  updateAIMemory: (updates: Partial<AIMemory>) => void;
  addMemoryFact: (fact: string) => void;
  addMemoryPreference: (key: string, value: string) => void;
  clearAIMemory: () => void;
  getMemoryContext: () => string;  // Returns memory as context for AI
  
  updateProviderStats: () => Promise<void>;
}

// ================== DEFAULT VALUES ==================

const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  voice: 'en-US-Neural2-A',
  speed: 1.0,
  pitch: 1.0,
  volume: 1.0,
  language: 'auto',
};

const DEFAULT_AI_CONFIG: AIConfig = {
  thinkingDepth: 'deep',
  creativityLevel: 0.8,
  temperature: 0.7,
  maxTokens: 4096,
  showThinking: false,
};

const DEFAULT_AI_MEMORY: AIMemory = {
  preferences: {},
  facts: [],
  importantDates: {},
  lastTopics: [],
  autoLearn: true,  // AI auto-learns by default
};

// ================== HELPER: Check Supabase ==================

const getSupabase = async () => {
  try {
    const { supabase } = await import('../lib/supabase');
    // Check if supabase is properly configured
    if (!supabase || !supabase.auth) {
      return null;
    }
    return supabase;
  } catch {
    return null;
  }
};

// ================== STORE ==================

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // Initial state - NOT loading by default for demo mode
      user: null,
      isLoading: false, // Changed to false!
      
      apiKeys: {
        groq: !!import.meta.env.VITE_GROQ_API_KEY,
        gemini: !!import.meta.env.VITE_GEMINI_API_KEY,
        openRouter: !!import.meta.env.VITE_OPENROUTER_API_KEY,
        mistral: !!import.meta.env.VITE_MISTRAL_API_KEY,
        cohere: !!import.meta.env.VITE_COHERE_API_KEY,
        replicate: !!import.meta.env.VITE_REPLICATE_API_KEY,
        elevenLabs: !!import.meta.env.VITE_ELEVENLABS_API_KEY,
        e2b: !!import.meta.env.VITE_E2B_API_KEY,
        firecrawl: !!import.meta.env.VITE_FIRECRAWL_API_KEY,
        tavily: !!import.meta.env.VITE_TAVILY_API_KEY,
        resend: !!import.meta.env.VITE_RESEND_API_KEY,
        github: !!import.meta.env.VITE_GITHUB_TOKEN,
        supabase: !!import.meta.env.VITE_SUPABASE_URL,
        vercel: !!import.meta.env.VITE_VERCEL_TOKEN,
        netlify: !!import.meta.env.VITE_NETLIFY_TOKEN,
        twilio: !!import.meta.env.VITE_TWILIO_ACCOUNT_SID,
        railway: !!import.meta.env.VITE_RAILWAY_TOKEN,
      },

      theme: 'gemini',  // Three themes: 'light' | 'pink' | 'gemini'
      language: 'en',
      sidebarCollapsed: false,
      conversationSidebarOpen: false,  // NEW
      conversations: [],
      activeConversationId: null,
      messages: new Map(),
      voiceConfig: DEFAULT_VOICE_CONFIG,
      isInVoiceCall: false,
      aiConfig: DEFAULT_AI_CONFIG,
      specialSettings: {
        incognitoMode: false,
        matrixMode: false,
        voiceCloneEnabled: false,
        autoForget: false,
        devilAdvocate: false,
        mirrorMode: false,
        eli5Mode: false,
        mechanicalSounds: false,
        brainDump: false,
        smartPomodoro: false,
        eyeTracking: false,
        cinematicFocus: false,
      },
      aiMemory: DEFAULT_AI_MEMORY,  // NEW
      providerStats: {
        groq: { used: 0, limit: 14400 },
        gemini: { used: 0, limit: 1500 },
        openrouter: { used: 0, limit: 200 },
      },
      
      previewContent: null,

      // Actions
      initialize: async () => {
        set({ isLoading: true });
        try {
          const supabase = await getSupabase();
          if (!supabase) {
            console.log('Supabase not configured, running in demo mode');
            set({ isLoading: false });
            return;
          }

          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();
            
            set({
              user: {
                id: user.id,
                email: user.email!,
                name: profile?.name,
                avatarUrl: profile?.avatar_url,
              },
              theme: profile?.theme || 'pink',
              language: profile?.language || 'en',
            });
            
            // Load conversations
            const { data: conversations } = await supabase
              .from('conversations')
              .select('*')
              .eq('user_id', user.id)
              .order('updated_at', { ascending: false });
            
            if (conversations) {
              set({
                conversations: conversations.map(c => ({
                  id: c.id,
                  title: c.title || 'New conversation',
                  agentId: c.agent_id,
                  createdAt: new Date(c.created_at),
                  updatedAt: new Date(c.updated_at),
                  isPinned: c.is_pinned,
                  isArchived: c.is_archived,
                })),
              });
            }
          }
        } catch (error: any) {
          // Ignore AbortError which happens frequently in dev/strict mode
          if (error.name === 'AbortError' || error.message?.includes('aborted')) {
            return;
          }
          console.error('Init error:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      login: async (email, password) => {
        const supabase = await getSupabase();
        if (!supabase) {
          // Demo mode fallback
          get().loginAsDemo();
          return;
        }
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) {
            // Check for network errors or invalid configuration
            if (error.message?.includes('Network') || error.message?.includes('fetch') || error.status === 500) {
              console.error('Supabase unreachable:', error);
              toast.error('Server unreachable. Entering Demo Mode.');
              get().loginAsDemo();
              return;
            }
            throw error;
          }
          await get().initialize();
        } catch (err: any) {
          // Double check if the thrown error is a network error
          if (err.message?.includes('Network') || err.message?.includes('fetch')) {
             console.error('Supabase unreachable (catch):', err);
             toast.error('Server unreachable. Entering Demo Mode.');
             get().loginAsDemo();
             return;
          }
          throw err;
        }
      },
      
      loginWithProvider: async (provider) => {
        const supabase = await getSupabase();
        if (!supabase) {
          get().loginAsDemo();
          return;
        }
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          if (error) throw error;
        } catch (err: any) {
           if (err.message?.includes('Network') || err.message?.includes('fetch')) {
             toast.error('Server unreachable. Entering Demo Mode.');
             get().loginAsDemo();
             return;
          }
          throw err;
        }
      },
      
      // NEW: Demo mode login
      loginAsDemo: () => {
        const demoUser: User = {
          id: 'founder-user',
          email: 'founder@ai-assistant.app',
          name: 'Founder',
          isDemo: true,
        };
        
        // Create a welcome conversation
        const welcomeConversation: Conversation = {
          id: 'welcome-' + Date.now(),
          title: 'Welcome Back, Founder',
          agentId: 'default',
          createdAt: new Date(),
          updatedAt: new Date(),
          isPinned: true,
          isArchived: false,
        };
        
        set({
          user: demoUser,
          conversations: [welcomeConversation],
          activeConversationId: welcomeConversation.id,
          isLoading: false,
        });
      },
      
      register: async (email, password, name) => {
        const supabase = await getSupabase();
        if (!supabase) {
          get().loginAsDemo();
          return;
        }
        try {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name },
            },
          });
          if (error) {
            // Check for network errors
            if (error.message?.includes('Network') || error.message?.includes('fetch') || error.status === 500) {
              console.error('Supabase unreachable:', error);
              toast.error('Server unreachable. Entering Demo Mode.');
              get().loginAsDemo();
              return;
            }
            throw error;
          }
          await get().initialize();
        } catch (err: any) {
           if (err.message?.includes('Network') || err.message?.includes('fetch')) {
             console.error('Supabase unreachable (catch):', err);
             toast.error('Server unreachable. Entering Demo Mode.');
             get().loginAsDemo();
             return;
          }
          throw err;
        }
      },
      
      logout: async () => {
        try {
          const supabase = await getSupabase();
          if (supabase) {
            await supabase.auth.signOut();
          }
        } catch (e) {
          // Ignore errors
        }
        set({
          user: null,
          conversations: [],
          activeConversationId: null,
          messages: new Map(),
        });
      },
      
      setTheme: (theme) => {
        set({ theme });
        // Only sync to Supabase if not in demo mode
        const user = get().user;
        if (user && !user.isDemo) {
          getSupabase().then(supabase => {
            if (supabase) {
              supabase.from('users').update({ theme }).eq('id', user.id);
            }
          });
        }
      },
      
      setLanguage: (language) => {
        set({ language });
        const user = get().user;
        if (user && !user.isDemo) {
          getSupabase().then(supabase => {
            if (supabase) {
              supabase.from('users').update({ language }).eq('id', user.id);
            }
          });
        }
      },
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setConversationSidebarOpen: (open) => set({ conversationSidebarOpen: open }),
      
      createConversation: async (title, agentId = 'default') => {
        const user = get().user;
        if (!user) throw new Error('Not authenticated');
        
        const conversation: Conversation = {
          id: crypto.randomUUID(),
          title: title || 'محادثة جديدة',
          agentId: agentId,
          createdAt: new Date(),
          updatedAt: new Date(),
          isPinned: false,
          isArchived: false,
        };
        
        // Save to Supabase if not demo
        if (!user.isDemo) {
          try {
            const supabase = await getSupabase();
            if (supabase) {
              const { data, error } = await supabase
                .from('conversations')
                .insert({
                  id: conversation.id,
                  user_id: user.id,
                  title: conversation.title,
                  agent_id: agentId,
                })
                .select()
                .single();
              
              if (!error && data) {
                conversation.id = data.id;
              }
            }
          } catch (e) {
            // Continue with local conversation
          }
        }
        
        set({
          conversations: [conversation, ...get().conversations],
          activeConversationId: conversation.id,
        });
        
        return conversation;
      },
      
      deleteConversation: async (id) => {
        const user = get().user;
        if (user && !user.isDemo) {
          try {
            const supabase = await getSupabase();
            if (supabase) {
              await supabase.from('conversations').delete().eq('id', id);
            }
          } catch (e) {
            // Continue
          }
        }
        
        const messages = new Map(get().messages);
        messages.delete(id);
        
        set({
          conversations: get().conversations.filter(c => c.id !== id),
          messages,
          activeConversationId: get().activeConversationId === id ? null : get().activeConversationId,
        });
      },
      
      setActiveConversation: (id) => set({ activeConversationId: id }),
      
      updateConversation: async (id, updates) => {
        const user = get().user;
        if (user && !user.isDemo) {
          try {
            const supabase = await getSupabase();
            if (supabase) {
              await supabase.from('conversations').update({
                title: updates.title,
                is_pinned: updates.isPinned,
                is_archived: updates.isArchived,
              }).eq('id', id);
            }
          } catch (e) {
            // Continue
          }
        }
        
        set({
          conversations: get().conversations.map(c =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
          ),
        });
      },
      
      addMessage: (conversationId, message) => {
        const newMessage: Message = {
          ...message,
          id: message.id || crypto.randomUUID(),
          createdAt: new Date(),
        };
        
        const messages = new Map(get().messages);
        const existing = messages.get(conversationId) || [];
        messages.set(conversationId, [...existing, newMessage]);
        
        set({ messages });
        
        // Save to database if not demo
        const user = get().user;
        if (user && !user.isDemo) {
          getSupabase().then(supabase => {
            if (supabase) {
              supabase.from('messages').insert({
                id: newMessage.id,
                conversation_id: conversationId,
                role: newMessage.role,
                content: newMessage.content,
                // We typically don't save fullContent to DB to save space, or we could if we want persistence
                // For now let's skip saving fullContent to Supabase to avoid payload limits
                metadata: newMessage.metadata,
                attachments: newMessage.attachments,
              });
            }
          });
        }
        
        return newMessage;
      },
      
      updateMessage: (conversationId, messageId, updates) => {
        const messages = new Map(get().messages);
        const existing = messages.get(conversationId) || [];
        
        messages.set(conversationId, existing.map(m =>
          m.id === messageId ? { ...m, ...updates } : m
        ));
        
        set({ messages });
      },
      
      getMessages: (conversationId) => {
        return get().messages.get(conversationId) || [];
      },

      clearMessages: (conversationId) => {
        const messages = new Map(get().messages);
        messages.set(conversationId, []);
        set({ messages });
        
        const user = get().user;
        if (user && !user.isDemo) {
          getSupabase().then(supabase => {
            if (supabase) {
              supabase.from('messages').delete().eq('conversation_id', conversationId);
            }
          });
        }
      },
      
      setVoiceConfig: (config) => {
        set({ voiceConfig: { ...get().voiceConfig, ...config } });
      },
      
      setIsInVoiceCall: (inCall) => set({ isInVoiceCall: inCall }),
      
      setAIConfig: (config) => {
        set({ aiConfig: { ...get().aiConfig, ...config } });
      },
      
      setSpecialSettings: (settings) => {
        set({ specialSettings: { ...get().specialSettings, ...settings } });
      },

      setPreviewContent: (content) => set({ previewContent: content }),

      setUser: (user) => set({ user }),
      
      // ========== AI MEMORY ACTIONS ==========
      
      updateAIMemory: (updates) => {
        set({ aiMemory: { ...get().aiMemory, ...updates } });
      },
      
      addMemoryFact: (fact) => {
        const memory = get().aiMemory;
        // Don't add duplicates
        if (!memory.facts.includes(fact)) {
          set({ 
            aiMemory: { 
              ...memory, 
              facts: [...memory.facts.slice(-49), fact]  // Keep last 50 facts
            } 
          });
        }
      },
      
      addMemoryPreference: (key, value) => {
        const memory = get().aiMemory;
        set({ 
          aiMemory: { 
            ...memory, 
            preferences: { ...memory.preferences, [key]: value }
          } 
        });
      },
      
      clearAIMemory: () => {
        set({ aiMemory: DEFAULT_AI_MEMORY });
      },
      
      // Generate context string for AI from memory
      getMemoryContext: () => {
        const memory = get().aiMemory;
        const parts: string[] = [];
        
        if (memory.userName) {
          parts.push(`User's name: ${memory.userName}`);
        }
        
        if (memory.customInstructions) {
          parts.push(`Custom instructions: ${memory.customInstructions}`);
        }
        
        if (Object.keys(memory.preferences).length > 0) {
          parts.push(`Preferences: ${Object.entries(memory.preferences).map(([k,v]) => `${k}: ${v}`).join(', ')}`);
        }
        
        if (memory.facts.length > 0) {
          parts.push(`Known facts about user: ${memory.facts.slice(-10).join('; ')}`);
        }
        
        if (Object.keys(memory.importantDates).length > 0) {
          parts.push(`Important dates: ${Object.entries(memory.importantDates).map(([k,v]) => `${k}: ${v}`).join(', ')}`);
        }
        
        if (memory.lastTopics.length > 0) {
          parts.push(`Recent topics: ${memory.lastTopics.slice(-5).join(', ')}`);
        }
        
        return parts.length > 0 ? `[MEMORY]\n${parts.join('\n')}\n[/MEMORY]\n\n` : '';
      },
      
      updateProviderStats: async () => {
        try {
          const response = await fetch('/api/chat/stats');
          const stats = await response.json();
          set({ providerStats: stats });
        } catch (error) {
          console.error('Failed to update provider stats:', error);
        }
      },
    }),
    {
      name: 'ai-assistant-storage',
      storage: createJSONStorage(() => fallbackStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
        voiceConfig: state.voiceConfig,
        aiConfig: state.aiConfig,
        specialSettings: state.specialSettings,
        aiMemory: state.aiMemory,  // Persist AI memory!
        // Also persist user and conversations for demo mode
        user: state.user,
        conversations: state.conversations,
      }),
    }
  )
);

export default useStore;
