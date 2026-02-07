// ============================================
// 🧠 ULTIMATE KNOWLEDGE SYSTEM
// Automatic AI Learning + Manual User Control
// The BEST of Tasklet + ChatGPT Combined
// ============================================

import { createClient } from '@supabase/supabase-js';

let supabase: any;

try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  } else {
    throw new Error('Missing Supabase credentials');
  }
} catch (error) {
  console.warn('⚠️ Supabase not configured. Knowledge system will be disabled.');
  // Mock Supabase client to prevent crashes
  const mockChain = () => ({
    select: mockChain,
    insert: mockChain,
    update: mockChain,
    delete: mockChain,
    eq: mockChain,
    neq: mockChain,
    gt: mockChain,
    lt: mockChain,
    gte: mockChain,
    lte: mockChain,
    like: mockChain,
    ilike: mockChain,
    is: mockChain,
    in: mockChain,
    contains: mockChain,
    containedBy: mockChain,
    rangeGt: mockChain,
    rangeGte: mockChain,
    rangeLt: mockChain,
    rangeLte: mockChain,
    rangeAdjacent: mockChain,
    overlaps: mockChain,
    textSearch: mockChain,
    match: mockChain,
    not: mockChain,
    or: mockChain,
    filter: mockChain,
    order: mockChain,
    limit: mockChain,
    single: async () => ({ data: null, error: null }),
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  });
  
  supabase = {
    from: mockChain,
  };
}

// ============================================
// KNOWLEDGE TYPES
// ============================================

export interface Knowledge {
  id: string;
  userId: string;
  type: KnowledgeType;
  content: string;
  metadata: Record<string, any>;
  importance: number;       // 1-10 priority scale
  confidence: number;       // 0-1 how confident AI is
  source: 'auto' | 'manual' | 'inferred';
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  accessCount: number;
  lastAccessed?: Date;
  expiresAt?: Date;         // For temporary knowledge
  isVerified: boolean;      // User confirmed this is correct
}

export type KnowledgeType =
  | 'identity'      // Name, age, location, etc.
  | 'preference'    // Likes, dislikes, favorites
  | 'fact'          // Stated facts about user
  | 'skill'         // User capabilities
  | 'goal'          // What user wants to achieve
  | 'relationship'  // People user knows
  | 'project'       // Ongoing work
  | 'schedule'      // Time-based info
  | 'instruction'   // How user wants AI to behave
  | 'context'       // Situational context
  | 'emotion'       // Emotional patterns
  | 'history';      // Conversation history insights

// ============================================
// KNOWLEDGE EXTRACTION PATTERNS
// ============================================

