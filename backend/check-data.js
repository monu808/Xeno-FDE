import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    const orders = await prisma.order.findMany({
      where: { tenantId: 'c19dfaaf-19e0-43c1-8d7d-5de83855d427' }
    });
    
    console.log('Orders found:', orders.length);
    orders.forEach(o => {
      console.log('Order:', o.shopifyOrderId, 'Total Price:', o.totalPrice, 'Type:', typeof o.totalPrice);
    });
    
    const customers = await prisma.customer.findMany({
      where: { tenantId: 'c19dfaaf-19e0-43c1-8d7d-5de83855d427' }
    });
    
    console.log('\nCustomers found:', customers.length);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
