import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/lead-lifecycle/:id/convert
router.post('/:id/convert', authenticate, authorize('ADMIN', 'MANAGER', 'SALES'), async (req: AuthRequest, res: Response) => {
  try {
    const leadId = req.params.id as string;
    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id: leadId } });

      if (!lead) return null;

      const existing = await tx.client.findFirst({
        where: {
          OR: [
            ...(lead.email ? [{ email: lead.email }] : []),
            { company: lead.company, name: lead.name },
          ],
        },
      });

      const client = existing ?? await tx.client.create({
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

      await tx.lead.update({
        where: { id: lead.id },
        data: { stage: 'CLOSED', probability: 100 },
      });

      await tx.activityLog.create({
        data: {
          type: 'System',
          content: existing
            ? `Lead converted to existing client: ${client.name} (${client.company})`
            : `Lead converted to client: ${client.name} (${client.company})`,
          performedBy: req.user!.email,
          leadId: lead.id,
        },
      });

      return { client, created: !existing, leadId: lead.id };
    });

    if (!result) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    res.status(result.created ? 201 : 200).json(result);
  } catch (error) {
    console.error('Lead conversion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
