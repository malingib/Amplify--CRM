import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { config } from './config';
import prisma from './lib/prisma';
import { initWebSocket } from './websocket';

// Routes
import authRoutes from './routes/auth';
import leadRoutes from './routes/leads';
import leadLifecycleRoutes from './routes/leadLifecycle';
import crmCoreRoutes from './routes/crmCore';
import clientRoutes from './routes/clients';
import catalogueRoutes from './routes/catalogue';
import taskRoutes from './routes/tasks';
import invoiceRoutes from './routes/invoices';
import workflowRoutes from './routes/workflows';
import whatsappRoutes from './routes/whatsapp';
import telegramRoutes from './routes/telegram';
import googleChatRoutes from './routes/googlechat';
import workspaceRoutes from './routes/workspace';
import auditRoutes from './routes/audit';
import dashboardRoutes from './routes/dashboard';
import teamRoutes from './routes/team';

const app = express();
const httpServer = createServer(app);
initWebSocket(httpServer);

const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 240, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests. Please slow down and try again.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many authentication attempts. Please try again later.' } });

app.disable('x-powered-by');
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.2.0' }));

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/lead-lifecycle', leadLifecycleRoutes);
app.use('/api/crm', crmCoreRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/catalogue', catalogueRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/googlechat', googleChatRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/team', teamRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const id = `ERR-${Date.now().toString(36)}`;
  console.error(`[${id}] ${req.method} ${req.path}`, err);
  res.status(500).json({ error: 'Internal server error', errorId: id });
});

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connected');
    httpServer.listen(config.port, () => {
      console.log(`Amplify CRM API running on http://localhost:${config.port}`);
      console.log(`WebSocket ready on ws://localhost:${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') main();
const shutdown = async () => { await prisma.$disconnect(); process.exit(0); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
export default app;
