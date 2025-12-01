import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));

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
      metrics: '/api/metrics/*'
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

// Metrics routes - simplified for now
app.get('/api/metrics/overview', async (req, res) => {
  try {
    const { tenant_id } = req.query;
    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id required' });
    }
    
    const orders = await prisma.order.findMany({
      where: { tenantId: tenant_id }
    });
    
    const customers = await prisma.customer.findMany({
      where: { tenantId: tenant_id }
    });
    
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalPrice), 0);
    const totalOrders = orders.length;
    const totalCustomers = customers.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    res.json({
      totalRevenue: totalRevenue.toFixed(2),
      totalRevenueFormatted: totalRevenue.toFixed(2),
      totalOrders,
      totalCustomers,
      averageOrderValue: avgOrderValue.toFixed(2),
      averageOrderValueFormatted: avgOrderValue.toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vercel serverless handler - wrap Express app
export default (req, res) => {
  return app(req, res);
};

