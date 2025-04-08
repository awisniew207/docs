'use client';
// Import the utility that automatically disables logs in production
import '@/utils/disableLogsInProduction';
import './dashboard.css'; // Dashboard-specific styling
import Header from '@/components/layout/Header';
import { WagmiProvider } from 'wagmi';
import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { yellowstone } from './config/chains';
import { usePathname } from 'next/navigation';
import { ErrorPopupProvider } from '@/providers/error-popup';
import React from 'react';

// Export for reuse in other layouts
export const wagmiConfig = createConfig({
  chains: [yellowstone],
  connectors: [injected()],
  transports: {
    [yellowstone.id]: http(),
  },
});

export const queryClient = new QueryClient();

export const demoAppInfo = {
  appName: 'Vincent',
};

// Shared provider component that can be used by both layouts
export function SharedProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme()}
          initialChain={yellowstone}
          appInfo={demoAppInfo}
        >
          <ErrorPopupProvider>
            {children}
          </ErrorPopupProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  // Don't apply this layout to appId routes - let them use their own layout
  if (pathname?.startsWith('/appId/')) {
    return <>{children}</>;
  }
  
  return (
    <html lang="en">
      <head>
        <title>Vincent Dashboard</title>
      </head>
      <body>
        <SharedProviders>
          <Header />
          <main className="max-w-screen-xl mx-auto p-6">{children}</main>
        </SharedProviders>
      </body>
    </html>
  );
}
