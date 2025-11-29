import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Get the actual tenant from the database (your real store)
  const realTenant = await prisma.tenant.findFirst({
    where: { storeDomain: 'xeno-test-store-5.myshopify.com' },
  });

  const tenantId = realTenant ? realTenant.id : 'c19dfaaf-19e0-43c1-8d7d-5de83855d427';
  
  console.log('Using tenant:', tenantId);

  // Create demo customers for your real store
  const customer1 = await prisma.customer.upsert({
    where: { tenantId_shopifyId: { tenantId: tenantId, shopifyId: BigInt(5001) } },
    update: {
      totalSpentCents: 45000,
    },
    create: {
      tenantId: tenantId,
      shopifyId: BigInt(5001),
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      totalSpentCents: 45000,
      currency: 'USD',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { tenantId_shopifyId: { tenantId: tenantId, shopifyId: BigInt(5002) } },
    update: {
      totalSpentCents: 78000,
    },
    create: {
      tenantId: tenantId,
      shopifyId: BigInt(5002),
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      totalSpentCents: 78000,
      currency: 'USD',
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { tenantId_shopifyId: { tenantId: tenantId, shopifyId: BigInt(5003) } },
    update: {
      totalSpentCents: 32000,
    },
    create: {
      tenantId: tenantId,
      shopifyId: BigInt(5003),
      email: 'bob.johnson@example.com',
      firstName: 'Bob',
      lastName: 'Johnson',
      totalSpentCents: 32000,
      currency: 'USD',
    },
  });

  const customer4 = await prisma.customer.upsert({
    where: { tenantId_shopifyId: { tenantId: tenantId, shopifyId: BigInt(5004) } },
    update: {
      totalSpentCents: 95000,
    },
    create: {
      tenantId: tenantId,
      shopifyId: BigInt(5004),
      email: 'alice.williams@example.com',
      firstName: 'Alice',
      lastName: 'Williams',
      totalSpentCents: 95000,
      currency: 'USD',
    },
  });

  console.log('Created 4 customers');

  // Create demo products
  const product1 = await prisma.product.upsert({
    where: { tenantId_shopifyId: { tenantId: tenantId, shopifyId: BigInt(6001) } },
    update: {},
    create: {
      tenantId: tenantId,
      shopifyId: BigInt(6001),
      title: 'Premium Wireless Headphones',
      status: 'active',
      productType: 'Electronics',
      vendor: 'AudioTech',
    },
  });

  const product2 = await prisma.product.upsert({
    where: { tenantId_shopifyId: { tenantId: tenantId, shopifyId: BigInt(6002) } },
    update: {},
    create: {
      tenantId: tenantId,
      shopifyId: BigInt(6002),
      title: 'Smart Fitness Watch',
      status: 'active',
      productType: 'Electronics',
      vendor: 'FitPro',
    },
  });

  const product3 = await prisma.product.upsert({
    where: { tenantId_shopifyId: { tenantId: tenantId, shopifyId: BigInt(6003) } },
    update: {},
    create: {
      tenantId: tenantId,
      shopifyId: BigInt(6003),
      title: 'Leather Laptop Bag',
      status: 'active',
      productType: 'Accessories',
      vendor: 'StyleCo',
    },
  });

  const product4 = await prisma.product.upsert({
    where: { tenantId_shopifyId: { tenantId: tenantId, shopifyId: BigInt(6004) } },
    update: {},
    create: {
      tenantId: tenantId,
      shopifyId: BigInt(6004),
      title: 'Organic Coffee Beans',
      status: 'active',
      productType: 'Food & Beverage',
      vendor: 'BrewMasters',
    },
  });

  console.log('Created 4 products');

  // Create demo orders
  const order1 = await prisma.order.upsert({
    where: { tenantId_shopifyId: { tenantId: tenantId, shopifyId: BigInt(7001) } },
    update: {},
    create: {
      tenantId: tenantId,
      shopifyId: BigInt(7001),
      customerId: customer1.id,
      name: '#1101',
      status: 'fulfilled',
      financialStatus: 'paid',
      fulfillmentStatus: 'fulfilled',
      subtotalCents: 20000,
      totalCents: 22000,
      taxCents: 2000,
      currency: 'USD',
      processedAt: new Date('2024-11-15'),
    },
  });

  const order2 = await prisma.order.upsert({
    where: { tenantId_shopifyId: { tenantId: tenantId, shopifyId: BigInt(7002) } },
    update: {},
    create: {
      tenantId: tenantId,
      shopifyId: BigInt(7002),
      customerId: customer1.id,
      name: '#1102',
      status: 'fulfilled',
      financialStatus: 'paid',
      fulfillmentStatus: 'fulfilled',
      subtotalCents: 25000,
      totalCents: 27500,
      taxCents: 2500,
      currency: 'USD',
      processedAt: new Date('2024-11-20'),
    },
  });

  const order3 = await prisma.order.upsert({
    where: { tenantId_shopifyId: { tenantId: tenantId, shopifyId: BigInt(7003) } },
    update: {},
    create: {
      tenantId: tenantId,
      shopifyId: BigInt(7003),
      customerId: customer2.id,
      name: '#1103',
      status: 'fulfilled',
      financialStatus: 'paid',
      fulfillmentStatus: 'fulfilled',
      subtotalCents: 35000,
      totalCents: 38500,
      taxCents: 3500,
      currency: 'USD',
      processedAt: new Date('2024-11-22'),
    },
  });

  const order4 = await prisma.order.upsert({
    where: { tenantId_shopifyId: { tenantId: tenantId, shopifyId: BigInt(7004) } },
    update: {},
    create: {
      tenantId: tenantId,
      shopifyId: BigInt(7004),
      customerId: customer2.id,
      name: '#1104',
      status: 'fulfilled',
      financialStatus: 'paid',
      fulfillmentStatus: 'fulfilled',
      subtotalCents: 40000,
      totalCents: 44000,
      taxCents: 4000,
      currency: 'USD',
      processedAt: new Date('2024-11-25'),
    },
  });

  const order5 = await prisma.order.upsert({
    where: { tenantId_shopifyId: { tenantId: tenantId, shopifyId: BigInt(7005) } },
    update: {},
    create: {
      tenantId: tenantId,
      shopifyId: BigInt(7005),
      customerId: customer3.id,
      name: '#1105',
      status: 'fulfilled',
      financialStatus: 'paid',
      fulfillmentStatus: 'fulfilled',
      subtotalCents: 32000,
      totalCents: 35200,
      taxCents: 3200,
      currency: 'USD',
      processedAt: new Date('2024-11-26'),
    },
  });

  const order6 = await prisma.order.upsert({
    where: { tenantId_shopifyId: { tenantId: tenantId, shopifyId: BigInt(7006) } },
    update: {},
    create: {
      tenantId: tenantId,
      shopifyId: BigInt(7006),
      customerId: customer4.id,
      name: '#1106',
      status: 'fulfilled',
      financialStatus: 'paid',
      fulfillmentStatus: 'fulfilled',
      subtotalCents: 45000,
      totalCents: 49500,
      taxCents: 4500,
      currency: 'USD',
      processedAt: new Date('2024-11-28'),
    },
  });

  const order7 = await prisma.order.upsert({
    where: { tenantId_shopifyId: { tenantId: tenantId, shopifyId: BigInt(7007) } },
    update: {},
    create: {
      tenantId: tenantId,
      shopifyId: BigInt(7007),
      customerId: customer4.id,
      name: '#1107',
      status: 'fulfilled',
      financialStatus: 'paid',
      fulfillmentStatus: 'fulfilled',
      subtotalCents: 50000,
      totalCents: 55000,
      taxCents: 5000,
      currency: 'USD',
      processedAt: new Date('2024-11-29'),
    },
  });

  console.log('Created 7 orders');

  // Create line items
  await prisma.orderLineItem.upsert({
    where: {
      tenantId_orderId_shopifyId: {
        tenantId: tenantId,
        orderId: order1.id,
        shopifyId: BigInt(8001),
      },
    },
    update: {},
    create: {
      tenantId: tenantId,
      orderId: order1.id,
      shopifyId: BigInt(8001),
      productId: product1.id,
      title: 'Premium Wireless Headphones',
      quantity: 1,
      priceCents: 20000,
      totalCents: 20000,
      sku: 'HEAD-001',
    },
  });

  await prisma.orderLineItem.upsert({
    where: {
      tenantId_orderId_shopifyId: {
        tenantId: tenantId,
        orderId: order2.id,
        shopifyId: BigInt(8002),
      },
    },
    update: {},
    create: {
      tenantId: tenantId,
      orderId: order2.id,
      shopifyId: BigInt(8002),
      productId: product2.id,
      title: 'Smart Fitness Watch',
      quantity: 1,
      priceCents: 25000,
      totalCents: 25000,
      sku: 'WATCH-001',
    },
  });

  await prisma.orderLineItem.upsert({
    where: {
      tenantId_orderId_shopifyId: {
        tenantId: tenantId,
        orderId: order3.id,
        shopifyId: BigInt(8003),
      },
    },
    update: {},
    create: {
      tenantId: tenantId,
      orderId: order3.id,
      shopifyId: BigInt(8003),
      productId: product3.id,
      title: 'Leather Laptop Bag',
      quantity: 1,
      priceCents: 35000,
      totalCents: 35000,
      sku: 'BAG-001',
    },
  });

  await prisma.orderLineItem.upsert({
    where: {
      tenantId_orderId_shopifyId: {
        tenantId: tenantId,
        orderId: order4.id,
        shopifyId: BigInt(8004),
      },
    },
    update: {},
    create: {
      tenantId: tenantId,
      orderId: order4.id,
      shopifyId: BigInt(8004),
      productId: product1.id,
      title: 'Premium Wireless Headphones',
      quantity: 2,
      priceCents: 20000,
      totalCents: 40000,
      sku: 'HEAD-001',
    },
  });

  await prisma.orderLineItem.upsert({
    where: {
      tenantId_orderId_shopifyId: {
        tenantId: tenantId,
        orderId: order5.id,
        shopifyId: BigInt(8005),
      },
    },
    update: {},
    create: {
      tenantId: tenantId,
      orderId: order5.id,
      shopifyId: BigInt(8005),
      productId: product4.id,
      title: 'Organic Coffee Beans',
      quantity: 4,
      priceCents: 8000,
      totalCents: 32000,
      sku: 'COFFEE-001',
    },
  });

  await prisma.orderLineItem.upsert({
    where: {
      tenantId_orderId_shopifyId: {
        tenantId: tenantId,
        orderId: order6.id,
        shopifyId: BigInt(8006),
      },
    },
    update: {},
    create: {
      tenantId: tenantId,
      orderId: order6.id,
      shopifyId: BigInt(8006),
      productId: product2.id,
      title: 'Smart Fitness Watch',
      quantity: 1,
      priceCents: 25000,
      totalCents: 25000,
      sku: 'WATCH-001',
    },
  });

  await prisma.orderLineItem.upsert({
    where: {
      tenantId_orderId_shopifyId: {
        tenantId: tenantId,
        orderId: order6.id,
        shopifyId: BigInt(8007),
      },
    },
    update: {},
    create: {
      tenantId: tenantId,
      orderId: order6.id,
      shopifyId: BigInt(8007),
      productId: product1.id,
      title: 'Premium Wireless Headphones',
      quantity: 1,
      priceCents: 20000,
      totalCents: 20000,
      sku: 'HEAD-001',
    },
  });

  await prisma.orderLineItem.upsert({
    where: {
      tenantId_orderId_shopifyId: {
        tenantId: tenantId,
        orderId: order7.id,
        shopifyId: BigInt(8008),
      },
    },
    update: {},
    create: {
      tenantId: tenantId,
      orderId: order7.id,
      shopifyId: BigInt(8008),
      productId: product3.id,
      title: 'Leather Laptop Bag',
      quantity: 1,
      priceCents: 35000,
      totalCents: 35000,
      sku: 'BAG-001',
    },
  });

  await prisma.orderLineItem.upsert({
    where: {
      tenantId_orderId_shopifyId: {
        tenantId: tenantId,
        orderId: order7.id,
        shopifyId: BigInt(8009),
      },
    },
    update: {},
    create: {
      tenantId: tenantId,
      orderId: order7.id,
      shopifyId: BigInt(8009),
      productId: product4.id,
      title: 'Organic Coffee Beans',
      quantity: 2,
      priceCents: 8000,
      totalCents: 16000,
      sku: 'COFFEE-001',
    },
  });

  console.log('Created line items');
  console.log('Seed completed! Tenant ID:', tenantId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
