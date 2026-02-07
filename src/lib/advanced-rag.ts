// ============================================
// 🧠 ADVANCED RAG - Memory & Personality System
// ============================================

import { supabase } from './supabase';

// ================== PERSONALITY SYSTEM ==================

export interface UserPersonality {
  userId: string;
  
  // Core traits (Big Five)
  openness: number;         // 0-1: curiosity, creativity
  conscientiousness: number; // 0-1: organization, reliability
  extraversion: number;      // 0-1: sociability, energy
  agreeableness: number;     // 0-1: cooperation, trust
  neuroticism: number;       // 0-1: emotional sensitivity
  
  // Communication style
  formalityLevel: number;    // 0-1: casual to formal
  detailPreference: number;  // 0-1: brief to detailed
  humorAppreciation: number; // 0-1: serious to playful
  technicalLevel: number;    // 0-1: simple to technical
  
  // Language preferences
  preferredLanguage: 'ar' | 'en' | 'auto';
  dialectPreference?: string; // e.g., 'gulf', 'egyptian', 'levantine'
  usesEmojis: boolean;
  
  // Interests & expertise
  topics: string[];
  expertise: Record<string, number>; // topic -> expertise level 0-1
  
  // Behavioral patterns
  activeHours: number[];     // Hours when user is most active
  averageMessageLength: number;
  questionFrequency: number; // How often they ask vs state
  
  // Emotional patterns
  currentMood: string;
  moodHistory: { mood: string; timestamp: Date }[];
  
  // Relationship with AI
  trustLevel: number;        // 0-1: how much they trust AI advice
  dependencyLevel: number;   // 0-1: how much they rely on AI
  satisfactionScore: number; // 0-1: overall satisfaction
  
  // Last updated
  updatedAt: Date;
  interactionCount: number;
}

// Default personality for new users
export const DEFAULT_PERSONALITY: Omit<UserPersonality, 'userId'> = {
  openness: 0.5,
  conscientiousness: 0.5,
  extraversion: 0.5,
  agreeableness: 0.5,
  neuroticism: 0.3,
  formalityLevel: 0.5,
  detailPreference: 0.5,
  humorAppreciation: 0.5,
  technicalLevel: 0.5,
  preferredLanguage: 'auto',
  usesEmojis: true,
  topics: [],
  expertise: {},
  activeHours: [],
  averageMessageLength: 100,
  questionFrequency: 0.5,
  currentMood: 'neutral',
  moodHistory: [],
  trustLevel: 0.5,
  dependencyLevel: 0.3,
  satisfactionScore: 0.7,
  updatedAt: new Date(),
  interactionCount: 0,
};

// ================== MEMORY TYPES ==================

export interface Memory {
  id: string;
  userId: string;
  type: MemoryType;
  content: string;
  embedding?: number[];
  metadata: Record<string, any>;
  importance: number;      // 0-1: how important this memory is
  accessCount: number;     // How many times it's been recalled
  lastAccessed?: Date;
  createdAt: Date;
  expiresAt?: Date;        // For temporary memories
}

export type MemoryType = 
  | 'fact'           // User stated facts
  | 'preference'     // User preferences
  | 'instruction'    // User instructions to remember
  | 'experience'     // Past interactions
  | 'relationship'   // Relationship info (people, places)
  | 'goal'           // User goals
  | 'emotion'        // Emotional states/reactions
  | 'skill'          // User skills/abilities
  | 'project'        // Ongoing projects
  | 'schedule';      // Schedule/time-related

// ================== MEMORY EXTRACTION ==================