const EXTRACTION_PATTERNS: Record<KnowledgeType, { patterns: RegExp[]; importance: number }> = {
  identity: {
    patterns: [
      /my name is (\w+)/i,
      /i('m| am) (\w+)/i,
      /call me (\w+)/i,
      /i('m| am) (\d+) years old/i,
      /i live in (.+)/i,
      /i('m| am) from (.+)/i,
      /اسمي ([\u0600-\u06FF\s]+)/,
      /عمري (\d+)/,
      /أسكن في ([\u0600-\u06FF\s]+)/,
      /أنا من ([\u0600-\u06FF\s]+)/,
    ],
    importance: 9,
  },
  preference: {
    patterns: [
      /i (love|like|prefer|enjoy|adore) (.+)/i,
      /i (hate|dislike|can't stand|don't like) (.+)/i,
      /my favorite (.+) is (.+)/i,
      /i always (.+)/i,
      /i never (.+)/i,
      /أحب ([\u0600-\u06FF\s]+)/,
      /أفضل ([\u0600-\u06FF\s]+)/,
      /أكره ([\u0600-\u06FF\s]+)/,
      /المفضل لدي ([\u0600-\u06FF\s]+)/,
      /بحب ([\u0600-\u06FF\s]+)/,
      /مابحبش ([\u0600-\u06FF\s]+)/,
    ],
    importance: 8,
  },
  skill: {
    patterns: [
      /i('m| am) (good|great|excellent|skilled) at (.+)/i,
      /i (can|know how to) (.+)/i,
      /i have experience (in|with) (.+)/i,
      /i('ve| have) been (.+)ing for (\d+) years/i,
      /أجيد ([\u0600-\u06FF\s]+)/,
      /أعرف ([\u0600-\u06FF\s]+)/,
      /عندي خبرة في ([\u0600-\u06FF\s]+)/,
    ],
    importance: 7,
  },
  goal: {
    patterns: [
      /i want to (.+)/i,
      /i('m| am) trying to (.+)/i,
      /my goal is (.+)/i,
      /i need to (.+)/i,
      /i('m| am) working on (.+)/i,
      /i plan to (.+)/i,
      /أريد أن ([\u0600-\u06FF\s]+)/,
      /هدفي ([\u0600-\u06FF\s]+)/,
      /أحاول ([\u0600-\u06FF\s]+)/,
      /أخطط ([\u0600-\u06FF\s]+)/,
    ],
    importance: 8,
  },
  relationship: {
    patterns: [
      /my (wife|husband|partner|girlfriend|boyfriend|friend|brother|sister|mother|father|boss|colleague|coworker) (.+)/i,
      /(زوجتي|زوجي|صديقي|أخي|أختي|أمي|أبي|مديري) ([\u0600-\u06FF\s]+)/,
    ],
    importance: 7,
  },
  instruction: {
    patterns: [
      /always (.+) when (.+)/i,
      /never (.+)/i,
      /remember (that |to )?(.+)/i,
      /don't forget (.+)/i,
      /from now on(.+)/i,
      /دائماً ([\u0600-\u06FF\s]+)/,
      /لا تنسى ([\u0600-\u06FF\s]+)/,
      /تذكر ([\u0600-\u06FF\s]+)/,
    ],
    importance: 10,
  },
  project: {
    patterns: [
      /i('m| am) building (.+)/i,
      /i('m| am) working on (.+)/i,
      /my project (.+)/i,
      /my startup (.+)/i,
      /my business (.+)/i,
      /مشروعي ([\u0600-\u06FF\s]+)/,
      /أعمل على ([\u0600-\u06FF\s]+)/,
      /شركتي ([\u0600-\u06FF\s]+)/,
    ],
    importance: 8,
  },
  schedule: {
    patterns: [
      /i (usually|always|normally) (.+) at (\d+)/i,
      /every (morning|afternoon|evening|night|day|week|month) i (.+)/i,
      /my (meeting|appointment|schedule) (.+)/i,
      /كل (يوم|أسبوع|شهر) ([\u0600-\u06FF\s]+)/,
      /عادة ([\u0600-\u06FF\s]+)/,
    ],
    importance: 6,
  },
  emotion: {
    patterns: [
      /i('m| am) feeling (.+)/i,
      /i feel (.+)/i,
      /i('m| am) (happy|sad|anxious|excited|worried|stressed|tired|angry|frustrated)/i,
      /أشعر ب([\u0600-\u06FF\s]+)/,
      /أنا (سعيد|حزين|قلق|متحمس|مرهق|متعب)/,
    ],
    importance: 5,
  },
  fact: {
    patterns: [],
    importance: 6,
  },
  context: {
    patterns: [],
    importance: 5,
  },
  history: {
    patterns: [],
    importance: 4,
  },
};

// ============================================
// KNOWLEDGE MANAGER CLASS
// ============================================

export class KnowledgeManager {
  private userId: string;
  private cache: Map<string, Knowledge> = new Map();

  constructor(userId: string) {
    this.userId = userId;
  }

  // ========== AUTO EXTRACTION ==========
  
  async extractAndSave(message: string, context?: any): Promise<Knowledge[]> {
    const extracted: Knowledge[] = [];

    for (const [type, config] of Object.entries(EXTRACTION_PATTERNS)) {
      for (const pattern of config.patterns) {
        const match = message.match(pattern);
        if (match) {
          const knowledge = await this.save({
            type: type as KnowledgeType,
            content: match[0],
            metadata: {
              fullMatch: match[0],
              groups: match.slice(1),
              originalMessage: message,
              context,
            },
            importance: config.importance,
            confidence: 0.85,
            source: 'auto',
            category: type,
            tags: this.extractTags(message),
            isVerified: false,
          });
          extracted.push(knowledge);
        }
      }
    }

    // Also extract implicit knowledge using AI inference
    const inferred = await this.inferKnowledge(message, context);
    extracted.push(...inferred);

    return extracted;
  }

  // ========== AI-POWERED INFERENCE ==========
  
  private async inferKnowledge(message: string, context?: any): Promise<Knowledge[]> {
    // Infer implicit knowledge from conversation patterns
    const inferred: Knowledge[] = [];

    // Detect communication style
    if (message.length > 200) {
      // User prefers detailed communication
      inferred.push(await this.save({
        type: 'preference',
        content: 'Prefers detailed explanations',
        metadata: { inferredFrom: 'message length analysis' },
        importance: 5,
        confidence: 0.6,
        source: 'inferred',
        category: 'communication',
        tags: ['style', 'detailed'],
        isVerified: false,
      }));
    }

    // Detect technical level
    const technicalWords = /\b(api|function|algorithm|database|server|code|programming|debug|deploy|git|docker)\b/i;
    if (technicalWords.test(message)) {
      inferred.push(await this.save({
        type: 'skill',
        content: 'Has technical/programming knowledge',
        metadata: { inferredFrom: 'technical vocabulary' },
        importance: 6,
        confidence: 0.7,
        source: 'inferred',
        category: 'technical',
        tags: ['developer', 'technical'],
        isVerified: false,
      }));
    }

    return inferred;
  }

  // ========== MANUAL KNOWLEDGE MANAGEMENT ==========
  
  async addManual(
    content: string,
    type: KnowledgeType = 'fact',
    options: Partial<Knowledge> = {}
  ): Promise<Knowledge> {
    return this.save({
      type,
      content,
      metadata: options.metadata || {},
      importance: options.importance || 7,
      confidence: 1.0, // Manual entries have full confidence
      source: 'manual',
      category: options.category || type,
      tags: options.tags || [],
      isVerified: true, // Manual entries are verified by default
    });
  }

  async update(knowledgeId: string, updates: Partial<Knowledge>): Promise<Knowledge | null> {
    const { data, error } = await supabase
      .from('knowledge')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', knowledgeId)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) throw error;
    return this.mapFromDb(data);
  }

  async delete(knowledgeId: string): Promise<boolean> {
    const { error } = await supabase
      .from('knowledge')
      .delete()
      .eq('id', knowledgeId)
      .eq('user_id', this.userId);

    if (error) throw error;
    this.cache.delete(knowledgeId);
    return true;
  }

  async verify(knowledgeId: string, isCorrect: boolean): Promise<void> {
    if (isCorrect) {
      await this.update(knowledgeId, { isVerified: true, confidence: 1.0 });
    } else {
      await this.delete(knowledgeId);
    }
  }

  // ========== RETRIEVAL ==========
  
  async getAll(filters?: { type?: KnowledgeType; category?: string; verified?: boolean }): Promise<Knowledge[]> {
    let query = supabase
      .from('knowledge')
      .select('*')
      .eq('user_id', this.userId)
      .order('importance', { ascending: false })
      .order('updated_at', { ascending: false });

    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.verified !== undefined) query = query.eq('is_verified', filters.verified);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(this.mapFromDb);
  }

  async search(query: string, limit = 10): Promise<Knowledge[]> {
    const { data, error } = await supabase
      .from('knowledge')
      .select('*')
      .eq('user_id', this.userId)
      .or(`content.ilike.%${query}%,tags.cs.{${query}}`)
      .order('importance', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Update access counts
    for (const item of data || []) {
      await supabase
        .from('knowledge')
        .update({
          access_count: item.access_count + 1,
          last_accessed: new Date().toISOString(),
        })
        .eq('id', item.id);
    }

    return (data || []).map(this.mapFromDb);
  }

  async getRelevantForContext(message: string): Promise<Knowledge[]> {
    // Get all high-importance knowledge
    const highPriority = await this.getAll();
    const relevant = highPriority.filter(k => k.importance >= 7);

    // Search for message-specific knowledge
    const keywords = this.extractKeywords(message);
    const searchResults = await Promise.all(
      keywords.map(kw => this.search(kw, 3))
    );

    // Combine and deduplicate
    const combined = [...relevant];
    for (const results of searchResults) {
      for (const r of results) {
        if (!combined.find(c => c.id === r.id)) {
          combined.push(r);
        }
      }
    }

    return combined.slice(0, 20); // Limit context size
  }

  // ========== CONTEXT GENERATION ==========
  
  async generateContext(message: string): Promise<string> {
    const knowledge = await this.getRelevantForContext(message);
    
    if (knowledge.length === 0) return '';

    const grouped: Record<string, string[]> = {};
    for (const k of knowledge) {
      const key = k.type;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(k.content);
    }

    let context = '\n\n📚 معلومات عن المستخدم (User Knowledge):\n';
    
    if (grouped.identity?.length) {
      context += `👤 الهوية: ${grouped.identity.join(' | ')}\n`;
    }
    if (grouped.preference?.length) {
      context += `❤️ التفضيلات: ${grouped.preference.join(' | ')}\n`;
    }
    if (grouped.skill?.length) {
      context += `💪 المهارات: ${grouped.skill.join(' | ')}\n`;
    }
    if (grouped.goal?.length) {
      context += `🎯 الأهداف: ${grouped.goal.join(' | ')}\n`;
    }
    if (grouped.project?.length) {
      context += `🚀 المشاريع: ${grouped.project.join(' | ')}\n`;
    }
    if (grouped.instruction?.length) {
      context += `📝 تعليمات خاصة: ${grouped.instruction.join(' | ')}\n`;
    }
    if (grouped.relationship?.length) {
      context += `👥 العلاقات: ${grouped.relationship.join(' | ')}\n`;
    }

    return context;
  }

  // ========== INTERNAL HELPERS ==========
  
  private async save(knowledge: Omit<Knowledge, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'accessCount'>): Promise<Knowledge> {
    // Check for duplicates
    const existing = await supabase
      .from('knowledge')
      .select('id')
      .eq('user_id', this.userId)
      .eq('content', knowledge.content)
      .single();

    if (existing.data) {
      // Update existing instead
      const updated = await this.update(existing.data.id, {
        ...knowledge,
        accessCount: 1,
      });
      return updated!;
    }

    const now = new Date();
    const newKnowledge = {
      user_id: this.userId,
      type: knowledge.type,
      content: knowledge.content,
      metadata: knowledge.metadata,
      importance: knowledge.importance,
      confidence: knowledge.confidence,
      source: knowledge.source,
      category: knowledge.category,
      tags: knowledge.tags,
      is_verified: knowledge.isVerified,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      access_count: 0,
      expires_at: knowledge.expiresAt?.toISOString(),
    };

    const { data, error } = await supabase
      .from('knowledge')
      .insert(newKnowledge)
      .select()
      .single();

    if (error) throw error;
    
    const result = this.mapFromDb(data);
    this.cache.set(result.id, result);
    return result;
  }

  private mapFromDb(row: any): Knowledge {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      content: row.content,
      metadata: row.metadata || {},
      importance: row.importance,
      confidence: row.confidence,
      source: row.source,
      category: row.category,
      tags: row.tags || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      accessCount: row.access_count,
      lastAccessed: row.last_accessed ? new Date(row.last_accessed) : undefined,
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      isVerified: row.is_verified,
    };
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    
    // Extract hashtags
    const hashtags = text.match(/#\w+/g);
    if (hashtags) tags.push(...hashtags.map(t => t.slice(1)));

    // Extract key topics
    const topics = [
      { pattern: /\b(work|job|career|business)\b/i, tag: 'work' },
      { pattern: /\b(family|wife|husband|kids|children)\b/i, tag: 'family' },
      { pattern: /\b(health|fitness|exercise|diet)\b/i, tag: 'health' },
      { pattern: /\b(code|programming|developer|software)\b/i, tag: 'tech' },
      { pattern: /\b(travel|trip|vacation)\b/i, tag: 'travel' },
      { pattern: /\b(learn|study|education|course)\b/i, tag: 'education' },
      { pattern: /\b(money|finance|budget|invest)\b/i, tag: 'finance' },
    ];

    for (const topic of topics) {
      if (topic.pattern.test(text)) tags.push(topic.tag);
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 5);
  }

  // ========== CLEANUP ==========
  
  async pruneOld(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete expired
    const { count: expiredCount } = await supabase
      .from('knowledge')
      .delete()
      .eq('user_id', this.userId)
      .lt('expires_at', new Date().toISOString());

    // Delete low-confidence unverified old items
    const { count: oldCount } = await supabase
      .from('knowledge')
      .delete()
      .eq('user_id', this.userId)
      .eq('is_verified', false)
      .lt('confidence', 0.5)
      .lt('access_count', 2)
      .lt('created_at', thirtyDaysAgo.toISOString());

    return (expiredCount || 0) + (oldCount || 0);
  }
}

// ============================================
// KNOWLEDGE ROUTES HELPER
// ============================================

export function createKnowledgeRoutes(router: any) {
  // Get all knowledge
  router.get('/knowledge', async (req: any, res: any) => {
    try {
      const userId = req.userId || req.user?.id;
      const manager = new KnowledgeManager(userId);
      const knowledge = await manager.getAll(req.query);
      res.json({ knowledge });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add manual knowledge
  router.post('/knowledge', async (req: any, res: any) => {
    try {
      const userId = req.userId || req.user?.id;
      const { content, type, category, tags, importance } = req.body;
      
      const manager = new KnowledgeManager(userId);
      const knowledge = await manager.addManual(content, type, { category, tags, importance });
      
      res.status(201).json({ knowledge });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update knowledge
  router.patch('/knowledge/:id', async (req: any, res: any) => {
    try {
      const userId = req.userId || req.user?.id;
      const { id } = req.params;
      
      const manager = new KnowledgeManager(userId);
      const knowledge = await manager.update(id, req.body);
      
      res.json({ knowledge });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete knowledge
  router.delete('/knowledge/:id', async (req: any, res: any) => {
    try {
      const userId = req.userId || req.user?.id;
      const { id } = req.params;
      
      const manager = new KnowledgeManager(userId);
      await manager.delete(id);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Verify knowledge (user confirms or rejects)
  router.post('/knowledge/:id/verify', async (req: any, res: any) => {
    try {
      const userId = req.userId || req.user?.id;
      const { id } = req.params;
      const { isCorrect } = req.body;
      
      const manager = new KnowledgeManager(userId);
      await manager.verify(id, isCorrect);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Search knowledge
  router.get('/knowledge/search', async (req: any, res: any) => {
    try {
      const userId = req.userId || req.user?.id;
      const { q, limit } = req.query;
      
      const manager = new KnowledgeManager(userId);
      const knowledge = await manager.search(q, Number(limit) || 10);
      
      res.json({ knowledge });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

export default KnowledgeManager;
