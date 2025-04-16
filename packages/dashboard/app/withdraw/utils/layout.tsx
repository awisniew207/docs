'use client';

import React from 'react';
import { StytchProvider } from '@stytch/nextjs';
import { createStytchUIClient } from '@stytch/nextjs/ui';
import { SharedProviders } from '../../layout';

// Create Stytch client only on the client side
let stytchClient: any = null;
if (typeof window !== 'undefined') {
  try {
    const publicToken = process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN;
    if (publicToken) {
      stytchClient = createStytchUIClient(publicToken);
    }
  } catch (error) {
    console.error('Error initializing Stytch client:', error);
  }
}

export default function WithdrawLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SharedProviders>
        {stytchClient ? (
          <StytchProvider stytch={stytchClient}>
            {children}
          </StytchProvider>
        ) : (
          children
        )}
    </SharedProviders>
  );
} 