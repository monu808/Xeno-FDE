# Xeno FDE – Shopify Multi-Tenant Ingestion & Insights

> **Built for Xeno FDE Internship Assignment 2025**

A production-ready multi-tenant Shopify data ingestion and insights platform that connects to multiple Shopify stores, ingests customer/order/product data, and provides real-time analytics through a modern dashboard.

🔗 **Live Demo:**
- **Backend API:** https://xeno-fde-backend.vercel.app/
- **Dashboard:** https://xeno-fde-dashboard.vercel.app/
- **Test Tenant ID:** `c19dfaaf-19e0-43c1-8d7d-5de83855d427`

## 📦 Project Structure

```
├── backend/           # Express API server (Node.js + Prisma)
│   ├── api/
│   │   └── index.js        # Vercel serverless function wrapper
│   ├── src/
│   │   ├── index.js        # Main Express app
│   │   ├── auth.js         # OAuth handlers
│   │   ├── webhooks.js     # Webhook verification & processing
│   │   ├── ingestion.js    # Full import jobs
│   │   └── metrics.js      # Analytics endpoints
│   ├── prisma/
│   │   ├── schema.prisma   # Multi-tenant data models (8 models)
│   │   └── seed.js         # Mock data for testing
│   └── vercel.json         # Serverless routing config
├── dashboard/         # Next.js 14 UI (TypeScript + React 18)
│   └── src/app/
│       ├── page.tsx           # Overview metrics with navigation
│       ├── customers/page.tsx # Top customers with spend & order count
│       └── products/page.tsx  # Top products with revenue & avg price
## ✨ Features

- ✅ **Multi-Tenant OAuth**: Install app on multiple Shopify stores
- ✅ **Real-Time Webhooks**: Orders, customers, products, checkouts
- ✅ **Batch Ingestion**: Paginated full import with rate limit handling
- ✅ **Analytics API**: Overview, time series, top customers/products
- ✅ **Modern Dashboard**: Next.js 14 UI with three pages:
  - **Overview**: Total revenue, orders, customers, avg order value
  - **Top Customers**: Ranked by total spending with order counts
  - **Top Products**: Best-sellers by revenue with units sold & average price
- ✅ **Data Isolation**: Tenant-scoped queries with composite unique keys
- ✅ **Money Safety**: Integer cents storage, no floating-point errors
- ✅ **Serverless Deployment**: Both backend and frontend on Vercel
- ✅ **Production Database**: PostgreSQL on Neon (8 data models)
- ✅ **Audit Trail**: Soft deletes, event logging, sync job trackings
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
### 8. View Dashboard

Visit `http://localhost:3000?tenant_id=your-tenant-id` to see metrics.

**Dashboard Features:**
- **Home Page**: Enter tenant ID to load 4 key metrics, then navigate to detailed pages
- **Top Customers** (`/customers`): View customers ranked by spending with email, total spent, and order count
- **Top Products** (`/products`): View best-selling products with revenue, units sold, and average price per unit
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
## 🚢 Deployment

**Currently Deployed on Vercel:**

### Backend (Vercel Serverless)
1. Create new Vercel project from GitHub repo
2. Set **Root Directory**: `backend`
3. Environment Variables:
   ```
   DATABASE_URL=your_neon_postgres_url
   SHOPIFY_API_KEY=your_api_key
   SHOPIFY_API_SECRET=your_api_secret
   SHOPIFY_API_VERSION=2024-10
   APP_BASE_URL=https://your-backend.vercel.app
   SESSION_SECRET=random_string
   ```
4. Deploy – Vercel auto-detects Node.js and runs build

### Dashboard (Vercel)
1. Create new Vercel project from same GitHub repo
2. Set **Root Directory**: `dashboard`
3. Environment Variable:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.vercel.app
   ```
   ⚠️ **Important**: No trailing slash in backend URL
4. Deploy – Vercel auto-detects Next.js

**Key Configuration:**
- Backend uses `api/index.js` wrapper for serverless functions
- `vercel.json` routes all traffic to Express app
- CORS configured with regex for preview deployments: `/^https:\/\/xeno-fde-dashboard.*\.vercel\.app$/`
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
## 🎥 Demo Video & Resources

- **Video Script**: See [VIDEO_SCRIPT.md](./VIDEO_SCRIPT.md) for 5-minute walkthrough
- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- **GitHub Repository**: https://github.com/monu808/Xeno-FDE

## 🧪 Testing the Live Demo

```bash
# Test backend API
curl "https://xeno-fde-backend-rfkz4lmko-narendra-singhs-projects-90b1d8d1.vercel.app/api/metrics/overview?tenant_id=c19dfaaf-19e0-43c1-8d7d-5de83855d427"

# Expected Response:
# {
#   "totalRevenue": "2717.00",
#   "totalOrders": 7,
#   "totalCustomers": 4,
#   "averageOrderValue": "388.14"
# }

# Test dashboard
# Visit: https://xeno-fde-dashboard-4ulok47dn-narendra-singhs-projects-90b1d8d1.vercel.app/?tenant_id=c19dfaaf-19e0-43c1-8d7d-5de83855d427
```

## 📊 Sample Data

Mock data is seeded for testing:
- **4 Customers**: Jane Doe, John Smith, Alice Johnson, Bob Williams
- **7 Orders**: Totaling $2,717 in revenue
- **5 Products**: Including MacBook Pro, iPhone 14, AirPods, etc.

## 📄 License

MIT

## 👤 Author

Built for Xeno FDE Internship Assignment 2025  
Narendra Singhmail authentication (NextAuth)
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

