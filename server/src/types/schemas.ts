import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name is required'),
  role: z.enum(['ADMIN', 'MANAGER', 'SALES', 'VIEWER']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const leadSchema = z.object({
  name: z.string().min(1),
  company: z.string().min(1),
  value: z.number().optional(),
  stage: z.enum(['INTAKE', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED', 'LOST']).optional(),
  probability: z.number().min(0).max(100).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  source: z.string().optional(),
  avatar: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  order: z.number().optional(),
});

export const clientSchema = z.object({
  name: z.string().min(1),
  company: z.string().min(1),
  email: z.string().email(),
  phone: z.string(),
  status: z.enum(['Active', 'Inactive', 'Pending']).optional(),
  totalRevenue: z.number().optional(),
  avatar: z.string().optional().nullable(),
  industry: z.string().optional(),
});

export const catalogueSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  price: z.number().min(0),
  category: z.enum(['Product', 'Service']).optional(),
  sku: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  status: z.enum(['Active', 'Draft', 'Archived']).optional(),
});

export const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().or(z.date()),
  priority: z.enum(['High', 'Medium', 'Low']).optional(),
  status: z.enum(['To Do', 'In Progress', 'Done']).optional(),
  reminderSet: z.boolean().optional(),
  reminderTime: z.string().or(z.date()).optional().nullable(),
  reminderPhone: z.string().optional().nullable(),
});

export const invoiceSchema = z.object({
  clientId: z.string(),
  amount: z.number().min(0),
  dueDate: z.string().or(z.date()),
  items: z.array(z.object({
    catalogueItemId: z.string().optional().nullable(),
    name: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    total: z.number(),
  })).optional(),
});

export const workflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  trigger: z.string(),
  conditions: z.string().optional(),
  actions: z.string(),
  enabled: z.boolean().optional(),
});

export const telegramConfigSchema = z.object({
  botToken: z.string().min(1),
  chatId: z.string().optional(),
  botName: z.string().optional(),
});

export const whatsappConfigSchema = z.object({
  instanceName: z.string().min(1),
  phone: z.string().optional(),
});
