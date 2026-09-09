import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { broadcastLeadUpdate } from '../websocket';
import { DealStage } from '@prisma/client';

const router = Router();
const SALES_ROLES = ['ADMIN', 'MANAGER', 'SALES'];

const stageWeights: Record<string, number> = {
  INTAKE: 0.1,
  QUALIFIED: 0.35,
  PROPOSAL: 0.6,
  NEGOTIATION: 0.8,
  CLOSED: 1,
  LOST: 0,
};

// Phase 2: CRM command-center metrics.
router.get('/command-center', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const leads = await prisma.lead.findMany({ select: { id: true, name: true, company: true, value: true, stage: true, probability: true, ownerId: true, lastContact: true } });
    const open = leads.filter(l => !['CLOSED', 'LOST'].includes(l.stage));
    const won = leads.filter(l => l.stage === 'CLOSED');
    const pipelineValue = open.reduce((sum, l) => sum + l.value, 0);
    const weightedPipeline = open.reduce((sum, l) => sum + l.value * (l.probability / 100), 0);
    const duplicates = new Set<string>();
    const seen = new Map<string, string>();
    for (const lead of leads) {
      const key = `${lead.company.trim().toLowerCase()}|${lead.name.trim().toLowerCase()}`;
      if (seen.has(key)) duplicates.add(lead.id); else seen.set(key, lead.id);
    }
    res.json({ metrics: { totalLeads: leads.length, openDeals: open.length, pipelineValue, weightedPipeline, wonRevenue: won.reduce((s, l) => s + l.value, 0), duplicateCount: duplicates.size }, leads });
  } catch (error) { console.error('CRM command center error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

// Phase 3: forecast by stage and owner.
router.get('/forecast', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const leads = await prisma.lead.findMany({ select: { id: true, value: true, stage: true, probability: true, ownerId: true, owner: { select: { id: true, name: true, email: true } } } });
    const byStage: Record<string, { value: number; weighted: number; count: number }> = {};
    const byOwner: Record<string, { ownerId: string; ownerName: string; value: number; weighted: number; count: number }> = {};
    for (const lead of leads) {
      const key = lead.stage;
      byStage[key] ||= { value: 0, weighted: 0, count: 0 };
      byStage[key].value += lead.value; byStage[key].weighted += lead.value * lead.probability / 100; byStage[key].count += 1;
      const ownerId = lead.ownerId || 'unassigned';
      byOwner[ownerId] ||= { ownerId, ownerName: lead.owner?.name || 'Unassigned', value: 0, weighted: 0, count: 0 };
      byOwner[ownerId].value += lead.value; byOwner[ownerId].weighted += lead.value * lead.probability / 100; byOwner[ownerId].count += 1;
    }
    res.json({ byStage, byOwner: Object.values(byOwner), totalValue: leads.reduce((s, l) => s + l.value, 0), weightedValue: leads.reduce((s, l) => s + l.value * l.probability / 100, 0) });
  } catch (error) { console.error('CRM forecast error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

// Phase 2: duplicate candidates.
router.get('/duplicates', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'asc' } });
    const groups = new Map<string, typeof leads>();
    for (const lead of leads) {
      const keys = [lead.email?.trim().toLowerCase(), `${lead.company.trim().toLowerCase()}|${lead.name.trim().toLowerCase()}`].filter(Boolean) as string[];
      for (const key of keys) { if (!groups.has(key)) groups.set(key, []); groups.get(key)!.push(lead); }
    }
    const duplicates = [...groups.entries()].filter(([, group]) => group.length > 1).map(([key, group]) => ({ key, leads: group }));
    res.json({ duplicates });
  } catch (error) { console.error('CRM duplicates error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

// Phase 2: controlled bulk lead updates.
router.post('/leads/bulk', authenticate, authorize(...SALES_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id: unknown): id is string => typeof id === 'string') : [];
    const updates = req.body?.updates && typeof req.body.updates === 'object' ? req.body.updates : {};
    if (!ids.length || ids.length > 100) return res.status(400).json({ error: 'Provide between 1 and 100 lead ids' });
    const allowed = ['stage', 'probability', 'ownerId'] as const;
    const data: Record<string, unknown> = {};
    for (const field of allowed) if (updates[field] !== undefined) data[field] = updates[field];
    if (!Object.keys(data).length) return res.status(400).json({ error: 'No supported updates supplied' });
    if (data.stage !== undefined && typeof data.stage === 'string' && !Object.keys(stageWeights).includes(data.stage)) return res.status(400).json({ error: 'Invalid stage' });
    if (data.probability !== undefined && (typeof data.probability !== 'number' || data.probability < 0 || data.probability > 100)) return res.status(400).json({ error: 'Probability must be between 0 and 100' });
    const result = await prisma.lead.updateMany({ where: { id: { in: ids } }, data: data as any });
    res.json({ updated: result.count });
  } catch (error) { console.error('CRM bulk lead error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

// Phase 4: reusable channel-aware message templates.
router.get('/communications/templates', authenticate, async (_req: AuthRequest, res: Response) => {
  res.json({ templates: [
    { id: 'follow-up', name: 'Follow-up', channels: ['email', 'whatsapp', 'telegram'], content: 'Hi {{name}}, just following up on our conversation about {{company}}. Would you be available for a quick update this week?' },
    { id: 'proposal', name: 'Proposal follow-up', channels: ['email', 'whatsapp'], content: 'Hi {{name}}, I wanted to check whether you had a chance to review the proposal. I am happy to clarify anything or schedule a review call.' },
    { id: 'meeting', name: 'Meeting confirmation', channels: ['email', 'whatsapp', 'telegram'], content: 'Hi {{name}}, confirming our meeting regarding {{company}}. Please let me know if the scheduled time still works for you.' },
  ] });
});

// Phase 3: stage movement helper with audit activity and real-time notification.
router.post('/leads/:id/move', authenticate, authorize(...SALES_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const { stage, probability } = req.body as { stage: string; probability?: number };
    if (!Object.keys(stageWeights).includes(stage)) return res.status(400).json({ error: 'Invalid stage' });
    const leadId = String(req.params.id);
    const current = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!current) return res.status(404).json({ error: 'Lead not found' });
    const nextProbability = probability ?? Math.round(stageWeights[stage] * 100);
    const lead = await prisma.lead.update({ where: { id: current.id }, data: { stage: stage as DealStage, probability: nextProbability } });
    await prisma.activityLog.create({ data: { leadId: lead.id, type: 'System', content: `Stage changed from ${current.stage} to ${stage} (${nextProbability}%).`, performedBy: req.user!.email } });
    broadcastLeadUpdate(lead, 'stage_changed');
    res.json({ lead });
  } catch (error) { console.error('Lead move error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
