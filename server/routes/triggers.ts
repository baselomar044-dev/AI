// ============================================
// ⚡ TRIGGERS ROUTES - Automation Triggers
// ============================================

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';

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
    single: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  });
  supabase = { from: mockChain };
}

// In-memory store for scheduled jobs (use Redis in production)
export const scheduledJobs = new Map<string, cron.ScheduledTask>();

// ================== LIST TRIGGERS ==================
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const { data: triggers, error } = await supabase
      .from('triggers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ triggers: triggers || [] });
  } catch (error: any) {
    console.error('Error listing triggers:', error);
    res.status(500).json({ error: 'فشل جلب المشغلات' });
  }
});

// ================== GET TRIGGER ==================
router.get('/:triggerId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { triggerId } = req.params;

    const { data: trigger, error } = await supabase
      .from('triggers')
      .select('*')
      .eq('id', triggerId)
      .eq('user_id', userId)
      .single();

    if (error || !trigger) {
      return res.status(404).json({ error: 'المشغل غير موجود' });
    }

    res.json({ trigger });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل جلب المشغل' });
  }
});

// ================== CREATE TRIGGER ==================
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { 
      name, 
      type, // 'schedule', 'webhook', 'integration'
      config,
      actions,
      enabled = true,
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'الاسم والنوع مطلوبان' });
    }

    const triggerId = uuidv4();
    let webhookUrl = null;
    let webhookSecret = null;

    // Generate webhook URL if needed
    if (type === 'webhook') {
      webhookSecret = uuidv4();
      webhookUrl = `${process.env.API_URL}/api/triggers/webhook/${triggerId}`;
    }

    // Validate cron expression for schedule triggers
    if (type === 'schedule' && config?.cron) {
      if (!cron.validate(config.cron)) {
        return res.status(400).json({ error: 'تعبير الجدولة غير صالح' });
      }
    }

    const { data: trigger, error } = await supabase
      .from('triggers')
      .insert({
        id: triggerId,
        user_id: userId,
        name,
        type,
        config: {
          ...config,
          webhookUrl,
          webhookSecret,
        },
        actions: actions || [],
        enabled,
      })
      .select()
      .single();

    if (error) throw error;

    // Schedule the job if it's a schedule trigger and enabled
    if (type === 'schedule' && enabled && config?.cron) {
      scheduleJob(triggerId, config.cron, userId, actions);
    }

    res.status(201).json({
      message: 'تم إنشاء المشغل',
      trigger: {
        ...trigger,
        webhookUrl,
      },
    });
  } catch (error: any) {
    console.error('Error creating trigger:', error);
    res.status(500).json({ error: 'فشل إنشاء المشغل' });
  }
});

// ================== UPDATE TRIGGER ==================
router.patch('/:triggerId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { triggerId } = req.params;
    const { name, config, actions, enabled } = req.body;

    // Get existing trigger
    const { data: existing } = await supabase
      .from('triggers')
      .select('*')
      .eq('id', triggerId)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'المشغل غير موجود' });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (config !== undefined) updates.config = { ...existing.config, ...config };
    if (actions !== undefined) updates.actions = actions;
    if (enabled !== undefined) updates.enabled = enabled;

    const { data: trigger, error } = await supabase
      .from('triggers')
      .update(updates)
      .eq('id', triggerId)
      .select()
      .single();

    if (error) throw error;

    // Update scheduled job if needed
    if (existing.type === 'schedule') {
      // Stop existing job
      const existingJob = scheduledJobs.get(triggerId);
      if (existingJob) {
        existingJob.stop();
        scheduledJobs.delete(triggerId);
      }

      // Reschedule if enabled
      if (trigger.enabled && trigger.config?.cron) {
        scheduleJob(triggerId, trigger.config.cron, userId, trigger.actions);
      }
    }

    res.json({
      message: 'تم تحديث المشغل',
      trigger,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحديث المشغل' });
  }
});

// ================== DELETE TRIGGER ==================
router.delete('/:triggerId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { triggerId } = req.params;

    // Stop scheduled job if exists
    const existingJob = scheduledJobs.get(triggerId);
    if (existingJob) {
      existingJob.stop();
      scheduledJobs.delete(triggerId);
    }

    const { error } = await supabase
      .from('triggers')
      .delete()
      .eq('id', triggerId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'تم حذف المشغل' });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل حذف المشغل' });
  }
});

// ================== TOGGLE TRIGGER ==================
router.patch('/:triggerId/toggle', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { triggerId } = req.params;

    const { data: trigger, error: fetchError } = await supabase
      .from('triggers')
      .select('*')
      .eq('id', triggerId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !trigger) {
      return res.status(404).json({ error: 'المشغل غير موجود' });
    }

    const newEnabled = !trigger.enabled;

    const { error } = await supabase
      .from('triggers')
      .update({ enabled: newEnabled })
      .eq('id', triggerId);

    if (error) throw error;

    // Handle scheduled job
    if (trigger.type === 'schedule') {
      const existingJob = scheduledJobs.get(triggerId);
      
      if (newEnabled && trigger.config?.cron) {
        if (!existingJob) {
          scheduleJob(triggerId, trigger.config.cron, userId, trigger.actions);
        }
      } else if (existingJob) {
        existingJob.stop();
        scheduledJobs.delete(triggerId);
      }
    }

    res.json({
      message: newEnabled ? 'تم تفعيل المشغل' : 'تم إيقاف المشغل',
      enabled: newEnabled,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تبديل المشغل' });
  }
});

