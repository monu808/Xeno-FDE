import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Xeno FDE - Shopify Insights',
  description: 'Multi-tenant Shopify data ingestion and insights dashboard',
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
