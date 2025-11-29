import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get overview metrics
 */
export async function getMetricsOverview(req, res) {
  try {
    const { tenant_id, from, to } = req.query;

    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id required' });
    }

    const whereClause = {
      tenantId: tenant_id,
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const [orderCount, revenueSum, customerCount] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.aggregate({
        where: {
          ...whereClause,
          financialStatus: { in: ['paid', 'partially_paid'] },
        },
        _sum: { totalCents: true },
      }),
      prisma.customer.count({ where: { tenantId: tenant_id } }),
    ]);

    const totalRevenueCents = revenueSum._sum.totalCents || 0;
    const averageOrderValue = orderCount > 0 ? totalRevenueCents / orderCount : 0;

    res.json({
      tenant_id,
      totalOrders: orderCount,
      totalRevenueCents,
      totalRevenueFormatted: (totalRevenueCents / 100).toFixed(2),
      totalCustomers: customerCount,
      averageOrderValueCents: Math.round(averageOrderValue),
      averageOrderValueFormatted: (averageOrderValue / 100).toFixed(2),
    });
  } catch (error) {
    console.error('Metrics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics', details: error.message });
  }
}

/**
 * Get orders by date (time series)
 */
export async function getOrdersByDate(req, res) {
  try {
    const { tenant_id, from, to, granularity = 'day' } = req.query;

    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id required' });
    }

    const whereClause = {
      tenantId: tenant_id,
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    // Use raw SQL for date grouping
    const dateFormat =
      granularity === 'month'
        ? "TO_CHAR(\"createdAt\", 'YYYY-MM')"
        : "TO_CHAR(\"createdAt\", 'YYYY-MM-DD')";

    const result = await prisma.$queryRawUnsafe(`
      SELECT 
        ${dateFormat} as date,
        COUNT(*)::int as order_count,
        SUM("totalCents")::bigint as total_revenue_cents
      FROM "Order"
      WHERE "tenantId" = $1
        ${from ? `AND "createdAt" >= $2` : ''}
        ${to ? `AND "createdAt" <= ${from ? '$3' : '$2'}` : ''}
      GROUP BY date
      ORDER BY date
    `, tenant_id, ...(from ? [new Date(from)] : []), ...(to ? [new Date(to)] : []));

    res.json({
      tenant_id,
      granularity,
      data: result.map((row) => ({
        date: row.date,
        orderCount: row.order_count,
        totalRevenueCents: Number(row.total_revenue_cents || 0),
        totalRevenueFormatted: (Number(row.total_revenue_cents || 0) / 100).toFixed(2),
      })),
    });
  } catch (error) {
    console.error('Orders by date error:', error);
    res.status(500).json({ error: 'Failed to fetch orders by date', details: error.message });
  }
}

/**
 * Get top customers by spend
 */
export async function getTopCustomers(req, res) {
  try {
    const { tenant_id, limit = 5, from, to } = req.query;

    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id required' });
    }

    const whereClause = {
      tenantId: tenant_id,
      customerId: { not: null },
      financialStatus: { in: ['paid', 'partially_paid'] },
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const orders = await prisma.order.groupBy({
      by: ['customerId'],
      where: whereClause,
      _sum: { totalCents: true },
      _count: { id: true },
      orderBy: { _sum: { totalCents: 'desc' } },
      take: parseInt(limit),
    });

    const customerIds = orders.map((o) => o.customerId).filter(Boolean);
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
    });

    const customerMap = new Map(customers.map((c) => [c.id, c]));

    const result = orders.map((order) => {
      const customer = customerMap.get(order.customerId);
      return {
        customerId: order.customerId,
        email: customer?.email || 'N/A',
        firstName: customer?.firstName || '',
        lastName: customer?.lastName || '',
        totalSpentCents: order._sum.totalCents || 0,
        totalSpentFormatted: ((order._sum.totalCents || 0) / 100).toFixed(2),
        orderCount: order._count.id,
      };
    });

    res.json({ tenant_id, limit, data: result });
  } catch (error) {
    console.error('Top customers error:', error);
    res.status(500).json({ error: 'Failed to fetch top customers', details: error.message });
  }
}

/**
 * Get top products by revenue
 */
export async function getTopProducts(req, res) {
  try {
    const { tenant_id, limit = 5, from, to } = req.query;

    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id required' });
    }

    const whereClause = {
      tenantId: tenant_id,
      productId: { not: null },
      ...(from || to
        ? {
            order: {
              createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            },
          }
        : {}),
    };

    const lineItems = await prisma.orderLineItem.groupBy({
      by: ['productId'],
      where: whereClause,
      _sum: { totalCents: true, quantity: true },
      _count: { id: true },
      orderBy: { _sum: { totalCents: 'desc' } },
      take: parseInt(limit),
    });

    const productIds = lineItems.map((i) => i.productId).filter(Boolean);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const result = lineItems.map((item) => {
      const product = productMap.get(item.productId);
      return {
        productId: item.productId,
        title: product?.title || 'Unknown',
        vendor: product?.vendor || '',
        totalRevenueCents: item._sum.totalCents || 0,
        totalRevenueFormatted: ((item._sum.totalCents || 0) / 100).toFixed(2),
        quantitySold: item._sum.quantity || 0,
        orderCount: item._count.id,
      };
    });

    res.json({ tenant_id, limit, data: result });
  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({ error: 'Failed to fetch top products', details: error.message });
  }
}
