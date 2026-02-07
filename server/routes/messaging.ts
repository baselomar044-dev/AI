// ============================================
// 📱 MESSAGING ROUTES - WhatsApp & Telegram
// FREE integrations for messaging platforms
// ============================================

import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

// ============================================
// WHATSAPP BUSINESS API (FREE via Meta Business)
// ============================================

/**
 * Webhook verification for WhatsApp
 * Required by Meta to verify your webhook URL
 */
router.get('/whatsapp/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }

  console.warn('❌ WhatsApp webhook verification failed');
  return res.sendStatus(403);
});

/**
 * Receive incoming WhatsApp messages
 */
router.post('/whatsapp/webhook', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Verify this is a WhatsApp message event
    if (body.object !== 'whatsapp_business_account') {
      return res.sendStatus(404);
    }

    // Process each entry
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        const messages = value.messages || [];

        for (const message of messages) {
          const from = message.from; // Sender's phone number
          const msgType = message.type;
          const timestamp = message.timestamp;

          let content = '';
          if (msgType === 'text') {
            content = message.text?.body || '';
          } else if (msgType === 'image') {
            content = '[Image received]';
          } else if (msgType === 'audio') {
            content = '[Audio received]';
          } else if (msgType === 'document') {
            content = '[Document received]';
          }

          console.log(`📱 WhatsApp message from ${from}: ${content}`);

          // TODO: Process message with AI and auto-respond
          // You can integrate with your AI here
        }
      }
    }

    // Always respond with 200 to acknowledge receipt
    res.sendStatus(200);
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.sendStatus(500);
  }
});

/**
 * Send WhatsApp message
 */
router.post('/whatsapp/send', async (req: Request, res: Response) => {
  try {
    const { to, message, templateName, templateParams } = req.body;

    if (!to || (!message && !templateName)) {
      return res.status(400).json({ error: 'Phone number and message/template required' });
    }

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_ID;

    if (!accessToken || !phoneNumberId) {
      return res.status(500).json({ error: 'WhatsApp not configured' });
    }

    // Format phone number (remove + and spaces)
    const formattedPhone = to.replace(/[+\s-]/g, '');

    let payload: any;

    if (templateName) {
      // Send template message (required for first contact)
      payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: templateParams ? [
            {
              type: 'body',
              parameters: templateParams.map((p: string) => ({ type: 'text', text: p })),
            },
          ] : [],
        },
      };
    } else {
      // Send text message (only works after user initiated conversation)
      payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message },
      };
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', data);
      return res.status(response.status).json({ 
        error: data.error?.message || 'Failed to send message',
        details: data 
      });
    }

    res.json({
      success: true,
      messageId: data.messages?.[0]?.id,
      data,
    });
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get WhatsApp templates
 */
router.get('/whatsapp/templates', async (req: Request, res: Response) => {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !businessAccountId) {
      return res.status(500).json({ error: 'WhatsApp not configured' });
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${businessAccountId}/message_templates`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message });
    }

    res.json({ templates: data.data || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TELEGRAM BOT API (FREE)
// ============================================

/**
 * Set up Telegram webhook
 */
router.post('/telegram/setup-webhook', async (req: Request, res: Response) => {
  try {
    const { webhookUrl } = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return res.status(500).json({ error: 'Telegram bot token not configured' });
    }

    const url = webhookUrl || `${process.env.API_URL}/api/messaging/telegram/webhook`;

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      }
    );

    const data = await response.json();

    if (!data.ok) {
      return res.status(400).json({ error: data.description });
    }

    res.json({ success: true, message: 'Webhook set successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Receive incoming Telegram messages (webhook)
 */
router.post('/telegram/webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body;

    // Handle different update types
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text || '';
      const from = message.from;

      console.log(`📱 Telegram message from ${from.first_name} (${chatId}): ${text}`);

      // Handle commands
      if (text.startsWith('/start')) {
        await sendTelegramMessage(
          chatId,
          `مرحباً ${from.first_name}! 👋\n\nأنا Try-It! المساعد الذكي. يمكنني مساعدتك في:\n• الإجابة على الأسئلة\n• البحث في الويب\n• إنشاء المستندات\n• والمزيد!\n\nأرسل لي أي رسالة للبدء.`
        );
      } else if (text.startsWith('/help')) {
        await sendTelegramMessage(
          chatId,
          `📚 المساعدة:\n\n/start - بدء المحادثة\n/help - عرض المساعدة\n/status - حالة الخدمة\n\nأو أرسل أي رسالة للتحدث معي!`
        );
      } else if (text.startsWith('/status')) {
        await sendTelegramMessage(chatId, `✅ الخدمة تعمل بشكل طبيعي!`);
      } else {
        // Process with AI (you can integrate your AI here)
        // For now, just acknowledge
        // await processWithAI(chatId, text);
      }
    }

    // Callback queries (button presses)
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message.chat.id;
      const data = callbackQuery.data;

      // Handle button callbacks
      console.log(`📱 Telegram callback: ${data}`);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.sendStatus(200); // Always return 200 to prevent retries
  }
});

/**
 * Send Telegram message
 */
router.post('/telegram/send', async (req: Request, res: Response) => {
  try {
    const { chatId, message, parseMode, replyMarkup } = req.body;

    if (!chatId || !message) {
      return res.status(400).json({ error: 'chatId and message required' });
    }

    const result = await sendTelegramMessage(chatId, message, parseMode, replyMarkup);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send Telegram photo
 */
router.post('/telegram/send-photo', async (req: Request, res: Response) => {
  try {
    const { chatId, photoUrl, caption } = req.body;

    if (!chatId || !photoUrl) {
      return res.status(400).json({ error: 'chatId and photoUrl required' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: 'Telegram bot token not configured' });
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoUrl,
          caption,
        }),
      }
    );

    const data = await response.json();

    if (!data.ok) {
      return res.status(400).json({ error: data.description });
    }

    res.json({ success: true, messageId: data.result.message_id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Telegram bot info
 */
router.get('/telegram/me', async (req: Request, res: Response) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: 'Telegram bot token not configured' });
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json();

    if (!data.ok) {
      return res.status(400).json({ error: data.description });
    }

    res.json({ bot: data.result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get webhook info
 */
router.get('/telegram/webhook-info', async (req: Request, res: Response) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: 'Telegram bot token not configured' });
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const data = await response.json();

    res.json(data.result || data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  parseMode?: string,
  replyMarkup?: any
): Promise<any> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error('Telegram bot token not configured');
  }

  const payload: any = {
    chat_id: chatId,
    text,
  };

  if (parseMode) {
    payload.parse_mode = parseMode;
  }

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.description || 'Failed to send message');
  }

  return { success: true, messageId: data.result.message_id, data: data.result };
}

// ============================================
// STATUS ENDPOINT
// ============================================

router.get('/status', (req: Request, res: Response) => {
  const whatsappConfigured = !!(
    process.env.WHATSAPP_ACCESS_TOKEN && 
    process.env.WHATSAPP_PHONE_ID
  );
  
  const telegramConfigured = !!process.env.TELEGRAM_BOT_TOKEN;

  res.json({
    whatsapp: {
      configured: whatsappConfigured,
      features: ['send', 'receive', 'templates', 'media'],
    },
    telegram: {
      configured: telegramConfigured,
      features: ['send', 'receive', 'photos', 'buttons', 'webhooks'],
    },
  });
});

export default router;
