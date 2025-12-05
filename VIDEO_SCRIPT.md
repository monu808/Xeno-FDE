# Xeno FDE - Video Walkthrough Script (5 minutes)

## 1. Introduction (30 sec)
"Hi, I'm presenting Xeno FDE - a Shopify analytics dashboard built for the Xeno CRM internship assignment.

This full-stack application ingests Shopify data and provides business insights. It uses Node.js backend, Next.js frontend, PostgreSQL database, all deployed on Vercel.

Let me show you how it works."

## 2. System Overview (45 sec)
**[Show ARCHITECTURE.md briefly]**

"The system flow is simple:
1. Shopify store connects via OAuth
2. Backend API ingests data using Shopify GraphQL
3. Data stored in PostgreSQL with multi-tenant architecture
4. Dashboard fetches and displays analytics via REST API

Everything is serverless on Vercel for scalability."

## 3. Dashboard Demo - Overview Page (1 min)
**[Open dashboard URL in browser]**

"Here's the live dashboard. On the home page, we see four key business metrics:

- **Total Revenue**: $2,717 from all orders
- **Total Orders**: 7 orders processed
- **Total Customers**: 4 unique customers
- **Average Order Value**: $388.14 per order

These metrics update in real-time as new orders come in. The data comes from our backend API which queries the PostgreSQL database."

## 4. Dashboard Demo - Top Customers (1 min)
**[Click on Customers page]**

"The Customers page shows our best customers ranked by total spending:

You can see each customer's:
- Name and email
- Total amount spent
- Number of orders placed

This helps identify VIP customers for targeted marketing and retention strategies. For example, our top customer has spent over $800 across multiple orders."

## 5. Dashboard Demo - Top Products (1 min)
**[Click on Products page]**

"The Products page displays best-selling items:

Each product shows:
- Product name
- Total revenue generated
- Units sold
- Average price

This data helps with inventory planning and understanding which products drive the most revenue. Our top product generated over $1,000 in sales."

## 6. Technical Highlights (45 sec)
"Key technical implementations:

**Backend**: Express API with Prisma ORM handling revenue calculations correctly using cents-to-dollars conversion, deployed as Vercel serverless functions.

**Frontend**: Next.js 14 with TypeScript, responsive design, and proper error handling.

**Database**: Multi-tenant PostgreSQL schema with 8 models supporting multiple Shopify stores.

**Deployment**: Separate Vercel projects for backend and frontend with proper CORS configuration."

## 7. Conclusion (15 sec)
"The dashboard is fully functional and production-ready, providing real-time Shopify analytics. 

GitHub: monu808/Xeno-FDE. Thank you!"

---

## Demo Preparation Checklist

Before recording:
- [ ] Update `NEXT_PUBLIC_BACKEND_URL` in Vercel dashboard settings
- [ ] Test backend API endpoint responds correctly
- [ ] Test dashboard displays metrics without NaN
- [ ] Have `tenant_id` parameter ready: `c19dfaaf-19e0-43c1-8d7d-5de83855d427`
- [ ] Open browser tabs: Backend API, Dashboard, GitHub repo, ARCHITECTURE.md
- [ ] Clear browser cache if needed

## URLs for Demo

**Backend API:**
```
https://xeno-fde-backend-rfkz4lmko-narendra-singhs-projects-90b1d8d1.vercel.app/api/metrics/overview?tenant_id=c19dfaaf-19e0-43c1-8d7d-5de83855d427
```

**Dashboard:**
```
https://xeno-fde-dashboard-4ulok47dn-narendra-singhs-projects-90b1d8d1.vercel.app/?tenant_id=c19dfaaf-19e0-43c1-8d7d-5de83855d427
```

**GitHub:**
```
https://github.com/monu808/Xeno-FDE
```
