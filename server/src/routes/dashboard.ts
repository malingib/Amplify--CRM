import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalLeads,
      leadsByStage,
      totalClients,
      activeClients,
      totalRevenue,
      pendingInvoices,
      overdueInvoices,
      totalTasks,
      pendingTasks,
      completedTasks,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.groupBy({ by: ['stage'], _count: { id: true }, _sum: { value: true } }),
      prisma.client.count(),
      prisma.client.count({ where: { status: 'Active' } }),
      prisma.client.aggregate({ _sum: { totalRevenue: true } }),
      prisma.invoice.count({ where: { status: 'Pending' } }),
      prisma.invoice.count({ where: { status: 'Overdue' } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: { not: 'Done' } } }),
      prisma.task.count({ where: { status: 'Done' } }),
    ]);

    const stageData = leadsByStage.map(s => ({
      stage: s.stage,
      count: s._count.id,
      value: s._sum.value || 0,
    }));

    res.json({
      leads: {
        total: totalLeads,
        byStage: stageData,
      },
      clients: {
        total: totalClients,
        active: activeClients,
      },
      revenue: {
        total: totalRevenue._sum.totalRevenue || 0,
      },
      invoices: {
        pending: pendingInvoices,
        overdue: overdueInvoices,
      },
      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        completed: completedTasks,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/activity
router.get('/activity', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ activity: logs });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/revenue
router.get('/revenue', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Get monthly revenue from invoices
    const invoices = await prisma.invoice.findMany({
      select: { amount: true, date: true, status: true },
      where: { status: 'Paid' },
      orderBy: { date: 'asc' },
    });

    const monthlyRevenue: Record<string, number> = {};
    invoices.forEach(inv => {
      const month = inv.date.toISOString().slice(0, 7); // YYYY-MM
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + inv.amount;
    });

    const revenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    res.json({ revenue: revenueData });
  } catch (error) {
    console.error('Get revenue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
