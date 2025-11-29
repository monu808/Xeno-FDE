# Vercel Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)
- Neon PostgreSQL database (already set up)
- Shopify API credentials (get from Partners dashboard)

## Step 1: Push Code to GitHub

Your code is already on GitHub at: https://github.com/monu808/Xeno-FDE

## Step 2: Deploy Backend to Vercel

### Via Vercel CLI (Recommended)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Deploy backend:**
```bash
cd backend
vercel
```

3. **Add environment variables:**

Go to your Vercel project → Settings → Environment Variables, and add:

- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `SHOPIFY_API_KEY` - From Shopify Partners dashboard
- `SHOPIFY_API_SECRET` - From Shopify Partners dashboard  
- `SHOPIFY_API_VERSION` - `2025-10`
- `APP_BASE_URL` - Your Vercel backend URL (e.g., `https://xeno-fde-backend.vercel.app`)
- `SESSION_SECRET` - Random string for session encryption
- `PORT` - `3001`

4. **Deploy to production:**
```bash
vercel --prod
```

## Step 3: Deploy Dashboard to Vercel

```bash
cd ../dashboard
vercel
```

Add environment variable in Vercel dashboard:
- `NEXT_PUBLIC_BACKEND_URL` - Your backend Vercel URL

Then deploy:
```bash
vercel --prod
```

## Step 4: Update Shopify App Settings

1. Go to https://partners.shopify.com/
2. Navigate to your app: **xeno-fde-insights-4**
3. Update URLs:
   - **App URL:** `https://YOUR-BACKEND.vercel.app`
   - **Allowed redirection URLs:** `https://YOUR-BACKEND.vercel.app/auth/callback`
4. Save changes

## Step 5: Test Deployment

1. Health check: `https://YOUR-BACKEND.vercel.app/health`
2. OAuth: `https://YOUR-BACKEND.vercel.app/auth/start?shop=xeno-test-store-5.myshopify.com`
3. Dashboard: `https://YOUR-DASHBOARD.vercel.app`

## Important Notes

- **Shopify Restrictions:** Development stores block access to customer/order data via API. Products work fine. Use mock data (already seeded) to demo the dashboard.
- **Cold Starts:** Vercel serverless functions may have initial delays
- **Timeouts:** Long operations may timeout (10s on free plan)
- **Database:** Ensure Neon allows Vercel connections

## Alternative: Deploy Backend to Render

Render provides traditional servers (better for long-running ops):

1. Go to https://render.com
2. Create "Web Service"
3. Connect GitHub repo
4. Root directory: `backend`
5. Build: `npm install && npx prisma generate && npx prisma migrate deploy`
6. Start: `npm start`
7. Add environment variables

## Quick Deployment Script

Run the PowerShell script:
```powershell
.\deploy-vercel.ps1
```

## Production Checklist

- [ ] Backend deployed
- [ ] Dashboard deployed  
- [ ] Environment variables set
- [ ] Shopify URLs updated
- [ ] Database migrations applied
- [ ] OAuth tested
- [ ] Metrics API tested

## Your URLs

Update after deployment:
- Backend: `https://YOUR-BACKEND.vercel.app`
- Dashboard: `https://YOUR-DASHBOARD.vercel.app`

## Support

See `TESTING.md` for API testing examples and `DOCS.md` for architecture details.
