import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { startOAuthFlow, handleOAuthCallback } from './auth.js';
import { handleWebhook } from './webhooks.js';
import { startFullImport } from './ingestion.js';
import {
  getMetricsOverview,
  getOrdersByDate,
  getTopCustomers,
  getTopProducts,
} from './metrics.js';

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://xeno-fde-dashboard.vercel.app',
    'https://xeno-fde-dashboard-3zfe8gdpz-narendra-singhs-projects-90b1d8d1.vercel.app',
    /https:\/\/xeno-fde-dashboard-.*\.vercel\.app$/
  ],
  credentials: true
}));

// Raw body for webhook HMAC verification
app.use('/webhooks/shopify', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.rawBody = req.body.toString('utf8');
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Root route
app.get('/', (_req, res) => {
  res.json({ 
    name: 'Xeno FDE Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/auth/start',
      metrics: '/api/metrics/*',
      ingestion: '/api/ingestion/start',
      webhooks: '/webhooks/shopify'
    }
  });
});

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// OAuth routes
app.get('/auth/start', startOAuthFlow);
app.get('/auth/callback', handleOAuthCallback);

// Webhook route
app.post('/webhooks/shopify', handleWebhook);

// Ingestion route
app.post('/api/ingestion/start', async (req, res) => {
  try {
    const { tenant_id } = req.body;
    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id required' });
    }
    startFullImport(tenant_id).catch((err) => console.error('Ingestion error:', err));
    res.json({ message: 'Full import started', tenant_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Metrics routes
app.get('/api/metrics/overview', getMetricsOverview);
app.get('/api/metrics/orders/by-date', getOrdersByDate);
app.get('/api/metrics/customers/top', getTopCustomers);
app.get('/api/metrics/products/top', getTopProducts);

const port = process.env.PORT || 3001;

// For local development
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

// Export for Vercel serverless
export default app;
