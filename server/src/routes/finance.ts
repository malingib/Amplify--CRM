import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/summary', async (_req: AuthRequest, res: Response) => {
  try {
    const [invoices, transactions] = await Promise.all([
      prisma.invoice.findMany({ select: { id: true, amount: true, dueDate: true, status: true, date: true } }),
      prisma.transaction.findMany({ select: { amount: true, status: true, date: true } }),
    ]);
    const now = new Date();
    const receivables = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);
    const overdue = invoices.filter(i => i.status !== 'Paid' && new Date(i.dueDate) < now).reduce((s, i) => s + i.amount, 0);
    const paidRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
    const cashReceived = transactions.filter(t => t.status === 'Verified').reduce((s, t) => s + t.amount, 0);
    const unreconciled = transactions.filter(t => t.status !== 'Verified').reduce((s, t) => s + t.amount, 0);
    res.json({ summary: { receivables, overdue, paidRevenue, cashReceived, unreconciled, invoiceCount: invoices.length, transactionCount: transactions.length } });
  } catch (error) { console.error('Finance summary error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/aging', async (_req: AuthRequest, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({ where: { status: { not: 'Paid' } }, include: { client: { select: { id: true, name: true, company: true } } }, orderBy: { dueDate: 'asc' } });
    const now = Date.now();
    const buckets = { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, over90: 0 };
    for (const invoice of invoices) {
      const due = new Date(invoice.dueDate).getTime();
      if (due >= now) {
        buckets.current += invoice.amount;
        continue;
      }
      const days = Math.floor((now - due) / 86400000);
      if (days <= 30) buckets.days1to30 += invoice.amount;
      else if (days <= 60) buckets.days31to60 += invoice.amount;
      else if (days <= 90) buckets.days61to90 += invoice.amount;
      else buckets.over90 += invoice.amount;
    }
    res.json({ buckets, invoices });
  } catch (error) { console.error('Finance aging error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/transactions/:id/reconcile', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    if (transaction.status === 'Verified') return res.json({ transaction, alreadyReconciled: true });

    const updated = await prisma.transaction.update({ where: { id }, data: { status: 'Verified' } });
    await prisma.auditLog.create({ data: { actor: req.user?.email || 'system', action: 'transaction.reconciled', status: 'Success', details: JSON.stringify({ transactionId: updated.id, amount: updated.amount }), severity: 'Low', userId: req.user?.userId } });
    res.json({ transaction: updated, alreadyReconciled: false });
  } catch (error) { console.error('Reconcile error:', error); res.status(500).json({ error: 'Unable to reconcile transaction' }); }
});

export default router;
