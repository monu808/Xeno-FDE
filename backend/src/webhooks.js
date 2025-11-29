import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Verify Shopify webhook HMAC signature
 */
export function verifyShopifyWebhookHmac(req) {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const secret = process.env.SHOPIFY_API_SECRET;
  const body = req.rawBody || JSON.stringify(req.body);

  if (!hmac) {
    return false;
  }

  const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(hash));
}

/**
 * Handle incoming Shopify webhooks
 */
export async function handleWebhook(req, res) {
  try {
    // Verify HMAC
    if (!verifyShopifyWebhookHmac(req)) {
      console.warn('Invalid HMAC signature');
      return res.status(401).send('Unauthorized');
    }

    const topic = req.headers['x-shopify-topic'];
    const shop = req.headers['x-shopify-shop-domain'];
    const webhookId = req.headers['x-shopify-webhook-id'];
    const payload = req.body;

    console.log(`Received webhook: ${topic} from ${shop}`);

    // Find tenant
    const tenant = await prisma.tenant.findUnique({ where: { storeDomain: shop } });
    if (!tenant) {
      console.warn(`Tenant not found for shop: ${shop}`);
      return res.status(404).send('Tenant not found');
    }

    // Check for duplicate webhook
    const existing = await prisma.event.findFirst({
      where: { 
        tenantId: tenant.id, 
        webhookId: webhookId 
      },
    });
    if (existing) {
      console.log(`Duplicate webhook ignored: ${webhookId}`);
      return res.status(200).send('ok');
    }

    // Store event
    const event = await prisma.event.create({
      data: {
        tenantId: tenant.id,
        topic,
        entityType: topic.split('/')[0],
        entityId: String(payload.id || ''),
        payloadJson: JSON.stringify(payload),
        webhookId,
        storeDomain: shop,
        status: 'received',
      },
    });

    // Process event asynchronously
    processEventWorker(event.id).catch((err) =>
      console.error(`Event processing failed: ${event.id}`, err)
    );

    res.status(200).send('ok');
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).send('Internal error');
  }
}

/**
 * Process event worker (async)
 */
export async function processEventWorker(eventId) {
  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.status === 'processed') return;

    const payload = JSON.parse(event.payloadJson);

    // Route to appropriate handler
    if (event.topic.startsWith('customers/')) {
      await upsertCustomer(event.tenantId, payload);
    } else if (event.topic.startsWith('orders/')) {
      await upsertOrder(event.tenantId, payload);
    } else if (event.topic.startsWith('products/')) {
      await upsertProduct(event.tenantId, payload);
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { status: 'processed', processedAt: new Date() },
    });
  } catch (error) {
    console.error(`Event worker error for ${eventId}:`, error);
    await prisma.event.update({
      where: { id: eventId },
      data: { status: 'failed', errorMsg: error.message },
    });
  }
}

/**
 * Upsert customer
 */
async function upsertCustomer(tenantId, payload) {
  await prisma.customer.upsert({
    where: { tenantId_shopifyId: { tenantId, shopifyId: BigInt(payload.id) } },
    update: {
      email: payload.email,
      firstName: payload.first_name,
      lastName: payload.last_name,
      totalSpentCents: Math.round(parseFloat(payload.total_spent || 0) * 100),
      currency: payload.currency || 'USD',
      updatedAt: new Date(),
    },
    create: {
      tenantId,
      shopifyId: BigInt(payload.id),
      email: payload.email,
      firstName: payload.first_name,
      lastName: payload.last_name,
      totalSpentCents: Math.round(parseFloat(payload.total_spent || 0) * 100),
      currency: payload.currency || 'USD',
    },
  });
}

/**
 * Upsert order
 */
async function upsertOrder(tenantId, payload) {
  // Find customer if exists
  let customerId = null;
  if (payload.customer?.id) {
    const customer = await prisma.customer.findUnique({
      where: { tenantId_shopifyId: { tenantId, shopifyId: BigInt(payload.customer.id) } },
    });
    customerId = customer?.id || null;
  }

  const order = await prisma.order.upsert({
    where: { tenantId_shopifyId: { tenantId, shopifyId: BigInt(payload.id) } },
    update: {
      customerId,
      name: payload.name,
      status: payload.status,
      financialStatus: payload.financial_status,
      fulfillmentStatus: payload.fulfillment_status,
      subtotalCents: Math.round(parseFloat(payload.subtotal_price || 0) * 100),
      totalCents: Math.round(parseFloat(payload.total_price || 0) * 100),
      taxCents: Math.round(parseFloat(payload.total_tax || 0) * 100),
      currency: payload.currency || 'USD',
      processedAt: payload.processed_at ? new Date(payload.processed_at) : null,
      canceledAt: payload.cancelled_at ? new Date(payload.cancelled_at) : null,
      updatedAt: new Date(),
    },
    create: {
      tenantId,
      shopifyId: BigInt(payload.id),
      customerId,
      name: payload.name,
      status: payload.status,
      financialStatus: payload.financial_status,
      fulfillmentStatus: payload.fulfillment_status,
      subtotalCents: Math.round(parseFloat(payload.subtotal_price || 0) * 100),
      totalCents: Math.round(parseFloat(payload.total_price || 0) * 100),
      taxCents: Math.round(parseFloat(payload.total_tax || 0) * 100),
      currency: payload.currency || 'USD',
      processedAt: payload.processed_at ? new Date(payload.processed_at) : null,
    },
  });

  // Upsert line items
  if (payload.line_items?.length) {
    for (const item of payload.line_items) {
      let productId = null;
      if (item.product_id) {
        const product = await prisma.product.findUnique({
          where: { tenantId_shopifyId: { tenantId, shopifyId: BigInt(item.product_id) } },
        });
        productId = product?.id || null;
      }

      await prisma.orderLineItem.upsert({
        where: {
          tenantId_orderId_shopifyId: {
            tenantId,
            orderId: order.id,
            shopifyId: BigInt(item.id),
          },
        },
        update: {
          productId,
          title: item.title,
          quantity: item.quantity,
          priceCents: Math.round(parseFloat(item.price || 0) * 100),
          totalCents: Math.round(parseFloat(item.price || 0) * item.quantity * 100),
          sku: item.sku,
          variantId: item.variant_id ? BigInt(item.variant_id) : null,
        },
        create: {
          tenantId,
          orderId: order.id,
          shopifyId: BigInt(item.id),
          productId,
          title: item.title,
          quantity: item.quantity,
          priceCents: Math.round(parseFloat(item.price || 0) * 100),
          totalCents: Math.round(parseFloat(item.price || 0) * item.quantity * 100),
          sku: item.sku,
          variantId: item.variant_id ? BigInt(item.variant_id) : null,
        },
      });
    }
  }
}

/**
 * Upsert product
 */
async function upsertProduct(tenantId, payload) {
  await prisma.product.upsert({
    where: { tenantId_shopifyId: { tenantId, shopifyId: BigInt(payload.id) } },
    update: {
      title: payload.title,
      status: payload.status,
      productType: payload.product_type,
      vendor: payload.vendor,
      deletedAt: payload.status === 'archived' ? new Date() : null,
      updatedAt: new Date(),
    },
    create: {
      tenantId,
      shopifyId: BigInt(payload.id),
      title: payload.title,
      status: payload.status,
      productType: payload.product_type,
      vendor: payload.vendor,
    },
  });
}
