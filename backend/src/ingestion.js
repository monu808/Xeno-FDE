import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Start full import for a tenant
 */
export async function startFullImport(tenantId) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('Tenant not found');

  const credential = await prisma.shopifyCredential.findFirst({ where: { tenantId } });
  if (!credential) throw new Error('No Shopify credentials found');

  const job = await prisma.syncJob.create({
    data: { tenantId, type: 'full', status: 'running' },
  });

  try {
    console.log(`Starting full import for tenant ${tenantId}`);

    // Skip direct customer import due to Shopify restrictions
    // Customers will be created from order data
    console.log('Skipping direct customer import (restricted by Shopify policy)');

    // Import products
    await fetchAndUpsertProducts(tenant.storeDomain, credential.accessToken, tenantId);

    // Import orders (will also create customers from order data)
    await fetchAndUpsertOrders(tenant.storeDomain, credential.accessToken, tenantId);

    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: 'completed', finishedAt: new Date() },
    });

    console.log(`Full import completed for tenant ${tenantId}`);
  } catch (error) {
    console.error(`Full import failed for tenant ${tenantId}:`, error);
    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: 'failed', errorMsg: error.message, finishedAt: new Date() },
    });
    throw error;
  }
}

/**
 * Fetch and upsert customers with pagination (GraphQL)
 */
async function fetchAndUpsertCustomers(shop, accessToken, tenantId) {
  const apiVersion = process.env.SHOPIFY_API_VERSION;
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const query = `
      query getCustomers($cursor: String) {
        customers(first: 50, after: $cursor) {
          edges {
            node {
              id
              email
              firstName
              lastName
              phone
              amountSpent {
                amount
              }
              numberOfOrders
              createdAt
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { cursor } }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Shopify API Error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch customers: ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const customers = data.data?.customers?.edges || [];
    for (const edge of customers) {
      const customer = edge.node;
      // Convert GraphQL customer to REST format
      await upsertCustomer(tenantId, {
        id: customer.id.split('/').pop(), // Extract numeric ID from gid://shopify/Customer/123
        email: customer.email,
        first_name: customer.firstName,
        last_name: customer.lastName,
        phone: customer.phone,
        total_spent: customer.amountSpent?.amount || '0.00',
        orders_count: customer.numberOfOrders || 0,
        created_at: customer.createdAt,
      });
    }

    hasNextPage = data.data?.customers?.pageInfo?.hasNextPage || false;
    cursor = data.data?.customers?.pageInfo?.endCursor;

    console.log(`Imported ${customers.length} customers`);
  }
}

/**
 * Fetch and upsert products with pagination (GraphQL)
 */
async function fetchAndUpsertProducts(shop, accessToken, tenantId) {
  const apiVersion = process.env.SHOPIFY_API_VERSION;
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const query = `
      query getProducts($cursor: String) {
        products(first: 50, after: $cursor) {
          edges {
            node {
              id
              title
              vendor
              productType
              createdAt
              updatedAt
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { cursor } }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Shopify API Error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch products: ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const products = data.data?.products?.edges || [];
    for (const edge of products) {
      const product = edge.node;
      await upsertProduct(tenantId, {
        id: product.id.split('/').pop(),
        title: product.title,
        vendor: product.vendor,
        product_type: product.productType,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
      });
    }

    hasNextPage = data.data?.products?.pageInfo?.hasNextPage || false;
    cursor = data.data?.products?.pageInfo?.endCursor;

    console.log(`Imported ${products.length} products`);
  }
}

/**
 * Fetch and upsert orders with pagination (GraphQL)
 */
async function fetchAndUpsertOrders(shop, accessToken, tenantId) {
  const apiVersion = process.env.SHOPIFY_API_VERSION;
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const query = `
      query getOrders($cursor: String) {
        orders(first: 50, after: $cursor) {
          edges {
            node {
              id
              name
              email
              createdAt
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              customer {
                id
                email
                firstName
                lastName
                phone
              }
              lineItems(first: 100) {
                edges {
                  node {
                    id
                    title
                    quantity
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                      }
                    }
                    product {
                      id
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { cursor } }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Shopify API Error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch orders: ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const orders = data.data?.orders?.edges || [];
    for (const edge of orders) {
      const order = edge.node;
      
      // First, create/update customer from order data if present
      if (order.customer) {
        await upsertCustomer(tenantId, {
          id: order.customer.id.split('/').pop(),
          email: order.customer.email,
          first_name: order.customer.firstName,
          last_name: order.customer.lastName,
          phone: order.customer.phone,
          total_spent: '0.00', // Will be calculated from orders
          orders_count: 0, // Will be calculated from orders
          created_at: order.createdAt,
        });
      }
      
      await upsertOrder(tenantId, {
        id: order.id.split('/').pop(),
        name: order.name,
        email: order.email,
        created_at: order.createdAt,
        total_price: order.totalPriceSet.shopMoney.amount,
        currency: order.totalPriceSet.shopMoney.currencyCode,
        customer: order.customer ? { id: order.customer.id.split('/').pop() } : null,
        line_items: order.lineItems.edges.map(li => ({
          id: li.node.id.split('/').pop(),
          title: li.node.title,
          quantity: li.node.quantity,
          price: li.node.originalUnitPriceSet.shopMoney.amount,
          product_id: li.node.product ? li.node.product.id.split('/').pop() : null,
        })),
      });
    }

    hasNextPage = data.data?.orders?.pageInfo?.hasNextPage || false;
    cursor = data.data?.orders?.pageInfo?.endCursor;

    console.log(`Imported ${orders.length} orders`);
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

/**
 * Upsert order
 */
async function upsertOrder(tenantId, payload) {
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
