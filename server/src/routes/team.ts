import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/team
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        status: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json({ users });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/team/:id/role
router.put('/:id/role', authenticate, authorize('ADMIN', 'SYSTEM_OWNER'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id as string;
    const { role } = req.body;
    const validRoles = ['ADMIN', 'MANAGER', 'SALES', 'VIEWER', 'SYSTEM_OWNER'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({ user });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/team/:id
router.delete('/:id', authenticate, authorize('ADMIN', 'SYSTEM_OWNER'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id as string;
    if (userId === req.user!.userId) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
