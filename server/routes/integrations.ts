// ============================================
// 🔌 INTEGRATIONS ROUTES - Third-party Connections
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const optionalAuthMiddleware = async (_req: Request, _res: Response, next: NextFunction) => {
  // Implementation...
  next();
};

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
  // Mock Supabase client
  const mockChain = () => ({
    select: mockChain,
    insert: mockChain,
    update: mockChain,
    delete: mockChain,
    upsert: mockChain,
    eq: mockChain,
    single: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  });
  
  supabase = {
    from: mockChain,
  };
}

// Encryption key for storing sensitive data
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// ================== HELPERS ==================

const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text: string): string => {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encrypted = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

// ================== LIST INTEGRATIONS ==================
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('id, integration_id, is_active, connected_at, last_used')
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ integrations: integrations || [] });
  } catch (error: any) {
    console.error('Error listing integrations:', error);
    res.status(500).json({ error: 'فشل جلب التكاملات' });
  }
});

// ================== GET INTEGRATION ==================
router.get('/:integrationId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { integrationId } = req.params;

    const { data: integration, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_id', integrationId)
      .single();

    if (error || !integration) {
      return res.status(404).json({ error: 'التكامل غير موجود' });
    }

    // Don't send sensitive data
    delete integration.config;

    res.json({ integration });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل جلب التكامل' });
  }
});

// ================== CONNECT INTEGRATION ==================
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { integrationId, config } = req.body;

    if (!integrationId) {
      return res.status(400).json({ error: 'معرف التكامل مطلوب' });
    }

    // Encrypt sensitive config data
    const encryptedConfig = config ? {
      ...config,
      apiKey: config.apiKey ? encrypt(config.apiKey) : undefined,
      accessToken: config.accessToken ? encrypt(config.accessToken) : undefined,
      refreshToken: config.refreshToken ? encrypt(config.refreshToken) : undefined,
    } : {};

    // Check if already connected
    const { data: existing } = await supabase
      .from('integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('integration_id', integrationId)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('integrations')
        .update({
          config: encryptedConfig,
          is_active: true,
          connected_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      return res.json({
        message: 'تم تحديث التكامل',
        integration: { id: data.id, integration_id: data.integration_id, is_active: true },
      });
    }

    // Create new connection
    const { data, error } = await supabase
      .from('integrations')
      .insert({
        user_id: userId,
        integration_id: integrationId,
        config: encryptedConfig,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'تم الاتصال بنجاح!',
      integration: { id: data.id, integration_id: data.integration_id, is_active: true },
    });
  } catch (error: any) {
    console.error('Error connecting integration:', error);
    res.status(500).json({ error: 'فشل الاتصال' });
  }
});

// ================== OAUTH INITIATE ==================
router.get('/oauth/:integrationId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { integrationId } = req.params;

    // Get integration config from your integrations definitions
    const integrationConfigs: Record<string, any> = {
      gmail: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        clientId: process.env.GOOGLE_CLIENT_ID,
        scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
      },
      slack: {
        authUrl: 'https://slack.com/oauth/v2/authorize',
        clientId: process.env.SLACK_CLIENT_ID,
        scopes: ['chat:write', 'channels:read'],
      },
      notion: {
        authUrl: 'https://api.notion.com/v1/oauth/authorize',
        clientId: process.env.NOTION_CLIENT_ID,
        scopes: [],
      },
      github: {
        authUrl: 'https://github.com/login/oauth/authorize',
        clientId: process.env.GITHUB_CLIENT_ID,
        scopes: ['repo', 'user'],
      },
    };

    const config = integrationConfigs[integrationId];
    if (!config) {
      return res.status(400).json({ error: 'التكامل غير مدعوم لـ OAuth' });
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Store state temporarily
    await supabase.from('oauth_states').insert({
      state,
      user_id: userId,
      integration_id: integrationId,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    });

    const redirectUri = `${process.env.API_URL}/api/integrations/callback/${integrationId}`;
    const authUrl = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(config.scopes.join(' '))}&state=${state}&response_type=code`;

    res.json({ authUrl });
  } catch (error: any) {
    console.error('Error initiating OAuth:', error);
    res.status(500).json({ error: 'فشل بدء المصادقة' });
  }
});

// ================== OAUTH CALLBACK ==================
router.get('/callback/:integrationId', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params;
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=${oauthError}`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=missing_params`);
    }

    // Verify state
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('integration_id', integrationId)
      .single();

    if (stateError || !stateData) {
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=invalid_state`);
    }

    // Delete used state
    await supabase.from('oauth_states').delete().eq('state', state);

    // Check if state expired
    if (new Date(stateData.expires_at) < new Date()) {
      return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=state_expired`);
    }

    // Exchange code for tokens (implementation depends on provider)
    const tokens = await exchangeCodeForTokens(integrationId, code as string);

    // Store the tokens
    await supabase.from('integrations').upsert({
      user_id: stateData.user_id,
      integration_id: integrationId,
      config: {
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        expiresAt: tokens.expires_at,
      },
      is_active: true,
      connected_at: new Date().toISOString(),
    });

    res.redirect(`${process.env.FRONTEND_URL}/integrations?connected=${integrationId}`);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/integrations?error=callback_failed`);
  }
});

