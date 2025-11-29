'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function ProductsPage() {
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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Top Products</h1>
      <p style={{ color: '#666' }}>Tenant: {tenantId}</p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
          <thead style={{ background: '#f0f0f0' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Product</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Vendor</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Revenue</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Qty Sold</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((product) => (
              <tr key={product.productId} style={{ borderTop: '1px solid #f0f0f0' }}>
                <td style={{ padding: '1rem' }}>{product.title}</td>
                <td style={{ padding: '1rem' }}>{product.vendor || 'N/A'}</td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                  ${product.totalRevenueFormatted}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>{product.quantitySold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
