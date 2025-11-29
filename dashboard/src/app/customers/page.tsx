'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function CustomersPage() {
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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Top Customers</h1>
      <p style={{ color: '#666' }}>Tenant: {tenantId}</p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
          <thead style={{ background: '#f0f0f0' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Customer</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Total Spent</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Orders</th>
            </tr>
          </thead>
          <tbody>
            {topCustomers.map((customer) => (
              <tr key={customer.customerId} style={{ borderTop: '1px solid #f0f0f0' }}>
                <td style={{ padding: '1rem' }}>
                  {customer.firstName} {customer.lastName}
                </td>
                <td style={{ padding: '1rem' }}>{customer.email}</td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                  ${customer.totalSpentFormatted}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>{customer.orderCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
