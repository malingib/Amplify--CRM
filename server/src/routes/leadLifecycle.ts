import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/lead-lifecycle/:id/convert
router.post('/:id/convert', authenticate, authorize('ADMIN', 'MANAGER', 'SALES'), async (req: AuthRequest, res: Response) => {
  try {
    const leadId = req.params.id as string;
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });

    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    const existing = await prisma.client.findFirst({
      where: {
        OR: [
          ...(lead.email ? [{ email: lead.email }] : []),
          { company: lead.company, name: lead.name },
        ],
      },
    });

    if (existing) {
      if (lead.stage !== 'CLOSED') {
        await prisma.lead.update({ where: { id: lead.id }, data: { stage: 'CLOSED', probability: 100 } });
      }
      res.json({ client: existing, created: false, leadId: lead.id });
      return;
    }

    const client = await prisma.client.create({
      data: {
        name: lead.name,
        company: lead.company,
        email: lead.email || `${lead.id}@placeholder.local`,
        phone: lead.phone || '',
        status: 'Active',
        totalRevenue: lead.value || 0,
        avatar: lead.avatar,
        industry: 'General',
      },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { stage: 'CLOSED', probability: 100 },
    });

    res.status(201).json({ client, created: true, leadId: lead.id });
  } catch (error) {
    console.error('Lead conversion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