const MEMORY_PATTERNS = {
  fact: [
    /(?:i am|i'm|my name is|i work|i live|i have|i own|i speak)\s+(.+)/i,
    /(?:أنا|اسمي|أعمل|أسكن|أملك|عندي)\s+(.+)/,
  ],
  preference: [
    /(?:i (?:like|love|prefer|enjoy|hate|dislike))\s+(.+)/i,
    /(?:my favorite|i always|i never)\s+(.+)/i,
    /(?:أحب|أفضل|أكره|المفضل لدي)\s+(.+)/,
  ],
  instruction: [
    /(?:always|never|remember to|don't forget|make sure)\s+(.+)/i,
    /(?:from now on|going forward)\s+(.+)/i,
    /(?:دائماً|أبداً|تذكر|لا تنسى)\s+(.+)/,
  ],
  goal: [
    /(?:i want to|i'm trying to|my goal is|i need to|i plan to)\s+(.+)/i,
    /(?:أريد|أحاول|هدفي|أخطط)\s+(.+)/,
  ],
  relationship: [
    /(?:my (?:wife|husband|friend|brother|sister|mother|father|boss|colleague))\s+(.+)/i,
    /(?:زوجتي|زوجي|صديقي|أخي|أختي|أمي|أبي)\s+(.+)/,
  ],
  emotion: [
    /(?:i feel|i'm feeling|i'm (?:happy|sad|anxious|excited|worried))\s*(.*)/i,
    /(?:أشعر|أنا سعيد|أنا حزين|أنا قلق)\s*(.*)/,
  ],
};

export function extractMemories(message: string, context: any): Partial<Memory>[] {
  const memories: Partial<Memory>[] = [];
  
  for (const [type, patterns] of Object.entries(MEMORY_PATTERNS)) {
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        memories.push({
          type: type as MemoryType,
          content: match[0],
          metadata: {
            extracted: match[1],
            source: 'user_message',
            context,
          },
          importance: calculateImportance(type as MemoryType, message),
        });
      }
    }
  }
  
  return memories;
}

function calculateImportance(type: MemoryType, content: string): number {
  const baseImportance: Record<MemoryType, number> = {
    instruction: 0.9,
    preference: 0.8,
    fact: 0.7,
    goal: 0.8,
    relationship: 0.7,
    emotion: 0.5,
    skill: 0.6,
    project: 0.7,
    schedule: 0.8,
    experience: 0.4,
  };
  
  let importance = baseImportance[type] || 0.5;
  
  // Boost for emphasis words
  if (/always|never|important|must|دائماً|أبداً|مهم/i.test(content)) {
    importance += 0.1;
  }
  
  return Math.min(importance, 1);
}

// ================== PERSONALITY ANALYSIS ==================

export async function analyzePersonality(
  userId: string,
  messages: { role: string; content: string }[]
): Promise<Partial<UserPersonality>> {
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length < 5) return {};
  
  const analysis: Partial<UserPersonality> = {};
  
  // Analyze message lengths
  const lengths = userMessages.map(m => m.content.length);
  analysis.averageMessageLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  
  // Analyze detail preference from length
  analysis.detailPreference = Math.min(analysis.averageMessageLength / 500, 1);
  
  // Analyze question frequency
  const questionCount = userMessages.filter(m => 
    m.content.includes('?') || m.content.includes('؟')
  ).length;
  analysis.questionFrequency = questionCount / userMessages.length;
  
  // Analyze emoji usage
  const emojiPattern = /[\u{1F300}-\u{1F9FF}]/gu;
  const emojiMessages = userMessages.filter(m => emojiPattern.test(m.content));
  analysis.usesEmojis = emojiMessages.length / userMessages.length > 0.1;
  
  // Analyze formality
  const informalPatterns = /\b(hey|hi|yo|lol|haha|gonna|wanna|gotta)\b/i;
  const informalCount = userMessages.filter(m => informalPatterns.test(m.content)).length;
  analysis.formalityLevel = 1 - (informalCount / userMessages.length);
  
  // Analyze language preference
  const arabicPattern = /[\u0600-\u06FF]/;
  const arabicMessages = userMessages.filter(m => arabicPattern.test(m.content));
  const arabicRatio = arabicMessages.length / userMessages.length;
  
  if (arabicRatio > 0.7) {
    analysis.preferredLanguage = 'ar';
  } else if (arabicRatio < 0.3) {
    analysis.preferredLanguage = 'en';
  } else {
    analysis.preferredLanguage = 'auto';
  }
  
  // Analyze technical level from vocabulary
  const technicalWords = /\b(api|function|algorithm|database|server|code|programming|debug)\b/i;
  const arabicTechnical = /برمجة|خوارزمية|قاعدة بيانات|خادم|كود/;
  const technicalCount = userMessages.filter(m => 
    technicalWords.test(m.content) || arabicTechnical.test(m.content)
  ).length;
  analysis.technicalLevel = Math.min(technicalCount / userMessages.length * 2, 1);
  
  // Extract topics from messages
  analysis.topics = extractTopics(userMessages.map(m => m.content).join(' '));
  
  return analysis;
}

