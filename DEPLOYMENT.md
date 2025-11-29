# Backend Deployment on Render/Railway

## Render

1. Create new Web Service
2. Connect GitHub repo
3. Set Root Directory: `backend`
4. Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
5. Start Command: `npm start`
6. Add environment variables:
   - `DATABASE_URL`
   - `SHOPIFY_API_KEY`
   - `SHOPIFY_API_SECRET`
   - `SHOPIFY_API_VERSION`
   - `APP_BASE_URL` (your Render URL)
   - `SESSION_SECRET`
   - `PORT` (default: 10000)

## Railway

1. Create new project
2. Connect GitHub repo
3. Add PostgreSQL service (or use Neon)
4. Set Root Directory: `backend`
5. Add start command: `npm install && npx prisma generate && npx prisma migrate deploy && npm start`
6. Add environment variables (same as Render)

## Important Notes

- Ensure `APP_BASE_URL` matches your deployed backend URL for webhooks
- Use stable HTTPS URLs for webhook endpoints
- Prisma migrations must run before starting the server
- Store sensitive tokens encrypted in production
