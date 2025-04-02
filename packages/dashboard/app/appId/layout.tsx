'use client';

import React from 'react';
import '@/utils/disableLogsInProduction';
import { WagmiProvider } from 'wagmi';
import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { yellowstone } from '../config/chains';
import { ErrorPopupProvider } from '@/providers/error-popup';
import Header from '@/components/layout/Header';
import { usePathname } from 'next/navigation';

// Only import dashboard styles for non-consent pages
const wagmiConfig = createConfig({
  chains: [yellowstone],
  connectors: [injected()],
  transports: {
    [yellowstone.id]: http(),
  },
});

const queryClient = new QueryClient();

const demoAppInfo = {
  appName: 'Vincent',
};

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
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider
              theme={darkTheme()}
              initialChain={yellowstone}
              appInfo={demoAppInfo}
            >
              <ErrorPopupProvider>
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
              </ErrorPopupProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
} 