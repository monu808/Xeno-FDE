import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Start OAuth flow - redirect to Shopify authorization
 */
export async function startOAuthFlow(req, res) {
  const { shop } = req.query;

  if (!shop || !/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shop)) {
    return res.status(400).json({ error: 'Invalid shop parameter' });
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  const scopes = 'read_customers,read_orders,read_products,read_draft_orders,read_checkouts';
  const redirectUri = `${process.env.APP_BASE_URL}/auth/callback`;
  const state = crypto.randomBytes(16).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');

  // Store state/nonce in session or DB for verification (simplified here)
  // In production, use a session store or Redis

  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}&grant_options[]=${nonce}`;

  res.redirect(authUrl);
}

/**
 * OAuth callback - exchange code for access token
 */
export async function handleOAuthCallback(req, res) {
  const { shop, code, state } = req.query;

  if (!shop || !code) {
    return res.status(400).json({ error: 'Missing shop or code' });
  }

  // TODO: Verify state matches stored value

  try {
    const accessTokenUrl = `https://${shop}/admin/oauth/access_token`;
    const payload = {
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    };

    const response = await fetch(accessTokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!data.access_token) {
      return res.status(400).json({ error: 'Failed to get access token', details: data });
    }

    // Create or update tenant
    let tenant = await prisma.tenant.findUnique({ where: { storeDomain: shop } });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          storeDomain: shop,
          name: shop.replace('.myshopify.com', ''),
          status: 'active',
        },
      });
    }

    // Store credentials
    await prisma.shopifyCredential.upsert({
      where: { tenantId: tenant.id },
      update: {
        accessToken: data.access_token,
        scopes: data.scope,
        apiVersion: process.env.SHOPIFY_API_VERSION,
      },
      create: {
        tenantId: tenant.id,
        accessToken: data.access_token,
        scopes: data.scope,
        apiVersion: process.env.SHOPIFY_API_VERSION,
      },
    });

    // Register webhooks
    await registerWebhooks(shop, data.access_token);

    res.json({
      success: true,
      message: 'App installed successfully',
      tenant: { id: tenant.id, storeDomain: tenant.storeDomain },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'OAuth failed', details: error.message });
  }
}

/**
 * Register webhooks for tenant
 */
async function registerWebhooks(shop, accessToken) {
  const apiVersion = process.env.SHOPIFY_API_VERSION;
  const webhookUrl = `${process.env.APP_BASE_URL}/webhooks/shopify`;

  const topics = [
    'orders/create',
    'orders/updated',
    'customers/create',
    'customers/update',
    'products/create',
    'products/update',
    'products/delete',
    'checkouts/create',
    'checkouts/update',
  ];

  for (const topic of topics) {
    try {
      await fetch(`https://${shop}/admin/api/${apiVersion}/webhooks.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address: webhookUrl,
            format: 'json',
          },
        }),
      });
      console.log(`Registered webhook: ${topic} for ${shop}`);
    } catch (error) {
      console.error(`Failed to register webhook ${topic}:`, error.message);
    }
  }
}
