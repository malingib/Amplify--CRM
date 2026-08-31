import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { telegramConfigSchema } from '../types/schemas';

const router = Router();

// GET /api/telegram/config
router.get('/config', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const raw = await prisma.telegramConfig.findFirst();
    if (!raw) {
      res.json({ config: { isActive: false } });
      return;
    }
    const masked = {
      ...raw,
      botToken: raw.botToken ? raw.botToken.slice(0, 8) + '...' + raw.botToken.slice(-4) : null,
      isActive: raw.isActive,
    };
    res.json({ config: masked });
  } catch (error) {
    console.error('Get Telegram config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/telegram/config
router.put('/config', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const body = telegramConfigSchema.parse(req.body);

    const existing = await prisma.telegramConfig.findFirst();

    let config;
    if (existing) {
      config = await prisma.telegramConfig.update({
        where: { id: existing.id },
        data: body as any,
      });
    } else {
      config = await prisma.telegramConfig.create({ data: body as any });
    }

    res.json({ config });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Update Telegram config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/telegram/test
router.post('/test', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const tgConfig = await prisma.telegramConfig.findFirst();
    if (!tgConfig || !tgConfig.botToken) {
      res.status(400).json({ error: 'Telegram bot token not configured' });
      return;
    }

    const response = await fetch(`https://api.telegram.org/bot${tgConfig.botToken}/getMe`);
    const data: any = await response.json();

    if (data.ok) {
      await prisma.telegramConfig.update({
        where: { id: tgConfig.id },
        data: { isActive: true, botName: data.result.first_name },
      });
      res.json({ success: true, bot: data.result });
    } else {
      res.status(400).json({ error: 'Bot token invalid', details: data.description });
    }
  } catch (error) {
    console.error('Test Telegram error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/telegram/send
router.post('/send', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { chatId, message } = req.body;

    const tgConfig = await prisma.telegramConfig.findFirst();
    if (!tgConfig || !tgConfig.botToken) {
      res.status(400).json({ error: 'Telegram not configured' });
      return;
    }

    const targetChatId = chatId || tgConfig.chatId;
    if (!targetChatId) {
      res.status(400).json({ error: 'No chat ID provided or configured' });
      return;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${tgConfig.botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    const data: any = await response.json();

    if (data.ok) {
      res.json({ success: true, messageId: data.result.message_id });
    } else {
      res.status(400).json({ error: 'Failed to send', details: data.description });
    }
  } catch (error) {
    console.error('Send Telegram error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/telegram/webhook
router.post('/webhook', async (req: AuthRequest, res: Response) => {
  try {
    const update = req.body;

    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const from = update.message.from;

      console.log(`Telegram message from ${from.first_name}: ${text}`);

      const tgConfig = await prisma.telegramConfig.findFirst();
      if (tgConfig && !tgConfig.chatId) {
        await prisma.telegramConfig.update({
          where: { id: tgConfig.id },
          data: { chatId: String(chatId) },
        });
      }

      if (text?.startsWith('/')) {
        const tgConfig2 = await prisma.telegramConfig.findFirst();
        if (!tgConfig2?.botToken) return res.json({ ok: true });

        let reply = '';

        switch (text.split(' ')[0]) {
          case '/start':
            reply = 'Welcome to Amplify CRM Bot! Use /help to see commands.';
            break;
          case '/help':
            reply = [
              '*Amplify CRM Commands:*',
              '/leads - View pipeline summary',
              '/tasks - View pending tasks',
              '/status - System status',
              '/help - Show this help',
            ].join('\n');
            break;
          case '/leads':
            const leadCount = await prisma.lead.count();
            const leadValue = await prisma.lead.aggregate({ _sum: { value: true } });
            reply = `*Pipeline:* ${leadCount} leads\n*Total Value:* KES ${(leadValue._sum.value || 0).toLocaleString()}`;
            break;
          case '/tasks':
            const pendingTasks = await prisma.task.count({ where: { status: { not: 'Done' } } });
            reply = `*Pending Tasks:* ${pendingTasks}`;
            break;
          case '/status':
            reply = '*System Status:*\n• API: Online\n• Database: Connected\n• WhatsApp: Active';
            break;
          default:
            reply = 'Unknown command. Use /help';
        }

        if (reply) {
          await fetch(`https://api.telegram.org/bot${tgConfig2.botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: reply, parse_mode: 'Markdown' }),
          });
        }
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.json({ ok: true });
  }
});

// POST /api/telegram/setwebhook
router.post('/setwebhook', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { webhookUrl } = req.body;
    const tgConfig = await prisma.telegramConfig.findFirst();

    if (!tgConfig?.botToken) {
      res.status(400).json({ error: 'Telegram not configured' });
      return;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${tgConfig.botToken}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `${webhookUrl}/api/telegram/webhook` }),
      }
    );

    const data: any = await response.json();
    res.json({ success: data.ok, details: data.description });
  } catch (error) {
    console.error('Set webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
