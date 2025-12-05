'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function Home() {
  const [tenantId, setTenantId] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    if (!tenantId) {
      setError('Please enter a tenant ID');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/metrics/overview?tenant_id=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Xeno FDE – Shopify Insights Dashboard</h1>
        <p style={{ color: '#666' }}>Multi-tenant data ingestion and analytics</p>
      </header>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Quick Start</h2>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <input
            type="text"
            placeholder="Enter Tenant ID"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
          <button
            onClick={fetchMetrics}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            {loading ? 'Loading...' : 'Load Metrics'}
          </button>
        </div>
        {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
      </div>

      {metrics && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#666', fontWeight: 'normal' }}>Total Orders</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0' }}>{metrics.totalOrders}</p>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#666', fontWeight: 'normal' }}>Total Revenue</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0' }}>
                ${metrics.totalRevenueFormatted}
              </p>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#666', fontWeight: 'normal' }}>Total Customers</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0' }}>{metrics.totalCustomers}</p>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#666', fontWeight: 'normal' }}>Avg Order Value</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0' }}>
                ${metrics.averageOrderValueFormatted}
              </p>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link 
              href={`/customers?tenant_id=${tenantId}`}
              style={{
                flex: '1',
                minWidth: '250px',
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
                border: '2px solid transparent',
                transition: 'border-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#0070f3'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
            >
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#0070f3' }}>👥 Top Customers</h3>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>View customers ranked by total spending</p>
            </Link>

            <Link 
              href={`/products?tenant_id=${tenantId}`}
              style={{
                flex: '1',
                minWidth: '250px',
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
                border: '2px solid transparent',
                transition: 'border-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#0070f3'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
            >
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#0070f3' }}>📦 Top Products</h3>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>View best-selling products by revenue</p>
            </Link>
          </div>
        </>
      )}

      <div style={{ marginTop: '2rem', background: 'white', padding: '1.5rem', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Available Endpoints</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <code style={{ background: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              GET /api/metrics/overview?tenant_id=xxx
            </code>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <code style={{ background: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              GET /api/metrics/orders/by-date?tenant_id=xxx&from=2024-01-01&to=2024-12-31
            </code>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <code style={{ background: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              GET /api/metrics/customers/top?tenant_id=xxx&limit=5
            </code>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <code style={{ background: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
              GET /api/metrics/products/top?tenant_id=xxx&limit=5
            </code>
          </li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', background: 'white', padding: '1.5rem', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Setup Instructions</h2>
        <ol style={{ paddingLeft: '1.5rem' }}>
          <li>Create a Shopify development store</li>
          <li>Create a public Shopify app with OAuth</li>
          <li>Set up Neon PostgreSQL and configure DATABASE_URL</li>
          <li>Run Prisma migrations: <code>npx prisma migrate dev</code></li>
          <li>Start backend: <code>npm run dev</code> in backend folder</li>
          <li>Install app via: <code>/auth/start?shop=yourstore.myshopify.com</code></li>
          <li>Trigger full import: <code>POST /api/ingestion/start</code> with tenant_id</li>
          <li>View metrics in this dashboard</li>
        </ol>
      </div>
    </div>
  );
}

