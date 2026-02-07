// ============================================
// 🧠 MEMORY ROUTES - AI Memory & Personality
// ============================================

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

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
  const mockChain = () => ({
    select: mockChain,
    insert: mockChain,
    update: mockChain,
    delete: mockChain,
    upsert: mockChain,
    eq: mockChain,
    in: mockChain,
    ilike: mockChain,
    order: mockChain,
    range: mockChain,
    limit: mockChain,
    single: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  });
  supabase = { from: mockChain };
}

// ================== LIST MEMORIES ==================
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { category, search, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .order('importance', { ascending: false })
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.ilike('content', `%${search}%`);
    }

    const { data: memories, error } = await query;

    if (error) throw error;

    res.json({ memories: memories || [] });
  } catch (error: any) {
    console.error('Error listing memories:', error);
    res.status(500).json({ error: 'فشل جلب الذكريات' });
  }
});

// ================== GET MEMORY ==================
router.get('/:memoryId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { memoryId } = req.params;

    const { data: memory, error } = await supabase
      .from('memories')
      .select('*')
      .eq('id', memoryId)
      .eq('user_id', userId)
      .single();

    if (error || !memory) {
      return res.status(404).json({ error: 'الذكرى غير موجودة' });
    }

    // Update access count
    await supabase
      .from('memories')
      .update({ 
        access_count: memory.access_count + 1,
        last_accessed: new Date().toISOString(),
      })
      .eq('id', memoryId);

    res.json({ memory });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل جلب الذكرى' });
  }
});

// ================== CREATE MEMORY ==================
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { content, category = 'fact', importance = 5, metadata = {} } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'المحتوى مطلوب' });
    }

    // Generate embedding for semantic search (placeholder)
    // const embedding = await generateEmbedding(content);

    const { data: memory, error } = await supabase
      .from('memories')
      .insert({
        user_id: userId,
        content,
        category,
        importance: Math.min(10, Math.max(1, importance)),
        metadata,
        // embedding,
        access_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'تم إضافة الذكرى',
      memory,
    });
  } catch (error: any) {
    console.error('Error creating memory:', error);
    res.status(500).json({ error: 'فشل إضافة الذكرى' });
  }
});

// ================== UPDATE MEMORY ==================
router.patch('/:memoryId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { memoryId } = req.params;
    const { content, category, importance, metadata } = req.body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (content !== undefined) updates.content = content;
    if (category !== undefined) updates.category = category;
    if (importance !== undefined) updates.importance = Math.min(10, Math.max(1, importance));
    if (metadata !== undefined) updates.metadata = metadata;

    const { data: memory, error } = await supabase
      .from('memories')
      .update(updates)
      .eq('id', memoryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'تم تحديث الذكرى',
      memory,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحديث الذكرى' });
  }
});

// ================== DELETE MEMORY ==================
router.delete('/:memoryId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { memoryId } = req.params;

    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', memoryId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'تم حذف الذكرى' });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل حذف الذكرى' });
  }
});

// ================== SEARCH MEMORIES (Semantic) ==================
router.post('/search', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { query, limit = 10, threshold = 0.7 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'استعلام البحث مطلوب' });
    }

    // Generate embedding for query
    // const queryEmbedding = await generateEmbedding(query);

    // For now, do text search
    const { data: memories, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .ilike('content', `%${query}%`)
      .order('importance', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;

    res.json({ memories: memories || [] });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل البحث' });
  }
});

// ================== BULK DELETE MEMORIES ==================
router.post('/bulk-delete', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { memoryIds } = req.body;

    if (!memoryIds || !Array.isArray(memoryIds)) {
      return res.status(400).json({ error: 'قائمة الذكريات مطلوبة' });
    }

    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('user_id', userId)
      .in('id', memoryIds);

    if (error) throw error;

    res.json({ 
      message: 'تم حذف الذكريات',
      deletedCount: memoryIds.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل حذف الذكريات' });
  }
});

// ================== GET PERSONALITY ==================
router.get('/personality/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const { data: personality, error } = await supabase
      .from('user_personalities')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({
      personality: personality || {
        traits: {
          openness: 0.5,
          conscientiousness: 0.5,
          extraversion: 0.5,
          agreeableness: 0.5,
          neuroticism: 0.5,
        },
        interests: [],
        communication_style: 'balanced',
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل جلب الشخصية' });
  }
});

// ================== UPDATE PERSONALITY ==================
router.patch('/personality/profile', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { traits, interests, communication_style } = req.body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (traits) updates.traits = traits;
    if (interests) updates.interests = interests;
    if (communication_style) updates.communication_style = communication_style;

    const { data, error } = await supabase
      .from('user_personalities')
      .upsert({
        user_id: userId,
        ...updates,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'تم تحديث الشخصية',
      personality: data,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحديث الشخصية' });
  }
});

// ================== ANALYZE CONVERSATION ==================
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'الرسائل مطلوبة' });
    }

    // Extract memories and personality insights from conversation
    // This would use AI to analyze the conversation

    // Placeholder analysis
    const analysis = {
      extractedMemories: [
        { content: 'يفضل القهوة السوداء', category: 'preference', importance: 6 },
      ],
      personalityInsights: {
        openness: 0.1, // Delta to add to current value
        extraversion: -0.05,
      },
      mood: 'neutral',
      topics: ['work', 'coffee'],
    };

    // Auto-save extracted memories
    for (const memory of analysis.extractedMemories) {
      await supabase.from('memories').insert({
        user_id: userId,
        ...memory,
        metadata: { source: 'auto-extracted' },
      });
    }

    res.json({ analysis });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل التحليل' });
  }
});

// ================== GET MEMORY STATS ==================
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const { data: memories, error } = await supabase
      .from('memories')
      .select('category, importance')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      total: memories?.length || 0,
      byCategory: {} as Record<string, number>,
      avgImportance: 0,
      highPriority: 0,
    };

    if (memories && memories.length > 0) {
      let totalImportance = 0;
      for (const memory of memories) {
        stats.byCategory[memory.category] = (stats.byCategory[memory.category] || 0) + 1;
        totalImportance += memory.importance;
        if (memory.importance >= 8) stats.highPriority++;
      }
      stats.avgImportance = totalImportance / memories.length;
    }

    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل جلب الإحصائيات' });
  }
});

// ================== CLEAR ALL MEMORIES ==================
router.delete('/all', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { confirm } = req.body;

    if (confirm !== 'DELETE_ALL_MEMORIES') {
      return res.status(400).json({ error: 'تأكيد الحذف مطلوب' });
    }

    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'تم حذف جميع الذكريات' });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل حذف الذكريات' });
  }
});

export default router;
