import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { config } from '../config';

const router = Router();

const EVOLUTION_BASE = config.evolution.url;
const EVOLUTION_KEY = config.evolution.apiKey;

async function evoFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${EVOLUTION_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': EVOLUTION_KEY,
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, { ...options, headers });
  return res.json();
}

// GET /api/whatsapp/instances
router.get('/instances', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const instances = await prisma.whatsAppSession.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ instances });
  } catch (error) {
    console.error('Get WhatsApp instances error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/whatsapp/instances
router.post('/instances', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { instanceName, phone } = req.body;

    if (!instanceName) {
      res.status(400).json({ error: 'instanceName is required' });
      return;
    }

    const evoResult = await evoFetch('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
        reject_call: false,
        always_online: true,
      }),
    });

    const session = await prisma.whatsAppSession.create({
      data: {
        instanceName,
        phone: phone || null,
        status: 'pairing',
      },
    });

    res.status(201).json({ session, evolution: evoResult });
  } catch (error) {
    console.error('Create WhatsApp instance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/whatsapp/instances/:name/qr
router.get('/instances/:name/qr', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const instanceName = req.params.name as string;
    const evoResult = await evoFetch(`/instance/connect/${instanceName}`);
    res.json(evoResult);
  } catch (error) {
    console.error('Get QR error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/whatsapp/instances/:name/status
router.get('/instances/:name/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const instanceName = req.params.name as string;
    const evoResult = await evoFetch(`/instance/connectionState/${instanceName}`);

    const status = evoResult.state === 'open' ? 'connected' : 'disconnected';
    await prisma.whatsAppSession.updateMany({
      where: { instanceName },
      data: { status, lastActive: status === 'connected' ? new Date() : undefined },
    });

    res.json({ status, details: evoResult });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/whatsapp/send
router.post('/send', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { instanceName, to, message, type = 'text' } = req.body;

    if (!instanceName || !to || !message) {
      res.status(400).json({ error: 'instanceName, to, and message are required' });
      return;
    }

    const evoResult = await evoFetch(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: to,
        text: message,
      }),
    });

    res.json({ success: true, result: evoResult });
  } catch (error) {
    console.error('Send WhatsApp error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/whatsapp/webhook
router.post('/webhook', async (req: AuthRequest, res: Response) => {
  try {
    const event = req.body;

    // Verify webhook secret if configured
    const whSecret = config.evolution.apiKey;
    const providedSecret = req.headers['x-webhook-secret'] as string;
    if (whSecret && providedSecret && providedSecret !== whSecret) {
      res.status(401).json({ error: 'Invalid webhook secret' });
      return;
    }

    console.log('WhatsApp webhook received:', event.event, event.instance);

    switch (event.event) {
      case 'messages.upsert':
        console.log('New message from:', event.data?.key?.remoteJid);
        break;
      case 'connection.update':
        if (event.data?.state === 'open') {
          await prisma.whatsAppSession.updateMany({
            where: { instanceName: event.instance },
            data: { status: 'connected', lastActive: new Date() },
          });
        } else if (event.data?.state === 'close') {
          await prisma.whatsAppSession.updateMany({
            where: { instanceName: event.instance },
            data: { status: 'disconnected' },
          });
        }
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/whatsapp/instances/:name
router.delete('/instances/:name', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const instanceName = req.params.name as string;
    await evoFetch(`/instance/delete/${instanceName}`, { method: 'DELETE' });
    await prisma.whatsAppSession.deleteMany({ where: { instanceName } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete WhatsApp instance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
