'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

function ProductsContent() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenant_id');
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchTopProducts();
    }
  }, [tenantId]);

  const fetchTopProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/metrics/products/top?tenant_id=${tenantId}&limit=10`);
      const data = await response.json();
      setTopProducts(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!tenantId) {
    return <div style={{ padding: '2rem' }}>Please provide tenant_id in URL</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem' }}>Top Products</h1>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>Best-selling products by revenue • Tenant: {tenantId}</p>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading...</p>
      ) : topProducts.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No product data available</p>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>#</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Product</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Vendor</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Revenue</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Units Sold</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Avg Price</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => {
                const avgPrice = product.quantitySold > 0 
                  ? (parseFloat(product.totalRevenueFormatted) / product.quantitySold).toFixed(2)
                  : '0.00';
                return (
                  <tr key={product.productId} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem', color: '#6b7280', fontWeight: '500' }}>{index + 1}</td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{product.title}</td>
                    <td style={{ padding: '1rem', color: '#6b7280' }}>{product.vendor || 'N/A'}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '700', color: '#059669', fontSize: '1rem' }}>
                      ${product.totalRevenueFormatted}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#6b7280' }}>{product.quantitySold}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#6b7280', fontWeight: '500' }}>
                      ${avgPrice}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
