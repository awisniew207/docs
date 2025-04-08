'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import { SharedProviders } from '../layout';

export default function AppIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isConsentPage = pathname?.includes('/consent');

  return (
    <html lang="en">
      <head>
        <title>{isConsentPage ? 'Vincent | App Consent' : 'Vincent Dashboard'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {!isConsentPage && (
          <style dangerouslySetInnerHTML={{ __html: `
            body {
              background-color: #f5f5f5;
            }
            .dashboard-content {
              max-width: 1280px;
              margin: 0 auto;
              padding: 1.5rem;
            }
          `}} />
        )}
      </head>
      <body className={isConsentPage ? 'consent-only' : ''}>
        <SharedProviders>
          {isConsentPage ? (
            // Consent pages - no dashboard styles or header
            <div className="consent-wrapper">
              {children}
            </div>
          ) : (
            // Dashboard pages - include header and dashboard layout
            <div className="dashboard-wrapper">
              <Header />
              <main className="dashboard-content">
                {children}
              </main>
            </div>
          )}
        </SharedProviders>
      </body>
    </html>
  );
} 