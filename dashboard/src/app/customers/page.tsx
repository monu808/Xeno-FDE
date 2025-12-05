'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

function CustomersContent() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenant_id');
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchTopCustomers();
    }
  }, [tenantId]);

  const fetchTopCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/metrics/customers/top?tenant_id=${tenantId}&limit=10`);
      const data = await response.json();
      setTopCustomers(data.data || []);
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
        <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem' }}>Top Customers</h1>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>Ranked by total spending • Tenant: {tenantId}</p>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading...</p>
      ) : topCustomers.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No customer data available</p>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>#</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Customer</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Total Spent</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Orders</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((customer, index) => (
                <tr key={customer.customerId} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem', color: '#6b7280', fontWeight: '500' }}>{index + 1}</td>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>
                    {customer.firstName} {customer.lastName}
                  </td>
                  <td style={{ padding: '1rem', color: '#6b7280' }}>{customer.email}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '700', color: '#059669', fontSize: '1rem' }}>
                    ${customer.totalSpentFormatted}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: '#6b7280' }}>{customer.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading...</div>}>
      <CustomersContent />
    </Suspense>
  );
}
