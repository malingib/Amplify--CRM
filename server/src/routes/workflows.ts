import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { workflowSchema } from '../types/schemas';
import { triggerWorkflows } from '../lib/workflowEngine';

const router = Router();

// GET /api/workflows
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const workflows = await prisma.workflow.findMany({
      include: { executions: { orderBy: { executedAt: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ workflows });
  } catch (error) {
    console.error('Get workflows error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/workflows
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const body = workflowSchema.parse(req.body);
    const workflow = await prisma.workflow.create({
      data: { ...(body as any), creatorId: req.user!.userId },
    });
    res.status(201).json({ workflow });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Create workflow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/workflows/:id
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const workflowId = req.params.id as string;
    const body = workflowSchema.partial().parse(req.body);
    const workflow = await prisma.workflow.update({
      where: { id: workflowId },
      data: body as any,
    });
    res.json({ workflow });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Update workflow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/workflows/:id/toggle
router.put('/:id/toggle', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const workflowId = req.params.id as string;
    const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    const updated = await prisma.workflow.update({
      where: { id: workflowId },
      data: { enabled: !workflow.enabled },
    });
    res.json({ workflow: updated });
  } catch (error) {
    console.error('Toggle workflow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/workflows/:id
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const workflowId = req.params.id as string;
    await prisma.workflow.delete({ where: { id: workflowId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete workflow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/workflows/trigger
router.post('/trigger', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { triggerType, data } = req.body;
    await triggerWorkflows(triggerType, data);
    res.json({ success: true });
  } catch (error) {
    console.error('Trigger workflows error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
