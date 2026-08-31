import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { taskSchema } from '../types/schemas';

const router = Router();

// GET /api/tasks
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, assigneeId, priority } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: { assignee: { select: { id: true, name: true, avatar: true } } },
      orderBy: { dueDate: 'asc' },
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks
router.post('/', authenticate, authorize('ADMIN', 'MANAGER', 'SALES'), async (req: AuthRequest, res: Response) => {
  try {
    const body = taskSchema.parse(req.body);
    const task = await prisma.task.create({
      data: {
        ...(body as any),
        dueDate: new Date(body.dueDate),
        assigneeId: req.user!.userId,
      },
      include: { assignee: { select: { id: true, name: true, avatar: true } } },
    });
    res.status(201).json({ task });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER', 'SALES'), async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.id as string;
    const body = taskSchema.partial().parse(req.body);
    const updateData: any = { ...body };
    if (body.dueDate) updateData.dueDate = new Date(body.dueDate);
    if (body.reminderTime) updateData.reminderTime = new Date(body.reminderTime);

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: { assignee: { select: { id: true, name: true, avatar: true } } },
    });
    res.json({ task });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.id as string;
    await prisma.task.delete({ where: { id: taskId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
