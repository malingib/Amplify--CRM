import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { clientSchema } from '../types/schemas';
import { createContact } from '../lib/googleWorkspace';

const router = Router();

// GET /api/clients
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, industry } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (industry) where.industry = industry;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/clients/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req.params.id as string;
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        invoices: { orderBy: { date: 'desc' } },
        transactions: { orderBy: { date: 'desc' } },
      },
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    res.json({ client });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/clients
router.post('/', authenticate, authorize('ADMIN', 'MANAGER', 'SALES'), async (req: AuthRequest, res: Response) => {
  try {
    const body = clientSchema.parse(req.body);
    const client = await prisma.client.create({ data: body as any });
    // Sync to Google Contacts
    createContact({ name: client.name, email: client.email, phone: client.phone, company: client.company }).catch((err: any) => console.warn('Contact sync skipped:', err.message));
    res.status(201).json({ client });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/clients/:id
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER', 'SALES'), async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req.params.id as string;
    const body = clientSchema.partial().parse(req.body);
    const client = await prisma.client.update({
      where: { id: clientId },
      data: body as any,
    });
    res.json({ client });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req.params.id as string;
    await prisma.client.delete({ where: { id: clientId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
