import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config';
import prisma from './lib/prisma';
import { initWebSocket } from './websocket';

// Routes
import authRoutes from './routes/auth';
import leadRoutes from './routes/leads';
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

// Initialize WebSocket
initWebSocket(httpServer);

// Middleware
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
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

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
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

if (process.env.NODE_ENV !== 'test') {
  main();
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const id = `ERR-${Date.now().toString(36)}`;
  console.error(`[${id}] Unhandled error:`, err);
  res.status(500).json({ error: 'Internal server error', errorId: id });
});

export default app;
