import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/insights', async (_req: AuthRequest, res: Response) => {
  try {
    const [leads, overdue, staleTasks] = await Promise.all([
      prisma.lead.findMany({ select: { id: true, name: true, company: true, value: true, stage: true, probability: true, lastContact: true }, orderBy: { value: 'desc' } }),
      prisma.invoice.findMany({ where: { status: { not: 'Paid' }, dueDate: { lt: new Date() } }, include: { client: { select: { id: true, name: true, company: true } } }, orderBy: { amount: 'desc' }, take: 10 }),
      prisma.task.findMany({ where: { status: { not: 'Done' }, dueDate: { lt: new Date() } }, orderBy: { dueDate: 'asc' }, take: 10 }),
    ]);
    const open = leads.filter(l => !['CLOSED', 'LOST'].includes(l.stage));
    const opportunities = open.filter(l => l.probability >= 60).slice(0, 10).map(l => ({ type: 'opportunity', priority: 'high', leadId: l.id, title: `${l.company || l.name} is a high-probability opportunity`, reason: `${l.probability}% probability on a ${l.value} pipeline deal` }));
    const followups = open.filter(l => !l.lastContact || Date.now() - new Date(l.lastContact).getTime() > 7 * 86400000).slice(0, 10).map(l => ({ type: 'follow_up', priority: 'medium', leadId: l.id, title: `Follow up with ${l.company || l.name}`, reason: l.lastContact ? 'No contact recorded in the last 7 days' : 'No contact date recorded' }));
    const collections = overdue.slice(0, 10).map(i => ({ type: 'collection', priority: 'high', clientId: i.client.id, title: `Collect ${i.amount} from ${i.client.company || i.client.name}`, reason: `Invoice ${i.invoiceNumber} is overdue` }));
    const tasks = staleTasks.map(t => ({ type: 'task', priority: 'medium', taskId: t.id, title: `Resolve overdue task: ${t.title}`, reason: 'Due date has passed and task is not complete' }));
    res.json({ insights: [...collections, ...opportunities, ...followups, ...tasks].slice(0, 30) });
  } catch (error) { console.error('AI insights error:', error); res.status(500).json({ error: 'Unable to generate insights' }); }
});

export default router;