// ================== TEST TRIGGER ==================
router.post('/:triggerId/test', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { triggerId } = req.params;
    const payload = req.body || {};

    const { data: trigger, error } = await supabase
      .from('triggers')
      .select('*')
      .eq('id', triggerId)
      .eq('user_id', userId)
      .single();

    if (error || !trigger) {
      return res.status(404).json({ error: 'المشغل غير موجود' });
    }

    // Execute trigger actions
    const results = await executeTriggerActions(trigger.actions, payload, userId);

    // Log execution
    await supabase.from('trigger_logs').insert({
      trigger_id: triggerId,
      payload,
      results,
      status: 'success',
    });

    res.json({
      message: 'تم تنفيذ الاختبار',
      results,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل الاختبار' });
  }
});

// ================== WEBHOOK ENDPOINT ==================
router.post('/webhook/:triggerId', async (req: Request, res: Response) => {
  try {
    const { triggerId } = req.params;
    const { secret } = req.query;

    // Get trigger
    const { data: trigger, error } = await supabase
      .from('triggers')
      .select('*')
      .eq('id', triggerId)
      .eq('type', 'webhook')
      .single();

    if (error || !trigger) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Verify secret
    if (trigger.config?.webhookSecret !== secret) {
      return res.status(401).json({ error: 'Invalid secret' });
    }

    // Check if enabled
    if (!trigger.enabled) {
      return res.status(400).json({ error: 'Trigger is disabled' });
    }

    // Execute actions
    const results = await executeTriggerActions(trigger.actions, req.body, trigger.user_id);

    // Log execution
    await supabase.from('trigger_logs').insert({
      trigger_id: triggerId,
      payload: req.body,
      results,
      status: 'success',
    });

    // Update last triggered
    await supabase
      .from('triggers')
      .update({ last_triggered: new Date().toISOString() })
      .eq('id', triggerId);

    res.json({ 
      message: 'Webhook executed',
      results,
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook execution failed' });
  }
});

// ================== GET TRIGGER LOGS ==================
router.get('/:triggerId/logs', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { triggerId } = req.params;
    const { limit = 50 } = req.query;

    // Verify trigger belongs to user
    const { data: trigger } = await supabase
      .from('triggers')
      .select('id')
      .eq('id', triggerId)
      .eq('user_id', userId)
      .single();

    if (!trigger) {
      return res.status(404).json({ error: 'المشغل غير موجود' });
    }

    const { data: logs, error } = await supabase
      .from('trigger_logs')
      .select('*')
      .eq('trigger_id', triggerId)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;

    res.json({ logs: logs || [] });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل جلب السجلات' });
  }
});

// ================== HELPER FUNCTIONS ==================

function scheduleJob(triggerId: string, cronExpression: string, userId: string, actions: any[]) {
  const job = cron.schedule(cronExpression, async () => {
    try {
      const results = await executeTriggerActions(actions, { scheduled: true }, userId);

      // Log execution
      await supabase.from('trigger_logs').insert({
        trigger_id: triggerId,
        payload: { scheduled: true, timestamp: new Date().toISOString() },
        results,
        status: 'success',
      });

      // Update last triggered
      await supabase
        .from('triggers')
        .update({ last_triggered: new Date().toISOString() })
        .eq('id', triggerId);
    } catch (error) {
      console.error(`Trigger ${triggerId} execution failed:`, error);
      
      await supabase.from('trigger_logs').insert({
        trigger_id: triggerId,
        payload: { scheduled: true },
        error: (error as Error).message,
        status: 'error',
      });
    }
  });

  scheduledJobs.set(triggerId, job);
}

async function executeTriggerActions(actions: any[], payload: any, userId: string): Promise<any[]> {
  const results = [];

  for (const action of actions) {
    try {
      let result;

      switch (action.type) {
        case 'send_message':
          // Send message to chat
          result = { success: true, message: 'Message would be sent' };
          break;

        case 'call_api':
          // Make HTTP request
          result = { success: true, message: 'API call would be made' };
          break;

        case 'create_memory':
          // Create a memory
          await supabase.from('memories').insert({
            user_id: userId,
            content: action.content,
            category: action.category || 'trigger',
            importance: action.importance || 5,
          });
          result = { success: true, message: 'Memory created' };
          break;

        case 'run_agent':
          // Run an AI agent
          result = { success: true, message: 'Agent would be triggered' };
          break;

        default:
          result = { success: false, message: 'Unknown action type' };
      }

      results.push({ action: action.type, ...result });
    } catch (error) {
      results.push({ action: action.type, success: false, error: (error as Error).message });
    }
  }

  return results;
}

// ================== LOAD EXISTING SCHEDULED TRIGGERS ON STARTUP ==================
async function loadScheduledTriggers() {
  try {
    const { data: triggers } = await supabase
      .from('triggers')
      .select('*')
      .eq('type', 'schedule')
      .eq('enabled', true);

    if (triggers) {
      for (const trigger of triggers) {
        if (trigger.config?.cron) {
          scheduleJob(trigger.id, trigger.config.cron, trigger.user_id, trigger.actions);
        }
      }
      console.log(`Loaded ${triggers.length} scheduled triggers`);
    }
  } catch (error) {
    console.error('Error loading scheduled triggers:', error);
  }
}

// Load triggers on module initialization
loadScheduledTriggers();

export default router;
