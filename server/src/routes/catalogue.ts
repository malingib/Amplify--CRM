import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { catalogueSchema } from '../types/schemas';

const router = Router();

// GET /api/catalogue
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { search, category, status } = req.query;
    const where: any = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.catalogueItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ items });
  } catch (error) {
    console.error('Get catalogue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/catalogue
router.post('/', authenticate, authorize('ADMIN', 'MANAGER', 'SALES'), async (req: AuthRequest, res: Response) => {
  try {
    const body = catalogueSchema.parse(req.body);
    const item = await prisma.catalogueItem.create({ data: body as any });
    res.status(201).json({ item });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Create catalogue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/catalogue/:id
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER', 'SALES'), async (req: AuthRequest, res: Response) => {
  try {
    const itemId = req.params.id as string;
    const body = catalogueSchema.partial().parse(req.body);
    const item = await prisma.catalogueItem.update({
      where: { id: itemId },
      data: body as any,
    });
    res.json({ item });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Update catalogue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/catalogue/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const itemId = req.params.id as string;
    await prisma.catalogueItem.delete({ where: { id: itemId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete catalogue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
