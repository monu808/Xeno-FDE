# Testing Guide

## Unit Testing

### Backend API Tests

Test the metrics endpoints:

```powershell
# Overview metrics
curl "http://localhost:3001/api/metrics/overview?tenant_id=YOUR_TENANT_ID"

# Orders by date
curl "http://localhost:3001/api/metrics/orders/by-date?tenant_id=YOUR_TENANT_ID&from=2024-01-01&to=2024-12-31&granularity=day"

# Top customers
curl "http://localhost:3001/api/metrics/customers/top?tenant_id=YOUR_TENANT_ID&limit=5"

# Top products
curl "http://localhost:3001/api/metrics/products/top?tenant_id=YOUR_TENANT_ID&limit=5"
```

### Health Check

```powershell
curl http://localhost:3001/health
# Expected: {"ok": true}
```

## OAuth Flow Testing

1. Start backend server
2. Visit: `http://localhost:3001/auth/start?shop=yourstore.myshopify.com`
3. Authorize app in Shopify
4. Note the tenant_id in response
5. Verify credentials in database:

```sql
SELECT * FROM "ShopifyCredential";
```

## Webhook Testing

### Manual Webhook Test

```powershell
# Create test webhook payload
$body = @{
  id = 12345
  email = "test@example.com"
  first_name = "Test"
  last_name = "User"
  total_spent = "100.00"
  currency = "USD"
} | ConvertTo-Json

# Calculate HMAC (requires your SHOPIFY_API_SECRET)
$secret = "your_shopify_api_secret"
$hmac = [Convert]::ToBase64String([System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($secret)).ComputeHash([System.Text.Encoding]::UTF8.GetBytes($body)))

# Send webhook
curl -X POST http://localhost:3001/webhooks/shopify `
  -H "Content-Type: application/json" `
  -H "X-Shopify-Topic: customers/create" `
  -H "X-Shopify-Shop-Domain: yourstore.myshopify.com" `
  -H "X-Shopify-Webhook-Id: test-webhook-123" `
  -H "X-Shopify-Hmac-SHA256: $hmac" `
  -d $body
```

### Shopify Webhook Test

1. Install app on development store
2. Create a product/customer/order in Shopify admin
3. Check backend logs for webhook receipt
4. Verify data in database:

```sql
SELECT * FROM "Event" ORDER BY "receivedAt" DESC LIMIT 10;
SELECT * FROM "Customer" ORDER BY "createdAt" DESC LIMIT 10;
SELECT * FROM "Order" ORDER BY "createdAt" DESC LIMIT 10;
```

## Ingestion Testing

### Trigger Full Import

```powershell
curl -X POST http://localhost:3001/api/ingestion/start `
  -H "Content-Type: application/json" `
  -d '{"tenant_id": "YOUR_TENANT_ID"}'
```

### Monitor Progress

Check backend logs for:
- "Starting full import for tenant..."
- "Imported X customers"
- "Imported X products"
- "Imported X orders"
- "Full import completed"

### Verify Data

```sql
-- Check sync job status
SELECT * FROM "SyncJob" ORDER BY "startedAt" DESC LIMIT 5;

-- Check imported data counts
SELECT COUNT(*) FROM "Customer" WHERE "tenantId" = 'YOUR_TENANT_ID';
SELECT COUNT(*) FROM "Product" WHERE "tenantId" = 'YOUR_TENANT_ID';
SELECT COUNT(*) FROM "Order" WHERE "tenantId" = 'YOUR_TENANT_ID';
SELECT COUNT(*) FROM "OrderLineItem" WHERE "tenantId" = 'YOUR_TENANT_ID';
```

## Dashboard Testing

### Load Dashboard

1. Visit `http://localhost:3000`
2. Enter tenant_id
3. Click "Load Metrics"
4. Verify metrics display correctly

### Test Pages

- Home: `/`
- Customers: `/customers?tenant_id=YOUR_TENANT_ID`
- Products: `/products?tenant_id=YOUR_TENANT_ID`

## Load Testing

### Concurrent Webhook Processing

Use a tool like `k6` or `artillery` to simulate multiple webhooks:

```javascript
// k6 script example
import http from 'k6/http';

export default function () {
  const payload = JSON.stringify({
    id: Math.floor(Math.random() * 1000000),
    email: `test${Math.random()}@example.com`,
    total_spent: "100.00"
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Topic': 'customers/create',
      'X-Shopify-Shop-Domain': 'test.myshopify.com',
      'X-Shopify-Webhook-Id': `test-${Date.now()}-${Math.random()}`,
    },
  };
  
  http.post('http://localhost:3001/webhooks/shopify', payload, params);
}
```

## Database Queries for Testing

### Multi-Tenancy Isolation Test

```sql
-- Verify no cross-tenant leaks
SELECT 
  "tenantId",
  COUNT(*) as customer_count
FROM "Customer"
GROUP BY "tenantId";

-- Check composite unique constraints work
SELECT 
  "tenantId",
  "shopifyId",
  COUNT(*) 
FROM "Customer"
GROUP BY "tenantId", "shopifyId"
HAVING COUNT(*) > 1;  -- Should return 0 rows
```

### Revenue Calculation Test

```sql
-- Manual revenue calculation vs API
SELECT 
  SUM("totalCents") / 100.0 as total_revenue_usd,
  COUNT(*) as order_count,
  AVG("totalCents") / 100.0 as avg_order_value
FROM "Order"
WHERE "tenantId" = 'YOUR_TENANT_ID'
  AND "financialStatus" IN ('paid', 'partially_paid');
```

### Top Customers Test

```sql
SELECT 
  c.email,
  c."firstName",
  c."lastName",
  SUM(o."totalCents") / 100.0 as total_spent,
  COUNT(o.id) as order_count
FROM "Customer" c
LEFT JOIN "Order" o ON o."customerId" = c.id 
  AND o."tenantId" = c."tenantId"
  AND o."financialStatus" IN ('paid', 'partially_paid')
WHERE c."tenantId" = 'YOUR_TENANT_ID'
GROUP BY c.id
ORDER BY total_spent DESC
LIMIT 5;
```

## Error Scenarios

### Test Invalid Tenant

```powershell
curl "http://localhost:3001/api/metrics/overview?tenant_id=invalid-uuid"
# Expected: 400 or empty results
```

### Test Missing HMAC

```powershell
curl -X POST http://localhost:3001/webhooks/shopify `
  -H "Content-Type: application/json" `
  -d '{"test": "data"}'
# Expected: 401 Unauthorized
```

### Test Duplicate Webhook

Send the same webhook twice with identical `X-Shopify-Webhook-Id`:
- First: Should process
- Second: Should deduplicate and return 200 without processing

## Performance Benchmarks

Expected performance targets:

- **Webhook processing**: < 100ms
- **Metrics API**: < 500ms
- **Full import (1000 orders)**: < 2 minutes
- **Database query**: < 50ms for aggregations

## Checklist Before Demo

- [ ] Backend starts without errors
- [ ] Dashboard loads correctly
- [ ] OAuth flow completes successfully
- [ ] Webhooks are received and processed
- [ ] Full import completes successfully
- [ ] All metrics endpoints return valid data
- [ ] Dashboard displays metrics accurately
- [ ] Multi-tenant isolation verified
- [ ] No sensitive data in logs
- [ ] Error handling graceful
