import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/audit
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { search, severity, status, limit = '50' } = req.query;
    const where: any = {};

    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { actor: { contains: search as string, mode: 'insensitive' } },
        { action: { contains: search as string, mode: 'insensitive' } },
        { details: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({ logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/audit
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { actor, action, status: logStatus, details, severity } = req.body;

    const log = await prisma.auditLog.create({
      data: {
        actor: actor || req.user!.email,
        action,
        status: logStatus || 'Success',
        details,
        severity: severity || 'Low',
        userId: req.user!.userId,
      },
    });

    res.status(201).json({ log });
  } catch (error) {
    console.error('Create audit log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
