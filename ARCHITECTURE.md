# Architecture Diagram

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SHOPIFY ECOSYSTEM                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │   Store A    │  │   Store B    │  │   Store C    │  (Multi-tenant) │
│  │  (Tenant 1)  │  │  (Tenant 2)  │  │  (Tenant 3)  │                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                  │                  │                         │
└─────────┼──────────────────┼──────────────────┼─────────────────────────┘
          │                  │                  │
          │ OAuth Install    │ Webhooks         │ API Calls
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express + Node.js)                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     API ROUTES (src/index.js)                   │   │
│  │  • GET  /health                                                 │   │
│  │  • GET  /auth/start          → OAuth Module                     │   │
│  │  • GET  /auth/callback       → OAuth Module                     │   │
│  │  • POST /webhooks/shopify    → Webhook Module                   │   │
│  │  • POST /api/ingestion/start → Ingestion Module                 │   │
│  │  • GET  /api/metrics/*       → Metrics Module                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ auth.js      │  │ webhooks.js  │  │ ingestion.js │  │ metrics.js │ │
│  │              │  │              │  │              │  │            │ │
│  │ • OAuth Flow │  │ • HMAC Check │  │ • Full Import│  │ • Overview │ │
│  │ • Token Mgmt │  │ • Dedup      │  │ • Pagination │  │ • Timeseries│
│  │ • Webhook    │  │ • Async Proc │  │ • Upserts    │  │ • Top N    │ │
│  │   Register   │  │ • Retry      │  │ • Rate Limit │  │ • Filters  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬─────┘ │
│         │                  │                  │                 │       │
│         └──────────────────┴──────────────────┴─────────────────┘       │
│                                 │                                        │
│                                 ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    PRISMA ORM LAYER                             │   │
│  │  • Query Builder   • Type Safety   • Migrations   • Validation │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NEON POSTGRESQL DATABASE                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Tenant (id, storeDomain, name, status)                          │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ ShopifyCredential (tenantId, accessToken, scopes, apiVersion)   │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Customer (tenantId, shopifyId, email, totalSpentCents, ...)     │   │
│  │   UNIQUE: (tenantId, shopifyId)                                 │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Product (tenantId, shopifyId, title, status, vendor, ...)       │   │
│  │   UNIQUE: (tenantId, shopifyId)                                 │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Order (tenantId, shopifyId, customerId, totalCents, ...)        │   │
│  │   UNIQUE: (tenantId, shopifyId)                                 │   │
│  │   INDEX: (tenantId, createdAt), (tenantId, customerId)          │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ OrderLineItem (tenantId, orderId, shopifyId, productId, ...)    │   │
│  │   UNIQUE: (tenantId, orderId, shopifyId)                        │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Event (tenantId, topic, webhookId, payloadJson, status, ...)    │   │
│  │   Used for webhook deduplication and async processing           │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ SyncJob (tenantId, type, status, cursor, errorMsg, ...)         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  │ REST API Calls
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DASHBOARD (Next.js 14 + React)                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        PAGES                                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │   Home       │  │  Customers   │  │   Products   │          │   │
│  │  │  (page.tsx)  │  │  (/customers)│  │  (/products) │          │   │
│  │  │              │  │              │  │              │          │   │
│  │  │ • Input      │  │ • Top N      │  │ • Top N      │          │   │
│  │  │   tenant_id  │  │   by spend   │  │   by revenue │          │   │
│  │  │ • Overview   │  │ • Table view │  │ • Table view │          │   │
│  │  │   metrics    │  │              │  │              │          │   │
│  │  │ • Cards      │  │              │  │              │          │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   SHARED COMPONENTS                             │   │
│  │  • Layout (layout.tsx)                                          │   │
│  │  • Global Styles (globals.css)                                  │   │
│  │  • API Client (fetch with NEXT_PUBLIC_BACKEND_URL)             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### OAuth Installation Flow

```
User                Shopify              Backend              Database
  │                    │                    │                    │
  │ 1. Visit /auth/start?shop=...          │                    │
  ├──────────────────────────────────────>│                    │
  │                    │                    │                    │
  │ 2. Redirect to Shopify OAuth           │                    │
  │<───────────────────┤                    │                    │
  │                    │                    │                    │
  │ 3. User authorizes │                    │                    │
  ├──────────────────>│                    │                    │
  │                    │                    │                    │
  │                    │ 4. Callback with code                   │
  │                    ├──────────────────>│                    │
  │                    │                    │                    │
  │                    │ 5. Exchange code   │                    │
  │                    │    for token       │                    │
  │                    │<──────────────────>│                    │
  │                    │                    │                    │
  │                    │                    │ 6. Store tenant    │
  │                    │                    ├──────────────────>│
  │                    │                    │                    │
  │                    │                    │ 7. Store creds     │
  │                    │                    ├──────────────────>│
  │                    │                    │                    │
  │                    │ 8. Register webhooks                    │
  │                    │<──────────────────│                    │
  │                    │                    │                    │
  │ 9. Return tenant_id                    │                    │
  │<───────────────────────────────────────┤                    │
```

### Webhook Processing Flow

```
Shopify              Backend              Worker               Database
  │                    │                    │                    │
  │ 1. Event occurs    │                    │                    │
  │ (order created)    │                    │                    │
  │                    │                    │                    │
  │ 2. POST /webhooks/shopify              │                    │
  ├──────────────────>│                    │                    │
  │    + HMAC header   │                    │                    │
  │                    │                    │                    │
  │                    │ 3. Verify HMAC    │                    │
  │                    │    (SHA256)        │                    │
  │                    │                    │                    │
  │                    │ 4. Check duplicate │                    │
  │                    ├──────────────────────────────────────>│
  │                    │                    │                    │
  │                    │ 5. Store event     │                    │
  │                    ├──────────────────────────────────────>│
  │                    │                    │                    │
  │ 6. Return 200 OK   │                    │                    │
  │<───────────────────┤                    │                    │
  │                    │                    │                    │
  │                    │ 7. Async process   │                    │
  │                    ├──────────────────>│                    │
  │                    │                    │                    │
  │                    │                    │ 8. Parse payload   │
  │                    │                    │                    │
  │                    │                    │ 9. Upsert entity   │
  │                    │                    ├──────────────────>│
  │                    │                    │                    │
  │                    │                    │ 10. Update event   │
  │                    │                    │     status         │
  │                    │                    ├──────────────────>│
```

### Full Import Flow

```
Client               Backend              Shopify API          Database
  │                    │                    │                    │
  │ 1. POST /api/ingestion/start           │                    │
  ├──────────────────>│                    │                    │
  │   {tenant_id}      │                    │                    │
  │                    │                    │                    │
  │                    │ 2. Create sync job │                    │
  │                    ├──────────────────────────────────────>│
  │                    │                    │                    │
  │ 3. Return started  │                    │                    │
  │<───────────────────┤                    │                    │
  │                    │                    │                    │
  │                    │ 4. Fetch customers (paginated)         │
  │                    ├──────────────────>│                    │
  │                    │                    │                    │
  │                    │ 5. Return page 1   │                    │
  │                    │<───────────────────┤                    │
  │                    │                    │                    │
  │                    │ 6. Upsert batch    │                    │
  │                    ├──────────────────────────────────────>│
  │                    │                    │                    │
  │                    │ 7. Fetch page 2... │                    │
  │                    ├──────────────────>│                    │
  │                    │                    │                    │
  │                    │ (Repeat for products, orders)          │
  │                    │                    │                    │
  │                    │ 8. Update job status                   │
  │                    ├──────────────────────────────────────>│
```

### Metrics Query Flow

```
Dashboard            Backend              Database
  │                    │                    │
  │ 1. Load page with tenant_id            │
  ├──────────────────>│                    │
  │                    │                    │
  │                    │ 2. GET /api/metrics/overview           │
  │                    │                    │
  │                    │ 3. Query orders    │
  │                    ├──────────────────>│
  │                    │    WHERE tenantId  │
  │                    │                    │
  │                    │ 4. Query customers │
  │                    ├──────────────────>│
  │                    │    WHERE tenantId  │
  │                    │                    │
  │                    │ 5. Return counts   │
  │                    │    and sums        │
  │                    │<───────────────────┤
  │                    │                    │
  │ 6. Return JSON     │                    │
  │    {totalOrders,   │                    │
  │     totalRevenue,  │                    │
  │     ...}           │                    │
  │<───────────────────┤                    │
  │                    │                    │
  │ 7. Render metrics  │                    │
```

## Multi-Tenancy Isolation Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                          │
│  • Express middleware checks tenant context                 │
│  • All queries include WHERE tenantId = ?                   │
│  • Prisma models enforce tenant scoping                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE LAYER                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Composite Unique Constraints:                       │   │
│  │  • (tenantId, shopifyId) on Customer               │   │
│  │  • (tenantId, shopifyId) on Product                │   │
│  │  • (tenantId, shopifyId) on Order                  │   │
│  │  • (tenantId, orderId, shopifyId) on LineItem      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Indexes for Performance:                            │   │
│  │  • (tenantId) on all tables                         │   │
│  │  • (tenantId, createdAt) on Order                   │   │
│  │  • (tenantId, customerId) on Order                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Foreign Key Relationships:                          │   │
│  │  • All FKs include onDelete: Cascade               │   │
│  │  • Deleting tenant removes all child records        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

Benefits:
✓ Simple to manage (single database)
✓ Easy to scale horizontally
✓ Cost-effective (shared resources)
✓ Efficient queries with proper indexes
✓ Strong consistency guarantees
✓ Audit trail across tenants

Future Enhancement:
• Postgres Row-Level Security (RLS) for extra safety
• Read replicas for analytics queries
• Tenant-specific database schemas (if strict isolation required)
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USERS / BROWSERS                        │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
             │ HTTPS                          │ HTTPS
             ▼                                ▼
┌─────────────────────────┐    ┌─────────────────────────────┐
│   VERCEL (Dashboard)    │    │  RENDER/RAILWAY (Backend)   │
│  • Next.js 14           │    │  • Express server           │
│  • React pages          │    │  • Prisma client            │
│  • SSR/SSG              │    │  • Webhook endpoint         │
│  • API routes (opt)     │    │  • OAuth handlers           │
│  • CDN cached           │    │  • Metrics API              │
└────────────┬────────────┘    └────────────┬────────────────┘
             │                              │
             │ API Calls                    │ DB Queries
             │                              │
             └──────────────┬───────────────┘
                            ▼
              ┌─────────────────────────────┐
              │   NEON POSTGRESQL           │
              │  • Multi-tenant tables      │
              │  • Automatic backups        │
              │  • Connection pooling       │
              │  • SSL enforced             │
              └─────────────────────────────┘
                            │
                            │ (Future)
                            ▼
              ┌─────────────────────────────┐
              │   REDIS/RABBITMQ            │
              │  • Event queue              │
              │  • Webhook processing       │
              │  • Rate limiting            │
              └─────────────────────────────┘
```

---

**Legend:**
- `│ ▼ ┌ └ ─`: ASCII art for boxes and arrows
- `→ ←`: Direct connections
- `├ ┤`: Branches and joins
