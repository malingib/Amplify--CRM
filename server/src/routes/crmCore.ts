import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { broadcastLeadUpdate } from '../websocket';
import { DealStage } from '@prisma/client';

const router = Router();
const SALES_ROLES = ['ADMIN', 'MANAGER', 'SALES'];
const stageWeights: Record<string, number> = { INTAKE: 0.1, QUALIFIED: 0.35, PROPOSAL: 0.6, NEGOTIATION: 0.8, CLOSED: 1, LOST: 0 };

router.get('/command-center', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const where = req.user?.role === 'SALES' ? { ownerId: req.user.userId } : {};
    const [leads, tasks, clients] = await Promise.all([
      prisma.lead.findMany({ where, orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] }),
      prisma.task.findMany({ where: req.user?.role === 'SALES' ? { assigneeId: req.user.userId } : {}, orderBy: { dueDate: 'asc' }, take: 100 }),
      prisma.client.findMany({ orderBy: { updatedAt: 'desc' }, take: 100 }),
    ]);
    const openLeads = leads.filter(l => !['CLOSED', 'LOST'].includes(l.stage));
    const pipelineValue = openLeads.reduce((sum, l) => sum + l.value, 0);
    const weightedPipeline = openLeads.reduce((sum, l) => sum + l.value * (l.probability / 100), 0);
    const wonRevenue = leads.filter(l => l.stage === 'CLOSED').reduce((sum, l) => sum + l.value, 0);
    const overdueTasks = tasks.filter(t => t.status !== 'Done' && t.dueDate < new Date()).length;
    res.json({ metrics: { pipelineValue, weightedPipeline, wonRevenue, openDeals: openLeads.length, overdueTasks, activeClients: clients.filter(c => c.status === 'Active').length }, stages: Object.keys(stageWeights).map(stage => ({ stage, count: leads.filter(l => l.stage === stage).length, value: leads.filter(l => l.stage === stage).reduce((sum, l) => sum + l.value, 0), weightedValue: leads.filter(l => l.stage === stage).reduce((sum, l) => sum + l.value * (l.probability / 100), 0) })), leads, tasks });
  } catch (error) { console.error('CRM command center error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/duplicates', authenticate, authorize(...SALES_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const { email, phone, company, name, excludeId } = req.query as Record<string, string | undefined>;
    const clauses: any[] = [];
    if (email) clauses.push({ email }); if (phone) clauses.push({ phone }); if (company && name) clauses.push({ company, name });
    if (!clauses.length) return res.json({ duplicates: [] });
    const duplicates = await prisma.lead.findMany({ where: { OR: clauses, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, include: { owner: { select: { id: true, name: true, avatar: true } } }, take: 25 });
    res.json({ duplicates });
  } catch (error) { console.error('Duplicate check error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/bulk/leads', authenticate, authorize(...SALES_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const { ids, stage, probability, ownerId } = req.body as { ids?: string[]; stage?: string; probability?: number; ownerId?: string | null };
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100) return res.status(400).json({ error: 'ids must contain between 1 and 100 leads' });
    if (!stage && probability === undefined && ownerId === undefined) return res.status(400).json({ error: 'No bulk changes supplied' });
    const data: any = {};
    if (stage) { if (!Object.keys(stageWeights).includes(stage)) return res.status(400).json({ error: 'Invalid stage' }); data.stage = stage as DealStage; }
    if (probability !== undefined) { if (!Number.isInteger(probability) || probability < 0 || probability > 100) return res.status(400).json({ error: 'Probability must be 0-100' }); data.probability = probability; }
    if (ownerId !== undefined) data.ownerId = ownerId;
    await prisma.$transaction(ids.map(id => prisma.lead.update({ where: { id }, data })));
    res.json({ success: true, updated: ids.length });
  } catch (error) { console.error('Bulk lead update error:', error); res.status(500).json({ error: 'Bulk update failed' }); }
});

router.get('/forecast', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const where = req.user?.role === 'SALES' ? { ownerId: req.user.userId } : {};
    const leads = await prisma.lead.findMany({ where, include: { owner: { select: { id: true, name: true } } } });
    const open = leads.filter(l => !['CLOSED', 'LOST'].includes(l.stage));
    const byStage = Object.keys(stageWeights).filter(s => s !== 'CLOSED' && s !== 'LOST').map(stage => { const items = open.filter(l => l.stage === stage); return { stage, count: items.length, value: items.reduce((s, l) => s + l.value, 0), weightedValue: items.reduce((s, l) => s + l.value * l.probability / 100, 0) }; });
    const byOwner = Array.from(new Map(open.map(l => [l.ownerId || 'unassigned', l.owner])).entries()).map(([ownerId, owner]) => { const items = open.filter(l => (l.ownerId || 'unassigned') === ownerId); return { ownerId, ownerName: owner?.name || 'Unassigned', value: items.reduce((s, l) => s + l.value, 0), weightedValue: items.reduce((s, l) => s + l.value * l.probability / 100, 0), count: items.length }; });
    res.json({ forecast: { totalValue: open.reduce((s, l) => s + l.value, 0), weightedValue: open.reduce((s, l) => s + l.value * l.probability / 100, 0), byStage, byOwner } });
  } catch (error) { console.error('Forecast error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/communications/log', authenticate, authorize(...SALES_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const { leadId, type, direction, content, status = 'logged' } = req.body as { leadId: string; type?: string; direction?: 'inbound' | 'outbound'; content: string; status?: string };
    if (!leadId || !content?.trim()) return res.status(400).json({ error: 'leadId and content are required' });
    const lead = await prisma.lead.findUnique({ where: { id: leadId } }); if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const channel = (type || 'Note').trim(); const prefix = `[${channel}${direction ? ` • ${direction}` : ''} • ${status}]`;
    const log = await prisma.activityLog.create({ data: { leadId, type: 'Note', content: `${prefix} ${content.trim()}`, performedBy: req.user!.email } });
    await prisma.lead.update({ where: { id: leadId }, data: { lastContact: new Date() } }); res.status(201).json({ log });
  } catch (error) { console.error('Communication log error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/communications/templates', authenticate, async (_req: AuthRequest, res: Response) => {
  res.json({ templates: [
    { id: 'follow-up', name: 'Follow-up', channels: ['email', 'whatsapp', 'telegram'], content: 'Hi {{name}}, just following up on our conversation about {{company}}. Would you be available for a quick update this week?' },
    { id: 'proposal', name: 'Proposal follow-up', channels: ['email', 'whatsapp'], content: 'Hi {{name}}, I wanted to check whether you had a chance to review the proposal. I am happy to clarify anything or schedule a review call.' },
    { id: 'meeting', name: 'Meeting confirmation', channels: ['email', 'whatsapp', 'telegram'], content: 'Hi {{name}}, confirming our meeting regarding {{company}}. Please let me know if the scheduled time still works for you.' },
  ] });
});

router.post('/leads/:id/move', authenticate, authorize(...SALES_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const { stage, probability } = req.body as { stage: string; probability?: number };
    if (!Object.keys(stageWeights).includes(stage)) return res.status(400).json({ error: 'Invalid stage' });
    const leadId = String(req.params.id); const current = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!current) return res.status(404).json({ error: 'Lead not found' });
    const nextProbability = probability ?? Math.round(stageWeights[stage] * 100);
    const lead = await prisma.lead.update({ where: { id: current.id }, data: { stage: stage as DealStage, probability: nextProbability } });
    await prisma.activityLog.create({ data: { leadId: lead.id, type: 'System', content: `Stage changed from ${current.stage} to ${stage} (${nextProbability}%).`, performedBy: req.user!.email } });
    broadcastLeadUpdate(lead, 'stage_changed'); res.json({ lead });
  } catch (error) { console.error('Lead move error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
