import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/health', async (_req: AuthRequest, res: Response) => {
  try {
    const [enabled, executions, failed] = await Promise.all([
      prisma.workflow.count({ where: { enabled: true } }),
      prisma.workflowExecution.count(),
      prisma.workflowExecution.count({ where: { status: 'failed' } }),
    ]);
    res.json({ enabled, executions, failed, successRate: executions ? Math.round(((executions - failed) / executions) * 100) : 100 });
  } catch (error) { console.error('Automation health error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/executions', async (_req: AuthRequest, res: Response) => {
  try {
    const executions = await prisma.workflowExecution.findMany({ take: 100, orderBy: { executedAt: 'desc' }, include: { workflow: { select: { id: true, name: true, trigger: true } } } });
    res.json({ executions });
  } catch (error) { console.error('Automation executions error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/run/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const workflow = await prisma.workflow.findUnique({ where: { id: req.params.id as string } });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
    if (!workflow.enabled) return res.status(409).json({ error: 'Workflow is disabled' });
    const execution = await prisma.workflowExecution.create({ data: { workflowId: workflow.id, status: 'success', triggerData: JSON.stringify({ source: 'manual', actor: req.user?.email, payload: req.body || {} }), result: JSON.stringify({ queued: true }) } });
    await prisma.workflow.update({ where: { id: workflow.id }, data: { lastRun: new Date() } });
    res.status(202).json({ execution, queued: true });
  } catch (error) { console.error('Automation run error:', error); res.status(500).json({ error: 'Unable to run workflow' }); }
});

export default router;
