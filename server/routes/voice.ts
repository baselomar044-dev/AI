// ============================================
// 🎙️ VOICE ROUTES - Voice Call & Speech
// ============================================

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { unlimitedAI } from '../lib/unlimited-ai';

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
    eq: mockChain,
    range: mockChain,
    single: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  });
  supabase = { from: mockChain };
}

// Voice configurations
const VOICE_CONFIGS = {
  'sarah-en': { name: 'Sarah', language: 'en', provider: 'elevenlabs', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
  'adam-en': { name: 'Adam', language: 'en', provider: 'elevenlabs', voiceId: '21m00Tcm4TlvDq8ikWAM' },
  'layla-ar': { name: 'ليلى', language: 'ar', provider: 'elevenlabs', voiceId: 'pNInz6obpgDQGcFmaJgB' },
  'omar-ar': { name: 'عمر', language: 'ar', provider: 'elevenlabs', voiceId: 'yoZ06aMxZJJ28mfd3POQ' },
};

// In-memory call store (use Redis in production)
const activeCalls = new Map<string, {
  userId: string;
  status: 'connecting' | 'active' | 'ended';
  voiceId: string;
  startedAt: Date;
  duration: number;
}>();

// ================== START CALL ==================
router.post('/call/start', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { voiceId = 'sarah-en' } = req.body;

    // Check for existing active call
    const existingCall = Array.from(activeCalls.entries())
      .find(([_, call]) => call.userId === userId && call.status === 'active');

    if (existingCall) {
      return res.status(400).json({ 
        error: 'لديك مكالمة نشطة بالفعل',
        callId: existingCall[0],
      });
    }

    const callId = uuidv4();

    // Store call
    activeCalls.set(callId, {
      userId,
      status: 'active',
      voiceId,
      startedAt: new Date(),
      duration: 0,
    });

    // Log to database
    await supabase.from('voice_calls').insert({
      id: callId,
      user_id: userId,
      voice_id: voiceId,
      status: 'active',
    });

    res.status(201).json({
      callId,
      message: 'تم بدء المكالمة',
      voice: VOICE_CONFIGS[voiceId as keyof typeof VOICE_CONFIGS] || VOICE_CONFIGS['sarah-en'],
    });
  } catch (error: any) {
    console.error('Error starting call:', error);
    res.status(500).json({ error: 'فشل بدء المكالمة' });
  }
});

// ================== END CALL ==================
router.post('/call/:callId/end', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { callId } = req.params;

    const call = activeCalls.get(callId);
    if (!call || call.userId !== userId) {
      return res.status(404).json({ error: 'المكالمة غير موجودة' });
    }

    const duration = Math.floor((new Date().getTime() - call.startedAt.getTime()) / 1000);

    // Update database
    await supabase
      .from('voice_calls')
      .update({ 
        status: 'ended', 
        ended_at: new Date().toISOString(),
        duration,
      })
      .eq('id', callId);

    activeCalls.delete(callId);

    res.json({ 
      message: 'تم إنهاء المكالمة',
      duration,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل إنهاء المكالمة' });
  }
});

// ================== SPEECH TO TEXT ==================
router.post('/stt', async (req: Request, res: Response) => {
  try {
    const { audio, language = 'ar' } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'الملف الصوتي مطلوب' });
    }

    // Use Whisper API or other STT service
    // Placeholder implementation
    const transcript = 'مرحباً، كيف يمكنني مساعدتك؟';

    res.json({
      transcript,
      language,
      confidence: 0.95,
    });
  } catch (error: any) {
    console.error('STT error:', error);
    res.status(500).json({ error: 'فشل تحويل الصوت إلى نص' });
  }
});

// ================== TEXT TO SPEECH ==================
router.post('/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceId = 'layla-ar', speed = 1.0 } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'النص مطلوب' });
    }

    const voice = VOICE_CONFIGS[voiceId as keyof typeof VOICE_CONFIGS];
    if (!voice) {
      return res.status(400).json({ error: 'الصوت غير مدعوم' });
    }

    // Use ElevenLabs, Google TTS, or other service
    // Placeholder - would return actual audio
    const audioBase64 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYZNSm7FAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYZNSm7FAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

    res.json({
      audio: audioBase64,
      duration: text.length * 0.05, // Rough estimate
      voiceId,
    });
  } catch (error: any) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'فشل تحويل النص إلى صوت' });
  }
});

// ================== PROCESS VOICE INPUT ==================
router.post('/call/:callId/process', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { callId } = req.params;
    const { audio, text } = req.body;

    const call = activeCalls.get(callId);
    if (!call || call.userId !== userId) {
      return res.status(404).json({ error: 'المكالمة غير موجودة' });
    }

    // If audio provided, convert to text first
    let userText = text;
    if (audio && !text) {
      // STT processing
      userText = 'مرحباً'; // Placeholder
    }

    // Generate AI response
    let aiResponse = '';
    try {
      const completion = await unlimitedAI.chat({
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful voice assistant. Keep your responses concise, conversational, and friendly. If the user speaks Arabic, reply in Arabic (Egyptian dialect if appropriate).' 
          },
          { role: 'user', content: userText }
        ]
      });
      aiResponse = completion.content;
    } catch (e) {
      console.error('AI generation failed', e);
      aiResponse = 'Sorry, I am having trouble thinking right now.';
    }

    // Convert response to speech
    const audioResponse = 'data:audio/mp3;base64,...'; // Placeholder

    // Log message
    await supabase.from('voice_messages').insert({
      call_id: callId,
      role: 'user',
      content: userText,
    });

    await supabase.from('voice_messages').insert({
      call_id: callId,
      role: 'assistant',
      content: aiResponse,
    });

    res.json({
      transcript: userText,
      response: aiResponse,
      audio: audioResponse,
    });
  } catch (error: any) {
    console.error('Voice processing error:', error);
    res.status(500).json({ error: 'فشل معالجة الصوت' });
  }
});

// ================== GET AVAILABLE VOICES ==================
router.get('/voices', async (req: Request, res: Response) => {
  try {
    const { language } = req.query;

    let voices = Object.entries(VOICE_CONFIGS).map(([id, config]) => ({
      id,
      ...config,
    }));

    if (language) {
      voices = voices.filter(v => v.language === language);
    }

    res.json({ voices });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل جلب الأصوات' });
  }
});

// ================== GET CALL HISTORY ==================
router.get('/calls', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { limit = 20, offset = 0 } = req.query;

    const { data: calls, error } = await supabase
      .from('voice_calls')
      .select('id, voice_id, status, duration, created_at, ended_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) throw error;

    res.json({ calls: calls || [] });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل جلب سجل المكالمات' });
  }
});

// ================== GET CALL TRANSCRIPT ==================
router.get('/call/:callId/transcript', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { callId } = req.params;

    // Verify call belongs to user
    const { data: call } = await supabase
      .from('voice_calls')
      .select('id')
      .eq('id', callId)
      .eq('user_id', userId)
      .single();

    if (!call) {
      return res.status(404).json({ error: 'المكالمة غير موجودة' });
    }

    const { data: messages, error } = await supabase
      .from('voice_messages')
      .select('role, content, created_at')
      .eq('call_id', callId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ messages: messages || [] });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل جلب المحادثة' });
  }
});

export default router;
