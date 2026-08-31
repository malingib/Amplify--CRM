import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { invoiceSchema } from '../types/schemas';
import { broadcastInvoiceUpdate } from '../websocket';
import { triggerWorkflows } from '../lib/workflowEngine';

const router = Router();

// GET /api/invoices
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, clientId } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, company: true } },
        items: true,
      },
      orderBy: { date: 'desc' },
    });

    res.json({ invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/invoices
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const body = invoiceSchema.parse(req.body);

    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: body.clientId,
        amount: body.amount,
        dueDate: new Date(body.dueDate),
        items: body.items ? {
          create: body.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            catalogueItemId: item.catalogueItemId,
          })),
        } : undefined,
      } as any,
      include: {
        client: { select: { id: true, name: true, company: true } },
        items: true,
      },
    });

    res.status(201).json({ invoice });
    broadcastInvoiceUpdate(invoice, 'created');
    triggerWorkflows('invoice_created', { invoice });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/invoices/:id
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const invoiceId = req.params.id as string;
    const { status, etimsCompliant, cuSerialNumber, transmissionStatus } = req.body;
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        ...(status && { status }),
        ...(etimsCompliant !== undefined && { etimsCompliant }),
        ...(cuSerialNumber && { cuSerialNumber }),
        ...(transmissionStatus && { transmissionStatus }),
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        items: true,
      },
    });
    res.json({ invoice });
    broadcastInvoiceUpdate(invoice, 'updated');
    if (status === 'Paid') {
      broadcastInvoiceUpdate(invoice, 'paid');
      triggerWorkflows('invoice_paid', { invoice });
    }
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/invoices/:id/pay (Paystack)
router.post('/:id/pay', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const invoiceId = req.params.id as string;
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true },
    });

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: invoice.client.email,
        amount: Math.round(invoice.amount * 100),
        reference: invoice.invoiceNumber,
        metadata: { invoiceId: invoice.id },
      }),
    });

    const data: any = await response.json();

    if (data.status) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { paymentLink: data.data.authorization_url },
      });
      res.json({ authorization_url: data.data.authorization_url, reference: data.data.reference });
    } else {
      res.status(400).json({ error: 'Payment initialization failed', details: data.message });
    }
  } catch (error) {
    console.error('Pay invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
