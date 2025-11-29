# Quick Commands Reference

## Development

### Backend
```powershell
# Setup
cd backend
npm install
cp .env.example .env
# Edit .env with your values

# Database
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed  # Optional: add demo data

# Start server
npm run dev
# Runs on http://localhost:3001
```

### Dashboard
```powershell
# Setup
cd dashboard
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Start dev server
npm run dev
# Runs on http://localhost:3000
```

## Common Tasks

### Install Shopify App
```
Visit: http://localhost:3001/auth/start?shop=yourstore.myshopify.com
```

### Trigger Data Import
```powershell
curl -X POST http://localhost:3001/api/ingestion/start `
  -H "Content-Type: application/json" `
  -d '{"tenant_id": "YOUR_TENANT_ID"}'
```

### View Metrics
```
Dashboard: http://localhost:3000
API: http://localhost:3001/api/metrics/overview?tenant_id=YOUR_TENANT_ID
```

## Database Management

### View Schema
```powershell
cd backend
npx prisma studio
# Opens GUI at http://localhost:5555
```

### Reset Database
```powershell
cd backend
npx prisma migrate reset
npx prisma db seed
```

### Create Migration
```powershell
cd backend
npx prisma migrate dev --name your_migration_name
```

## Deployment

### Backend to Render
1. Create Web Service
2. Build: `npm install && npx prisma generate && npx prisma migrate deploy`
3. Start: `npm start`
4. Add environment variables from `.env.example`

### Dashboard to Vercel
```powershell
cd dashboard
npm install -g vercel
vercel
# Follow prompts
```

## Testing

### Health Check
```powershell
curl http://localhost:3001/health
```

### Test Metrics Endpoint
```powershell
curl "http://localhost:3001/api/metrics/overview?tenant_id=TENANT_ID"
curl "http://localhost:3001/api/metrics/customers/top?tenant_id=TENANT_ID&limit=5"
curl "http://localhost:3001/api/metrics/products/top?tenant_id=TENANT_ID&limit=5"
```

### View Logs
```powershell
# Backend logs show:
# - Webhook receipts
# - Import progress
# - API requests
# - Errors
```

## Troubleshooting

### Backend won't start
- Check DATABASE_URL is set correctly
- Run `npx prisma generate`
- Check port 3001 is available

### Dashboard can't connect
- Verify NEXT_PUBLIC_BACKEND_URL in `.env.local`
- Check backend is running
- Check CORS is enabled in backend

### OAuth fails
- Verify SHOPIFY_API_KEY and SHOPIFY_API_SECRET
- Check APP_BASE_URL matches Shopify app settings
- Ensure redirect URL is whitelisted in Shopify

### Webhooks not received
- Check APP_BASE_URL is publicly accessible (use ngrok for local dev)
- Verify HMAC secret matches
- Check webhook subscriptions in Shopify admin

### No data after import
- Check sync job status in database
- View backend logs for errors
- Verify Shopify store has data
- Check access token scopes

## Database Queries

### List all tenants
```sql
SELECT * FROM "Tenant";
```

### Check webhook events
```sql
SELECT * FROM "Event" ORDER BY "receivedAt" DESC LIMIT 10;
```

### View sync jobs
```sql
SELECT * FROM "SyncJob" ORDER BY "startedAt" DESC LIMIT 10;
```

### Get tenant metrics
```sql
SELECT 
  COUNT(DISTINCT c.id) as customers,
  COUNT(DISTINCT o.id) as orders,
  SUM(o."totalCents") / 100.0 as revenue
FROM "Tenant" t
LEFT JOIN "Customer" c ON c."tenantId" = t.id
LEFT JOIN "Order" o ON o."tenantId" = t.id
WHERE t.id = 'YOUR_TENANT_ID';
```

## Git Commands

```powershell
# Initial commit
git init
git add .
git commit -m "Initial commit: Xeno FDE assignment"

# Push to GitHub
git remote add origin https://github.com/yourusername/Xeno-FDE.git
git branch -M main
git push -u origin main
```

## Environment Variables Summary

### Backend (.env)
```env
DATABASE_URL=postgresql://...
SHOPIFY_API_KEY=your_key
SHOPIFY_API_SECRET=your_secret
SHOPIFY_API_VERSION=2024-10
APP_BASE_URL=https://your-backend.com
SESSION_SECRET=random-string
PORT=3001
```

### Dashboard (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Demo Recording Checklist

1. Show architecture diagram
2. Demo OAuth installation
3. Trigger full import
4. Create test order in Shopify
5. Show webhook receipt in logs
6. Display metrics in dashboard
7. Explain multi-tenancy approach
8. Discuss trade-offs and next steps
