import { PrismaClient, DealStage, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.workflowExecution.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.task.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.client.deleteMany();
  await prisma.catalogueItem.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.whatsAppSession.deleteMany();
  await prisma.telegramConfig.deleteMany();

  // ─── Users ──────────────────────────────────────────────
  const password = await hashPassword('password123');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@amplify.co.ke',
      passwordHash: password,
      name: 'Admin User',
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      phone: '+254700000000',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@amplify.co.ke',
      passwordHash: password,
      name: 'Eva Robinson',
      role: 'MANAGER',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      phone: '+254711111111',
    },
  });

  const sales1 = await prisma.user.create({
    data: {
      email: 'liam@amplify.co.ke',
      passwordHash: password,
      name: 'Liam Johnson',
      role: 'SALES',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100',
      phone: '+254722222222',
    },
  });

  const sales2 = await prisma.user.create({
    data: {
      email: 'sarah@amplify.co.ke',
      passwordHash: password,
      name: 'Sarah Williams',
      role: 'SALES',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      phone: '+254733333333',
    },
  });

  console.log('Users created');

  // ─── Leads ──────────────────────────────────────────────
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        name: 'Wanjiku Trading',
        company: 'Wanjiku Ltd',
        value: 450000,
        stage: 'QUALIFIED',
        probability: 60,
        avatar: 'https://picsum.photos/100/100?random=1',
        email: 'info@wanjiku.co.ke',
        phone: '+254711222333',
        notes: 'Interested in bulk import of textiles. Requires logistics support from Mombasa to Nairobi.',
        source: 'Manual',
        order: 0,
        ownerId: sales1.id,
        lastContact: new Date('2023-10-25'),
      },
    }),
    prisma.lead.create({
      data: {
        name: 'TechSahara',
        company: 'Sahara Systems',
        value: 1200000,
        stage: 'PROPOSAL',
        probability: 80,
        avatar: 'https://picsum.photos/100/100?random=2',
        email: 'procurement@techsahara.com',
        phone: '+254722444555',
        notes: 'Looking for a custom CRM solution with M-Pesa integration.',
        source: 'Referral',
        proposalStatus: 'Sent',
        order: 1,
        ownerId: sales1.id,
        lastContact: new Date('2023-10-26'),
      },
    }),
    prisma.lead.create({
      data: {
        name: 'GreenGrocers',
        company: 'GG Exporters',
        value: 85000,
        stage: 'INTAKE',
        probability: 20,
        avatar: 'https://picsum.photos/100/100?random=3',
        email: 'orders@greengrocers.ke',
        phone: '+254733666777',
        notes: 'Initial inquiry about cold chain logistics software.',
        source: 'Manual',
        order: 2,
        ownerId: sales2.id,
        lastContact: new Date('2023-10-27'),
      },
    }),
    prisma.lead.create({
      data: {
        name: 'Nairobi Logistics',
        company: 'NL Group',
        value: 3400000,
        stage: 'NEGOTIATION',
        probability: 90,
        avatar: 'https://picsum.photos/100/100?random=4',
        email: 'director@nlogistics.com',
        phone: '+254744888999',
        notes: 'Finalizing contract terms. Legal team is reviewing the SLA.',
        source: 'Manual',
        proposalStatus: 'Sent',
        order: 3,
        ownerId: sales2.id,
        lastContact: new Date('2023-10-24'),
      },
    }),
  ]);

  console.log('Leads created');

  // ─── Clients ────────────────────────────────────────────
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Wanjiku Trading',
        company: 'Wanjiku Ltd',
        email: 'info@wanjiku.co.ke',
        phone: '+254711222333',
        status: 'Active',
        totalRevenue: 1250000,
        avatar: 'https://picsum.photos/100/100?random=1',
        industry: 'Textiles',
        lastOrder: new Date('2023-10-25'),
      },
    }),
    prisma.client.create({
      data: {
        name: 'TechSahara',
        company: 'Sahara Systems',
        email: 'procurement@techsahara.com',
        phone: '+254722444555',
        status: 'Active',
        totalRevenue: 3400000,
        avatar: 'https://picsum.photos/100/100?random=2',
        industry: 'Technology',
        lastOrder: new Date('2023-10-20'),
      },
    }),
    prisma.client.create({
      data: {
        name: 'GreenGrocers',
        company: 'GG Exporters',
        email: 'orders@greengrocers.ke',
        phone: '+254733666777',
        status: 'Pending',
        totalRevenue: 450000,
        avatar: 'https://picsum.photos/100/100?random=3',
        industry: 'Agriculture',
        lastOrder: new Date('2023-09-15'),
      },
    }),
    prisma.client.create({
      data: {
        name: 'Nairobi Logistics',
        company: 'NL Group',
        email: 'director@nlogistics.com',
        phone: '+254744888999',
        status: 'Inactive',
        totalRevenue: 890000,
        avatar: 'https://picsum.photos/100/100?random=4',
        industry: 'Logistics',
        lastOrder: new Date('2023-08-10'),
      },
    }),
    prisma.client.create({
      data: {
        name: 'Mombasa Marine',
        company: 'Blue Ocean Ltd',
        email: 'sales@blueocean.co.ke',
        phone: '+254755111222',
        status: 'Active',
        totalRevenue: 5600000,
        avatar: 'https://picsum.photos/100/100?random=5',
        industry: 'Maritime',
        lastOrder: new Date('2023-10-28'),
      },
    }),
  ]);

  console.log('Clients created');

  // ─── Catalogue ──────────────────────────────────────────
  await Promise.all([
    prisma.catalogueItem.create({
      data: {
        name: 'CRM Implementation',
        description: 'Full setup and team onboarding for 10 users.',
        price: 150000,
        category: 'Service',
        sku: 'SVC-CRM-001',
        status: 'Active',
      },
    }),
    prisma.catalogueItem.create({
      data: {
        name: 'Annual Maintenance',
        description: 'Yearly support contract and updates.',
        price: 50000,
        category: 'Service',
        sku: 'SVC-MNT-002',
        status: 'Active',
      },
    }),
    prisma.catalogueItem.create({
      data: {
        name: 'POS Hardware Bundle',
        description: 'Touchscreen terminal, printer, and scanner.',
        price: 85000,
        category: 'Product',
        sku: 'HRD-POS-001',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=100',
        status: 'Active',
      },
    }),
  ]);

  console.log('Catalogue created');

  // ─── Tasks ──────────────────────────────────────────────
  await Promise.all([
    prisma.task.create({
      data: {
        title: 'Prepare Q3 Report',
        description: 'Compile and analyze Q3 sales performance',
        assigneeId: admin.id,
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        priority: 'High',
        status: 'To Do',
      },
    }),
    prisma.task.create({
      data: {
        title: 'Call Alice Kamau',
        description: 'Follow up on Nairobi Logistics contract',
        assigneeId: sales2.id,
        dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
        priority: 'Medium',
        status: 'To Do',
      },
    }),
    prisma.task.create({
      data: {
        title: 'Team Sync',
        description: 'Weekly team alignment meeting',
        assigneeId: manager.id,
        dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        priority: 'Low',
        status: 'Done',
      },
    }),
  ]);

  console.log('Tasks created');

  // ─── Invoices ───────────────────────────────────────────
  await Promise.all([
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2023-0089',
        clientId: clients[0].id,
        amount: 150000,
        dueDate: new Date('2023-11-15'),
        status: 'Pending',
        etimsCompliant: true,
        cuSerialNumber: 'KRA0012345',
        transmissionStatus: 'Verified',
      },
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2023-0091',
        clientId: clients[1].id,
        amount: 1200000,
        dueDate: new Date('2023-11-10'),
        status: 'Pending',
        etimsCompliant: true,
        cuSerialNumber: 'KRA0012346',
        transmissionStatus: 'Submitted',
      },
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2023-0055',
        clientId: clients[2].id,
        amount: 85000,
        dueDate: new Date('2023-10-01'),
        status: 'Overdue',
        etimsCompliant: false,
        transmissionStatus: 'Pending',
      },
    }),
  ]);

  console.log('Invoices created');

  // ─── Invoice Items ───────────────────────────────────────
  const invoice1 = await prisma.invoice.findFirst({ where: { invoiceNumber: 'INV-2023-0089' } });
  const invoice2 = await prisma.invoice.findFirst({ where: { invoiceNumber: 'INV-2023-0091' } });
  const crmItem = await prisma.catalogueItem.findFirst({ where: { sku: 'SVC-CRM-001' } });
  const mntItem = await prisma.catalogueItem.findFirst({ where: { sku: 'SVC-MNT-002' } });

  if (invoice1) {
    await prisma.invoiceItem.createMany({
      data: [
        { invoiceId: invoice1.id, name: 'CRM Implementation', quantity: 1, unitPrice: 150000, total: 150000, catalogueItemId: crmItem?.id },
      ],
    });
  }

  if (invoice2) {
    await prisma.invoiceItem.createMany({
      data: [
        { invoiceId: invoice2.id, name: 'CRM Implementation', quantity: 1, unitPrice: 1000000, total: 1000000, catalogueItemId: crmItem?.id },
        { invoiceId: invoice2.id, name: 'Annual Maintenance', quantity: 4, unitPrice: 50000, total: 200000, catalogueItemId: mntItem?.id },
      ],
    });
  }

  console.log('Invoice items created');

  // ─── Transactions ────────────────────────────────────────
  const client1 = await prisma.client.findFirst({ where: { company: 'Wanjiku Ltd' } });
  const client3 = await prisma.client.findFirst({ where: { company: 'NL Group' } });

  await prisma.transaction.createMany({
    data: [
      { code: 'RHI892KD2L', amount: 150000, sender: 'Wanjiku Ltd', method: 'M-Pesa', status: 'Verified', clientId: client1?.id },
      { code: 'BNK-TX-992', amount: 500000, sender: 'NL Group', method: 'Bank', status: 'Verified', clientId: client3?.id },
      { code: 'RHI441MQ9P', amount: 85000, sender: 'GG Exporters', method: 'M-Pesa', status: 'Unreconciled' },
    ],
  });

  console.log('Transactions created');

  // ─── Proposals ───────────────────────────────────────────
  const lead2 = await prisma.lead.findFirst({ where: { company: 'Sahara Systems' } });
  const lead4 = await prisma.lead.findFirst({ where: { company: 'NL Group' } });

  if (lead2) {
    await prisma.proposal.create({
      data: {
        leadId: lead2.id,
        content: JSON.stringify({ title: 'Custom CRM Solution Proposal', overview: 'End-to-end CRM with M-Pesa integration', pricing: { total: 1200000, breakdown: [{ item: 'CRM Implementation', price: 1000000 }, { item: 'Annual Maintenance', price: 200000 }] }, terms: 'Net 30' }),
        tone: 'formal',
        value: 1200000,
        status: 'Sent',
      },
    });
  }

  if (lead4) {
    await prisma.proposal.create({
      data: {
        leadId: lead4.id,
        content: JSON.stringify({ title: 'Logistics Management System', overview: 'Full logistics platform with fleet tracking', pricing: { total: 3400000, breakdown: [{ item: 'Software License', price: 2400000 }, { item: 'Implementation', price: 1000000 }] }, terms: 'Net 45' }),
        tone: 'formal',
        value: 3400000,
        status: 'Sent',
      },
    });
  }

  console.log('Proposals created');

  // ─── Workflows ──────────────────────────────────────────
  await prisma.workflow.create({
    data: {
      name: 'New Lead Notification',
      description: 'Send Telegram notification when a new lead is created',
      trigger: 'lead_created',
      actions: JSON.stringify([
        { type: 'send_telegram', message: '🎯 New lead: {{name}} (KES {{value}})' },
      ]),
      enabled: true,
      creatorId: admin.id,
    },
  });

  await prisma.workflow.create({
    data: {
      name: 'Deal Won - Create Task',
      description: 'Auto-create onboarding task when deal is closed',
      trigger: 'lead_stage_changed',
      conditions: JSON.stringify({ field: 'stage', equals: 'CLOSED' }),
      actions: JSON.stringify([
        { type: 'create_task', title: 'Onboarding: {{name}}', priority: 'High' },
        { type: 'send_telegram', message: '🎉 Deal closed: {{name}} (KES {{value}})' },
      ]),
      enabled: true,
      creatorId: admin.id,
    },
  });

  await prisma.workflow.create({
    data: {
      name: 'Stale Lead Alert',
      description: 'Alert when a lead hasn\'t been contacted in 7+ days',
      trigger: 'lead_stale',
      actions: JSON.stringify([
        { type: 'send_telegram', message: '⚠️ Stale lead: {{name}} - last contact {{lastContact}}' },
      ]),
      enabled: false,
      creatorId: admin.id,
    },
  });

  console.log('Workflows created');

  // ─── Audit Logs ─────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { actor: 'Amplify AI', action: 'Lead Creation', status: 'Success', details: 'Created lead: TechSahara via command', severity: 'Medium' },
      { actor: 'System', action: 'Invoice Sent', status: 'Success', details: 'Invoice #INV-002 auto-generated', severity: 'Low' },
      { actor: 'System', action: 'Connection Error', status: 'Failed', details: 'External API timeout', severity: 'High' },
      { actor: 'Eva Robinson', action: 'Delete Attempt', status: 'Denied', details: 'Attempted to delete protected record', severity: 'High' },
      { actor: 'Amplify AI', action: 'System Status', status: 'Success', details: 'Diagnostic run completed', severity: 'Low' },
    ],
  });

  console.log('Audit logs created');

  console.log('\nSeed complete!');
  console.log('Default login: admin@amplify.co.ke / password123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