function extractTopics(text: string): string[] {
  const topics = new Set<string>();
  
  const topicPatterns: Record<string, RegExp[]> = {
    'technology': [/\b(code|programming|software|app|computer|tech)\b/i],
    'business': [/\b(business|company|startup|revenue|marketing)\b/i],
    'health': [/\b(health|exercise|diet|medical|doctor)\b/i],
    'travel': [/\b(travel|trip|vacation|flight|hotel)\b/i],
    'education': [/\b(learn|study|school|university|course)\b/i],
    'finance': [/\b(money|invest|stock|crypto|budget)\b/i],
    'creative': [/\b(art|design|music|writing|creative)\b/i],
    'food': [/\b(food|recipe|cook|restaurant|meal)\b/i],
  };
  
  for (const [topic, patterns] of Object.entries(topicPatterns)) {
    if (patterns.some(p => p.test(text))) {
      topics.add(topic);
    }
  }
  
  return Array.from(topics);
}

// ================== MOOD DETECTION ==================

export function detectMood(message: string): string {
  const moodPatterns: Record<string, RegExp[]> = {
    'happy': [/\b(happy|excited|great|wonderful|amazing|love)\b/i, /😊|😃|🎉|❤️/],
    'sad': [/\b(sad|depressed|unhappy|miserable|crying)\b/i, /😢|😭|💔/],
    'anxious': [/\b(anxious|worried|nervous|stressed|afraid)\b/i, /😰|😟|😨/],
    'angry': [/\b(angry|frustrated|annoyed|mad|furious)\b/i, /😠|😡|🤬/],
    'confused': [/\b(confused|lost|unsure|don't understand)\b/i, /🤔|😕|❓/],
    'grateful': [/\b(thank|thanks|grateful|appreciate)\b/i, /🙏|💕/],
    'curious': [/\b(curious|wondering|interested|what if)\b/i, /🧐|💡/],
  };
  
  for (const [mood, patterns] of Object.entries(moodPatterns)) {
    if (patterns.some(p => p.test(message))) {
      return mood;
    }
  }
  
  return 'neutral';
}

// ================== ADAPTIVE RESPONSE SYSTEM ==================

export function generatePersonalityPrompt(personality: UserPersonality): string {
  const prompts: string[] = [];
  
  // Language style
  if (personality.preferredLanguage === 'ar') {
    prompts.push('Respond primarily in Arabic (العربية).');
    if (personality.dialectPreference) {
      prompts.push(`Use ${personality.dialectPreference} Arabic dialect when appropriate.`);
    }
  }
  
  // Formality
  if (personality.formalityLevel > 0.7) {
    prompts.push('Use formal, professional language.');
  } else if (personality.formalityLevel < 0.3) {
    prompts.push('Be casual and friendly in your responses.');
  }
  
  // Detail level
  if (personality.detailPreference > 0.7) {
    prompts.push('Provide comprehensive, detailed explanations.');
  } else if (personality.detailPreference < 0.3) {
    prompts.push('Keep responses brief and to the point.');
  }
  
  // Technical level
  if (personality.technicalLevel > 0.7) {
    prompts.push('Use technical terminology freely.');
  } else if (personality.technicalLevel < 0.3) {
    prompts.push('Avoid jargon, explain concepts simply.');
  }
  
  // Humor
  if (personality.humorAppreciation > 0.7) {
    prompts.push('Feel free to be playful and use humor.');
  }
  
  // Emojis
  if (personality.usesEmojis) {
    prompts.push('Use emojis naturally in responses.');
  } else {
    prompts.push('Avoid using emojis.');
  }
  
  // Current mood adaptation
  const moodAdaptations: Record<string, string> = {
    'happy': 'Match their positive energy.',
    'sad': 'Be gentle, supportive, and empathetic.',
    'anxious': 'Be calming and reassuring.',
    'angry': 'Stay calm, acknowledge their frustration.',
    'confused': 'Explain clearly step by step.',
    'grateful': 'Accept thanks graciously.',
  };
  
  if (moodAdaptations[personality.currentMood]) {
    prompts.push(moodAdaptations[personality.currentMood]);
  }
  
  // Topics of interest
  if (personality.topics.length > 0) {
    prompts.push(`User is interested in: ${personality.topics.join(', ')}.`);
  }
  
  return prompts.join('\n');
}

// ================== MEMORY MANAGER ==================

export class MemoryManager {
  private userId: string;
  private cache: Map<string, Memory> = new Map();
  
  constructor(userId: string) {
    this.userId = userId;
  }
  
  async saveMemory(memory: Omit<Memory, 'id' | 'userId' | 'createdAt' | 'accessCount'>): Promise<Memory> {
    const newMemory: Memory = {
      ...memory,
      id: crypto.randomUUID(),
      userId: this.userId,
      createdAt: new Date(),
      accessCount: 0,
    };
    
    // Generate embedding for semantic search
    const embedding = await this.generateEmbedding(memory.content);
    newMemory.embedding = embedding;
    
    // Save to Supabase
    const { error } = await supabase
      .from('memories')
      .insert({
        id: newMemory.id,
        user_id: newMemory.userId,
        type: newMemory.type,
        content: newMemory.content,
        embedding: newMemory.embedding,
        metadata: newMemory.metadata,
        importance: newMemory.importance,
        access_count: newMemory.accessCount,
        created_at: newMemory.createdAt.toISOString(),
        expires_at: newMemory.expiresAt?.toISOString(),
      });
    
    if (error) throw error;
    
    this.cache.set(newMemory.id, newMemory);
    return newMemory;
  }
  
  async searchMemories(query: string, limit = 10): Promise<Memory[]> {
    const embedding = await this.generateEmbedding(query);
    
    // Semantic search with pgvector
    const { data, error } = await supabase.rpc('search_memories', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
      user_id_filter: this.userId,
    });
    
    if (error) throw error;
    
    // Update access counts
    const memories = data.map((m: any) => ({
      id: m.id,
      userId: m.user_id,
      type: m.type,
      content: m.content,
      embedding: m.embedding,
      metadata: m.metadata,
      importance: m.importance,
      accessCount: m.access_count + 1,
      lastAccessed: new Date(),
      createdAt: new Date(m.created_at),
      expiresAt: m.expires_at ? new Date(m.expires_at) : undefined,
    }));
    
    return memories;
  }
  
  async getRelevantContext(message: string): Promise<string> {
    const memories = await this.searchMemories(message, 5);
    
    if (memories.length === 0) return '';
    
    const context = memories
      .sort((a, b) => b.importance - a.importance)
      .map(m => `[${m.type}] ${m.content}`)
      .join('\n');
    
    return `\n\n--- Relevant Memories ---\n${context}\n--- End Memories ---\n`;
  }
  
  private async generateEmbedding(text: string): Promise<number[]> {
    // Use a simple embedding approach or call Gemini's embedding API
    const response = await fetch('/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    
    const { embedding } = await response.json();
    return embedding;
  }
  
  async pruneOldMemories(): Promise<number> {
    // Delete expired memories
    const { count } = await supabase
      .from('memories')
      .delete()
      .eq('user_id', this.userId)
      .lt('expires_at', new Date().toISOString());
    
    // Delete low-importance, rarely accessed memories older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: pruned } = await supabase
      .from('memories')
      .delete()
      .eq('user_id', this.userId)
      .lt('importance', 0.3)
      .lt('access_count', 2)
      .lt('created_at', thirtyDaysAgo.toISOString());
    
    return (count || 0) + (pruned || 0);
  }
}

// ================== PERSONALITY MANAGER ==================

export class PersonalityManager {
  private userId: string;
  private personality: UserPersonality | null = null;
  
  constructor(userId: string) {
    this.userId = userId;
  }
  
  async load(): Promise<UserPersonality> {
    const { data, error } = await supabase
      .from('user_personalities')
      .select('*')
      .eq('user_id', this.userId)
      .single();
    
    if (error || !data) {
      // Create default personality
      this.personality = { ...DEFAULT_PERSONALITY, userId: this.userId } as UserPersonality;
      await this.save();
    } else {
      this.personality = {
        userId: data.user_id,
        openness: data.openness,
        conscientiousness: data.conscientiousness,
        extraversion: data.extraversion,
        agreeableness: data.agreeableness,
        neuroticism: data.neuroticism,
        formalityLevel: data.formality_level,
        detailPreference: data.detail_preference,
        humorAppreciation: data.humor_appreciation,
        technicalLevel: data.technical_level,
        preferredLanguage: data.preferred_language,
        dialectPreference: data.dialect_preference,
        usesEmojis: data.uses_emojis,
        topics: data.topics || [],
        expertise: data.expertise || {},
        activeHours: data.active_hours || [],
        averageMessageLength: data.average_message_length,
        questionFrequency: data.question_frequency,
        currentMood: data.current_mood,
        moodHistory: data.mood_history || [],
        trustLevel: data.trust_level,
        dependencyLevel: data.dependency_level,
        satisfactionScore: data.satisfaction_score,
        updatedAt: new Date(data.updated_at),
        interactionCount: data.interaction_count,
      };
    }
    
    return this.personality;
  }
  
  async update(updates: Partial<UserPersonality>): Promise<void> {
    if (!this.personality) await this.load();
    
    // Merge with smoothing (gradual changes)
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'number' && typeof (this.personality as any)[key] === 'number') {
        // Smooth numeric updates (70% old, 30% new)
        (this.personality as any)[key] = (this.personality as any)[key] * 0.7 + value * 0.3;
      } else {
        (this.personality as any)[key] = value;
      }
    }
    
    this.personality!.updatedAt = new Date();
    this.personality!.interactionCount++;
    
    await this.save();
  }
  
  private async save(): Promise<void> {
    if (!this.personality) return;
    
    await supabase
      .from('user_personalities')
      .upsert({
        user_id: this.personality.userId,
        openness: this.personality.openness,
        conscientiousness: this.personality.conscientiousness,
        extraversion: this.personality.extraversion,
        agreeableness: this.personality.agreeableness,
        neuroticism: this.personality.neuroticism,
        formality_level: this.personality.formalityLevel,
        detail_preference: this.personality.detailPreference,
        humor_appreciation: this.personality.humorAppreciation,
        technical_level: this.personality.technicalLevel,
        preferred_language: this.personality.preferredLanguage,
        dialect_preference: this.personality.dialectPreference,
        uses_emojis: this.personality.usesEmojis,
        topics: this.personality.topics,
        expertise: this.personality.expertise,
        active_hours: this.personality.activeHours,
        average_message_length: this.personality.averageMessageLength,
        question_frequency: this.personality.questionFrequency,
        current_mood: this.personality.currentMood,
        mood_history: this.personality.moodHistory,
        trust_level: this.personality.trustLevel,
        dependency_level: this.personality.dependencyLevel,
        satisfaction_score: this.personality.satisfactionScore,
        updated_at: this.personality.updatedAt.toISOString(),
        interaction_count: this.personality.interactionCount,
      });
  }
  
  get(): UserPersonality | null {
    return this.personality;
  }
  
  getSystemPrompt(): string {
    if (!this.personality) return '';
    return generatePersonalityPrompt(this.personality);
  }
}
