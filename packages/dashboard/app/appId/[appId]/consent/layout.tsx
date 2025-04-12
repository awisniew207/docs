'use client';

import React, { useState, useEffect } from 'react';
import { StytchProvider } from '@stytch/nextjs';
import { createStytchUIClient } from '@stytch/nextjs/ui';
import './page.css';  // Updated path to the CSS file
import SessionValidator from '../../../../components/consent/components/SessionValidator';
import { ErrorPopupProvider } from '@/providers/error-popup';
import { useReadAuthInfo } from '../../../../components/consent/hooks/useAuthInfo';

// Wrapper component for centering content
const CenteredContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 pt-20">
    {children}
  </div>
);

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

export default function ConsentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if there's existing auth info to decide whether to show SessionValidator
  const [hasExistingSession, setHasExistingSession] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if there's existing auth info in local storage
    const authInfo = localStorage.getItem('lit-auth-info');
    const litWalletSig = localStorage.getItem('lit-wallet-sig');
    
    // Show session validator if both auth info and wallet signature exist
    setHasExistingSession(!!authInfo && !!litWalletSig);
  }, []);
  
  // Only render layout when we've determined session status
  if (hasExistingSession === null) return null;
  
  return (
    <ErrorPopupProvider>
      {stytchClient ? (
        <StytchProvider stytch={stytchClient}>
          {hasExistingSession ? <SessionValidator /> : children}
        </StytchProvider>
      ) : (
        children
      )}
    </ErrorPopupProvider>
  );
} 