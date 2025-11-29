# Xeno FDE Setup Checklist

## Pre-requisites
- [ ] Node.js 18+ installed
- [ ] Neon PostgreSQL account created
- [ ] Shopify Partner account created
- [ ] Shopify development store created

## Shopify App Setup
- [ ] Create public Shopify app in Partners dashboard
- [ ] Note API key and API secret
- [ ] Set App URL to backend URL
- [ ] Set redirect URL to `{backend}/auth/callback`
- [ ] Enable scopes: `read_customers`, `read_orders`, `read_products`, `read_draft_orders`, `read_checkouts`

## Backend Setup
- [ ] Copy `backend/.env.example` to `backend/.env`
- [ ] Fill in `DATABASE_URL` (Neon connection string)
- [ ] Fill in `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET`
- [ ] Set `APP_BASE_URL` to backend URL (for webhooks)
- [ ] Generate random `SESSION_SECRET`
- [ ] Run `npm install` in `backend/`
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma migrate dev --name init`
- [ ] Start backend: `npm run dev`

## Dashboard Setup
- [ ] Copy `dashboard/.env.example` to `dashboard/.env.local`
- [ ] Set `NEXT_PUBLIC_BACKEND_URL` to backend URL
- [ ] Run `npm install` in `dashboard/`
- [ ] Start dashboard: `npm run dev`

## Testing
- [ ] Visit `/auth/start?shop=yourstore.myshopify.com`
- [ ] Authorize app installation
- [ ] Copy tenant_id from response
- [ ] Trigger full import: `POST /api/ingestion/start` with tenant_id
- [ ] Create test order/customer/product in Shopify
- [ ] Verify webhooks received in backend logs
- [ ] Load dashboard with tenant_id and view metrics

## Deployment
- [ ] Deploy backend to Render/Railway
- [ ] Deploy dashboard to Vercel
- [ ] Update Shopify app URLs to production URLs
- [ ] Update env vars in deployment platforms
- [ ] Test OAuth flow on production
- [ ] Test webhook delivery on production

## Demo Preparation
- [ ] Record 5-7 min demo video
- [ ] Show OAuth installation
- [ ] Show data ingestion
- [ ] Show dashboard metrics
- [ ] Explain architecture and trade-offs
- [ ] Upload to YouTube/Loom

## Submission
- [ ] Push code to GitHub (public repo)
- [ ] Update README with deployed URLs
- [ ] Add demo video link to README
- [ ] Submit via provided link before deadline