// ================== DISCONNECT INTEGRATION ==================
router.delete('/:integrationId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { integrationId } = req.params;

    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('user_id', userId)
      .eq('integration_id', integrationId);

    if (error) throw error;

    res.json({ message: 'تم قطع الاتصال بنجاح' });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل قطع الاتصال' });
  }
});

// ================== TOGGLE INTEGRATION ==================
router.patch('/:integrationId/toggle', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { integrationId } = req.params;

    const { data: current } = await supabase
      .from('integrations')
      .select('is_active')
      .eq('user_id', userId)
      .eq('integration_id', integrationId)
      .single();

    if (!current) {
      return res.status(404).json({ error: 'التكامل غير موجود' });
    }

    const { error } = await supabase
      .from('integrations')
      .update({ is_active: !current.is_active })
      .eq('user_id', userId)
      .eq('integration_id', integrationId);

    if (error) throw error;

    res.json({
      message: current.is_active ? 'تم إيقاف التكامل' : 'تم تفعيل التكامل',
      is_active: !current.is_active,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل التبديل' });
  }
});

// ================== EXECUTE INTEGRATION ACTION ==================
router.post('/:integrationId/execute', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { integrationId } = req.params;
    const { action, params } = req.body;

    // Get integration config
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_id', integrationId)
      .single();

    if (error || !integration || !integration.is_active) {
      return res.status(400).json({ error: 'التكامل غير متاح' });
    }

    // Execute action based on integration type
    const result = await executeIntegrationAction(integrationId, action, params, integration.config);

    // Update last used
    await supabase
      .from('integrations')
      .update({ last_used: new Date().toISOString() })
      .eq('id', integration.id);

    res.json({ result });
  } catch (error: any) {
    console.error('Error executing integration action:', error);
    res.status(500).json({ error: 'فشل تنفيذ الإجراء' });
  }
});

// ================== HELPER FUNCTIONS ==================

async function exchangeCodeForTokens(integrationId: string, code: string): Promise<any> {
  // Implementation depends on the provider
  // This is a simplified example
  const tokenUrls: Record<string, string> = {
    gmail: 'https://oauth2.googleapis.com/token',
    slack: 'https://slack.com/api/oauth.v2.access',
    notion: 'https://api.notion.com/v1/oauth/token',
    github: 'https://github.com/login/oauth/access_token',
  };

  const clientSecrets: Record<string, string | undefined> = {
    gmail: process.env.GOOGLE_CLIENT_SECRET,
    slack: process.env.SLACK_CLIENT_SECRET,
    notion: process.env.NOTION_CLIENT_SECRET,
    github: process.env.GITHUB_CLIENT_SECRET,
  };

  // Make token exchange request (implementation varies by provider)
  // This is placeholder - actual implementation needed per provider

  return {
    access_token: 'placeholder_token',
    refresh_token: 'placeholder_refresh',
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
  };
}

async function executeIntegrationAction(
  integrationId: string,
  action: string,
  params: any,
  config: any
): Promise<any> {
  // Implementation depends on the integration and action
  // This is a placeholder for the actual implementation

  switch (integrationId) {
    case 'gmail':
      // Handle Gmail actions
      break;
    case 'slack':
      // Handle Slack actions
      break;
    case 'notion':
      // Handle Notion actions
      break;
    case 'whatsapp':
      if (action === 'sendMessage') {
        // WhatsApp Business API
        const { to, message } = params;
        const accessToken = decrypt(config.accessToken);
        const phoneNumberId = config.phoneNumberId || process.env.WHATSAPP_PHONE_ID;
        
        const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: { body: message }
          })
        });
        return await response.json();
      }
      break;
    case 'telegram':
      if (action === 'sendMessage') {
        // Telegram Bot API
        const { chatId, message } = params;
        const botToken = decrypt(config.accessToken); // Using accessToken field for bot token
        
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message
          })
        });
        return await response.json();
      }
      break;
    default:
      throw new Error('Integration not supported');
  }

  return { success: true };
}

export default router;
