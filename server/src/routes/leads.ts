import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { leadSchema } from '../types/schemas';
import { broadcastLeadUpdate } from '../websocket';
import { triggerWorkflows } from '../lib/workflowEngine';
import { createCalendarEvent } from '../lib/googleWorkspace';

const router = Router();

// GET /api/leads
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { stage, search, owner } = req.query;
    const where: any = {};

    if (stage) where.stage = stage;
    if (owner) where.ownerId = owner;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      include: { owner: { select: { id: true, name: true, avatar: true } } },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    res.json({ leads });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leads/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const leadId = req.params.id as string;
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        activityLogs: { orderBy: { date: 'desc' } },
        proposals: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    res.json({ lead });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leads
router.post('/', authenticate, authorize('ADMIN', 'MANAGER', 'SALES'), async (req: AuthRequest, res: Response) => {
  try {
    const body = leadSchema.parse(req.body);

    const maxOrder = await prisma.lead.aggregate({ _max: { order: true } });

    const lead = await prisma.lead.create({
      data: {
        ...(body as any),
        ownerId: req.user!.userId,
        order: (maxOrder._max.order ?? -1) + 1,
      },
      include: { owner: { select: { id: true, name: true, avatar: true } } },
    });

    res.status(201).json({ lead });
    try { broadcastLeadUpdate(lead, 'created'); } catch (e: any) { console.warn('Broadcast failed:', e.message); }
    try { triggerWorkflows('lead_created', { lead }); } catch (e: any) { console.warn('Workflow trigger failed:', e.message); }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/leads/:id
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER', 'SALES'), async (req: AuthRequest, res: Response) => {
  try {
    const leadId = req.params.id as string;
    const body = leadSchema.partial().parse(req.body);

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: body as any,
      include: { owner: { select: { id: true, name: true, avatar: true } } },
    });

    res.json({ lead });
    try { broadcastLeadUpdate(lead, 'updated'); } catch (e: any) { console.warn('Broadcast failed:', e.message); }
    if (body.stage) {
      try { broadcastLeadUpdate(lead, 'stage_changed'); } catch (e: any) { console.warn('Broadcast failed:', e.message); }
      try { triggerWorkflows('lead_stage_changed', { lead, oldStage: undefined, newStage: body.stage }); } catch (e: any) { console.warn('Workflow trigger failed:', e.message); }

      // Auto-create calendar event for Proposal/Negotiation stages
      if (body.stage === 'PROPOSAL' || body.stage === 'NEGOTIATION') {
        const stageLabel = body.stage === 'PROPOSAL' ? 'Proposal Review' : 'Negotiation Meeting';
        createCalendarEvent({
          summary: `[CRM] ${stageLabel} — ${lead.name} (${lead.company})`,
          description: `Lead: ${lead.name}\nCompany: ${lead.company}\nValue: KES ${lead.value.toLocaleString()}\nStage: ${body.stage}\n\nNotes: ${lead.notes || 'No notes'}`,
          startTime: new Date(Date.now() + 86400000).toISOString(),
          attendees: lead.email ? [{ email: lead.email }] : undefined,
          conferenceData: true,
        }).catch((err: any) => console.warn('Calendar event creation failed:', err.message));
      }
    }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/leads/:id
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const leadId = req.params.id as string;
    await prisma.lead.delete({ where: { id: leadId } });
    broadcastLeadUpdate({ id: leadId }, 'deleted');
    res.json({ success: true });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/leads/reorder/batch
router.put('/reorder/batch', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      res.status(400).json({ error: 'updates must be an array' });
      return;
    }

    await prisma.$transaction(
      updates.map((u: { id: string; order: number }) =>
        prisma.lead.update({ where: { id: u.id }, data: { order: u.order } })
      )
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leads/:id/activity
router.post('/:id/activity', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const leadId = req.params.id as string;
    const { type, content } = req.body;
    const log = await prisma.activityLog.create({
      data: {
        type: type || 'Note',
        content,
        performedBy: req.user!.email,
        leadId: leadId,
      },
    });
    res.status(201).json({ log });
  } catch (error) {
    console.error('Add activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
