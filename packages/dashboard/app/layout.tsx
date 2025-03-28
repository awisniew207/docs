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
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <html lang="en">
          <head>
            <title>Vincent Dashboard</title>
          </head>
          <body>
            <RainbowKitProvider
              theme={darkTheme()}
              initialChain={yellowstone}
              appInfo={demoAppInfo}
            >
              <ErrorPopupProvider>
                <Header />
                <main className="max-w-screen-xl mx-auto p-6">{children}</main>
              </ErrorPopupProvider>
            </RainbowKitProvider>
          </body>
        </html>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
