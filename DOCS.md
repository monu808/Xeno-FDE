# Xeno FDE Assignment – Architecture & Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Assumptions](#assumptions)
4. [Data Models](#data-models)
5. [API Endpoints](#api-endpoints)
6. [Multi-Tenancy](#multi-tenancy)
7. [Deployment](#deployment)
8. [Next Steps](#next-steps)

---

## Overview

This project implements a **multi-tenant Shopify data ingestion and insights service** that:
- Connects to multiple Shopify stores via OAuth
- Ingests customers, orders, products, and checkout events
- Stores data in Neon PostgreSQL with strict tenant isolation
- Provides real-time webhooks and scheduled sync
- Exposes metrics APIs for analytics
- Visualizes insights in a Next.js dashboard

**Tech Stack:**
- Backend: Node.js (Express), Prisma ORM
- Frontend: Next.js 14, React
- Database: Neon PostgreSQL
- Deployment: Vercel (dashboard), Render/Railway (backend)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Shopify Stores                          │
│                   (Multiple Tenants/Merchants)                  │
└──────────────┬──────────────────────┬───────────────────────────┘
               │                      │
               │ OAuth Install        │ Webhooks (orders, customers, products)
               │                      │
               ▼                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Express Backend (Node.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ OAuth Handler│  │Webhook HMAC  │  │ Ingestion Workers     │ │
│  │  /auth/*     │  │Verification  │  │ (Paginated Fetches)   │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Metrics API (/api/metrics/*)                   │ │
│  │  - Overview, Orders by Date, Top Customers, Top Products   │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────┬───────────────────────────────────────────────────┘
               │
               │ Prisma ORM
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Neon PostgreSQL                             │
│  Tables: Tenant, ShopifyCredential, Customer, Order, Product,   │
│          OrderLineItem, Event, SyncJob                           │
│  Isolation: tenant_id + shopify_id composite keys               │
└──────────────────────────────────────────────────────────────────┘
               ▲
               │ API Calls
               │
┌──────────────────────────────────────────────────────────────────┐
│                   Next.js Dashboard (Vercel)                     │
│  Pages: Home (Metrics Overview), Customers, Products            │
│  Auth: Email-based (future: NextAuth)                           │
│  Charts: Chart.js / Recharts                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Assumptions

1. **Multi-Tenancy**: Each Shopify store = one tenant; identified by `store_domain` (`*.myshopify.com`).
2. **OAuth Flow**: Public Shopify app with OAuth; tenants install via `/auth/start?shop=store.myshopify.com`.
3. **Data Isolation**: Single database with `tenant_id` column scoping; all queries filtered by tenant.
4. **Money Handling**: Stored as integer cents (`totalCents`, `priceCents`) with `currency` field; avoids floating-point errors.
5. **Webhooks**: HMAC SHA256 verification; deduplication via `webhook_id`; async processing with retry on failure.
6. **Initial Sync**: Manual trigger via `POST /api/ingestion/start` with `tenant_id`; future: auto-trigger on OAuth install.
7. **Rate Limits**: Respect Shopify API limits; paginate with `page_info` (REST) or cursors (GraphQL).
8. **Checkouts**: Tracked via `checkouts/create`, `checkouts/update` webhooks; stored in `Event` table for bonus analytics.
9. **Soft Deletes**: Products/customers have `deletedAt` for audit trails.
10. **Authentication**: Dashboard currently uses tenant_id query param; production should use JWT/session + tenant mapping.

---

## Data Models

### Key Tables (Prisma Schema)

**Tenant**
- `id` (UUID), `storeDomain` (unique), `name`, `status`, timestamps

**ShopifyCredential**
- `id`, `tenantId` (FK), `accessToken`, `scopes`, `apiVersion`, `storefrontToken?`

**Customer**
- `id`, `tenantId`, `shopifyId` (BigInt), `email`, `firstName`, `lastName`, `totalSpentCents`, `currency`
- **Unique**: `(tenantId, shopifyId)`

**Product**
- `id`, `tenantId`, `shopifyId`, `title`, `status`, `productType`, `vendor`, `deletedAt?`
- **Unique**: `(tenantId, shopifyId)`

**Order**
- `id`, `tenantId`, `shopifyId`, `customerId?` (FK), `name`, `status`, `financialStatus`, `fulfillmentStatus`
- `subtotalCents`, `totalCents`, `taxCents`, `currency`, `processedAt`, `canceledAt?`
- **Unique**: `(tenantId, shopifyId)`
- **Indexes**: `(tenantId, createdAt)`, `(tenantId, customerId)`

**OrderLineItem**
- `id`, `tenantId`, `orderId` (FK), `shopifyId`, `productId?` (FK), `title`, `quantity`, `priceCents`, `totalCents`, `sku`, `variantId?`
- **Unique**: `(tenantId, orderId, shopifyId)`

**Event**
- `id`, `tenantId`, `topic`, `entityType`, `entityId`, `payloadJson`, `webhookId`, `storeDomain`, `receivedAt`, `processedAt?`, `status`, `errorMsg?`
- **Unique**: `(tenantId, webhookId)` – deduplication

**SyncJob**
- `id`, `tenantId`, `type` (full|delta|rehydrate), `status`, `startedAt`, `finishedAt?`, `cursor?`, `errorMsg?`

---

## API Endpoints

### OAuth & Install
- `GET /auth/start?shop=store.myshopify.com` – Redirects to Shopify OAuth
- `GET /auth/callback?code=...&shop=...` – Exchanges code for token, stores credentials, registers webhooks

### Webhooks
- `POST /webhooks/shopify` – Receives Shopify webhooks (HMAC verified)
  - Topics: `orders/create`, `orders/updated`, `customers/*`, `products/*`, `checkouts/*`

### Ingestion
- `POST /api/ingestion/start` – Triggers full import for tenant
  - Body: `{ "tenant_id": "uuid" }`

### Metrics
- `GET /api/metrics/overview?tenant_id=xxx&from=...&to=...`
  - Returns: `totalOrders`, `totalRevenueCents`, `totalCustomers`, `averageOrderValueCents`

- `GET /api/metrics/orders/by-date?tenant_id=xxx&granularity=day&from=...&to=...`
  - Returns: Time series of orders and revenue by date

- `GET /api/metrics/customers/top?tenant_id=xxx&limit=5&from=...&to=...`
  - Returns: Top customers by spend

- `GET /api/metrics/products/top?tenant_id=xxx&limit=5&from=...&to=...`
  - Returns: Top products by revenue

---

## Multi-Tenancy

### Strategy
- **Single Database, Row-Level Scoping**: All tables include `tenantId` column.
- **Composite Unique Keys**: `(tenantId, shopifyId)` ensures no cross-tenant collisions.
- **Query Enforcement**: All Prisma queries include `where: { tenantId }`.
- **Future Enhancement**: Postgres Row-Level Security (RLS) for defense-in-depth.

### Token Storage
- Stored per-tenant in `ShopifyCredential` table.
- Production: Encrypt `accessToken` at rest using `AES-256-GCM` or similar.

### Webhook Routing
- `X-Shopify-Shop-Domain` header identifies tenant.
- Lookup tenant by `storeDomain`, attach `tenantId` to event.

---

## Deployment

### Backend (Render/Railway)
1. Connect GitHub repo
2. Set root directory: `backend`
3. Build: `npm install && npx prisma generate && npx prisma migrate deploy`
4. Start: `npm start`
5. Set env vars: `DATABASE_URL`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `APP_BASE_URL`, `SESSION_SECRET`

### Dashboard (Vercel)
1. Connect GitHub repo
2. Set root directory: `dashboard`
3. Framework: Next.js
4. Build: Auto-detected
5. Set env var: `NEXT_PUBLIC_BACKEND_URL` (backend URL)

### Database (Neon)
1. Create Neon project
2. Copy connection string
3. Update `DATABASE_URL` in backend `.env`
4. Run migrations: `npx prisma migrate deploy`

---

## Next Steps to Production

### Security
- [ ] Encrypt Shopify access tokens at rest
- [ ] Implement JWT/session-based auth for dashboard
- [ ] Add rate limiting (express-rate-limit)
- [ ] Enable Postgres RLS for tenant isolation
- [ ] Validate all inputs with Zod/Joi
- [ ] CORS whitelist for production domains

### Observability
- [ ] Structured logging (Winston/Pino)
- [ ] Request tracing (correlation IDs)
- [ ] Metrics export (Prometheus/DataDog)
- [ ] Alerts for webhook failures, ingestion lag

### Scalability
- [ ] Add Redis/RabbitMQ for async event processing
- [ ] Horizontal scaling with load balancer
- [ ] Database connection pooling (PgBouncer)
- [ ] GraphQL API for efficient bulk queries
- [ ] Caching layer for metrics (Redis)

### Features
- [ ] Automated delta sync scheduler (cron)
- [ ] Real-time dashboard updates (WebSockets/SSE)
- [ ] Email notifications for sync failures
- [ ] Custom date range filters in UI
- [ ] CSV export for reports
- [ ] Advanced charts (cohort analysis, retention)

### DevOps
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated tests (Jest, Supertest)
- [ ] Database backups and restore runbooks
- [ ] Blue-green deployments
- [ ] Environment promotion (dev → staging → prod)

---

## Known Limitations

1. **No Session Store**: State/nonce for OAuth not persisted (use Redis in prod).
2. **No Auth**: Dashboard lacks user authentication; tenant_id passed in URL.
3. **Webhook Ordering**: Webhooks may arrive out of order; idempotent upserts mitigate.
4. **No Dead Letter Queue**: Failed events logged but not retried automatically.
5. **Checkouts**: Basic webhook capture; full abandoned cart analytics not implemented.
6. **Single Region**: No multi-region or HA setup.

---

## Author

Built for **Xeno FDE Internship Assignment 2025** by [Your Name].

For questions or demo walkthrough, see the video submission.
