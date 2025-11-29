# Xeno FDE – Shopify Multi-Tenant Ingestion & Insights

> **Built for Xeno FDE Internship Assignment 2025**

A production-ready multi-tenant Shopify data ingestion and insights platform that connects to multiple Shopify stores, ingests customer/order/product data, and provides real-time analytics through a modern dashboard.

## 📦 Project Structure

```
├── backend/           # Express API server
│   ├── src/
│   │   ├── index.js        # Main server
│   │   ├── auth.js         # OAuth handlers
│   │   ├── webhooks.js     # Webhook verification & processing
│   │   ├── ingestion.js    # Full import jobs
│   │   └── metrics.js      # Analytics endpoints
│   └── prisma/
│       └── schema.prisma   # Multi-tenant data models
├── dashboard/         # Next.js UI
│   └── src/app/
│       ├── page.tsx        # Overview metrics
│       ├── customers/      # Top customers page
│       └── products/       # Top products page
├── DOCS.md           # Comprehensive architecture & API docs
└── DEPLOYMENT.md     # Deployment guides (Render/Railway/Vercel)
```

## ✨ Features

- ✅ **Multi-Tenant OAuth**: Install app on multiple Shopify stores
- ✅ **Real-Time Webhooks**: Orders, customers, products, checkouts
- ✅ **Batch Ingestion**: Paginated full import with rate limit handling
- ✅ **Analytics API**: Overview, time series, top customers/products
- ✅ **Insights Dashboard**: Next.js UI with metrics visualization
- ✅ **Data Isolation**: Tenant-scoped queries with composite unique keys
- ✅ **Money Safety**: Integer cents storage, no floating-point errors
- ✅ **Audit Trail**: Soft deletes, event logging, sync job tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Neon PostgreSQL account (or any PostgreSQL)
- Shopify Partner account + development store

### 1. Clone & Install

```powershell
cd backend
npm install

cd ../dashboard
npm install
```

### 2. Set Up Database

Create a Neon PostgreSQL database and copy the connection string.

```powershell
# In backend/
cp .env.example .env
# Edit .env and set DATABASE_URL
```

Run migrations:

```powershell
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 3. Create Shopify App

1. Go to [Shopify Partners](https://partners.shopify.com)
2. Create a new app (public app with OAuth)
3. Set **App URL**: Your backend URL (e.g., `https://yourapp.com`)
4. Set **Allowed redirection URLs**: `https://yourapp.com/auth/callback`
5. Set **Scopes**: `read_customers`, `read_orders`, `read_products`, `read_draft_orders`, `read_checkouts`
6. Copy **API key** and **API secret**

### 4. Configure Environment

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
SHOPIFY_API_KEY="your_api_key"
SHOPIFY_API_SECRET="your_api_secret"
SHOPIFY_API_VERSION="2024-10"
APP_BASE_URL="https://your-backend-url.com"
SESSION_SECRET="random-secret-string"
PORT=3001
```

**Dashboard** (`dashboard/.env.local`):
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### 5. Start Services

**Backend:**
```powershell
cd backend
npm run dev
# Runs on http://localhost:3001
```

**Dashboard:**
```powershell
cd dashboard
npm run dev
# Runs on http://localhost:3000
```

### 6. Install App on Shopify Store

1. Visit: `http://localhost:3001/auth/start?shop=yourstore.myshopify.com`
2. Authorize the app
3. Note the `tenant_id` in the response

### 7. Trigger Initial Import

```powershell
curl -X POST http://localhost:3001/api/ingestion/start \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "your-tenant-id"}'
```

### 8. View Dashboard

Visit `http://localhost:3000` and enter your `tenant_id` to see metrics.

## 📊 API Endpoints

### OAuth
- `GET /auth/start?shop=store.myshopify.com` – Start OAuth flow
- `GET /auth/callback` – OAuth callback

### Webhooks
- `POST /webhooks/shopify` – Receive Shopify webhooks

### Ingestion
- `POST /api/ingestion/start` – Trigger full import

### Metrics
- `GET /api/metrics/overview?tenant_id=xxx` – Total orders, revenue, customers, AOV
- `GET /api/metrics/orders/by-date?tenant_id=xxx&from=...&to=...` – Time series
- `GET /api/metrics/customers/top?tenant_id=xxx&limit=5` – Top spenders
- `GET /api/metrics/products/top?tenant_id=xxx&limit=5` – Top products

See [DOCS.md](./DOCS.md) for complete API reference.

## 🏗 Architecture

```
Shopify Stores → OAuth/Webhooks → Express Backend → Prisma → Neon PostgreSQL
                                         ↓
                              Metrics API → Next.js Dashboard
```

- **Multi-Tenancy**: Single database with `tenant_id` scoping
- **Data Models**: Tenant, ShopifyCredential, Customer, Order, Product, OrderLineItem, Event, SyncJob
- **Isolation**: Composite unique keys `(tenant_id, shopify_id)`
- **Webhooks**: HMAC SHA256 verification, deduplication, async processing
- **Sync**: Full import via paginated Shopify API calls

See [DOCS.md](./DOCS.md) for detailed architecture diagram.

## 🚢 Deployment

### Backend (Render/Railway)
1. Connect GitHub repo
2. Set root: `backend`
3. Build: `npm install && npx prisma generate && npx prisma migrate deploy`
4. Start: `npm start`
5. Add env vars (see `.env.example`)

### Dashboard (Vercel)
1. Connect GitHub repo
2. Set root: `dashboard`
3. Set `NEXT_PUBLIC_BACKEND_URL` to backend URL

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step guides.

## 📝 Database Schema

Key tables with tenant isolation:

**Customer**: `(tenantId, shopifyId)` unique  
**Order**: `(tenantId, shopifyId)` unique, indexed by `createdAt`, `customerId`  
**Product**: `(tenantId, shopifyId)` unique  
**OrderLineItem**: `(tenantId, orderId, shopifyId)` unique  
**Event**: `(tenantId, webhookId)` unique for deduplication

Money stored as integer cents; soft deletes with `deletedAt`.

## 🔒 Security Notes

- **HMAC Verification**: All webhooks verified with SHA256
- **Token Storage**: Access tokens in DB (encrypt in production)
- **Rate Limits**: Respects Shopify API limits with pagination
- **CORS**: Enabled (whitelist domains in production)
- **SQL Injection**: Protected by Prisma parameterized queries

## 📈 Next Steps

- [ ] Add email authentication (NextAuth)
- [ ] Implement scheduler for delta sync
- [ ] Add Redis/RabbitMQ for event queue
- [ ] Create advanced charts (cohort analysis, retention)
- [ ] Add CSV export for reports
- [ ] Set up CI/CD pipeline
- [ ] Write automated tests (Jest)
- [ ] Enable Postgres RLS for stronger isolation

See [DOCS.md](./DOCS.md) for complete production checklist.

## 🎥 Demo Video

[Link to demo video will be here]

## 📄 License

MIT

## 👤 Author

Built for Xeno FDE Internship Assignment 2025  
[Your Name]

