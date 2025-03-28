"use client";

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import dynamic from 'next/dynamic';
import { useErrorPopup } from '@/providers/error-popup';
import { useIsMounted } from '@/hooks/useIsMounted';

// Use dynamic import for CreateAppScreen to prevent SSR hydration issues
const CreateAppScreen = dynamic(
  () => import('@/components/developer/CreateApp'),
  { ssr: false }
);

export default function CreateAppPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  const isMounted = useIsMounted();
  
  // Add the error popup hook
  const { showError } = useErrorPopup();
  
  // Helper function to set status messages
  const showStatus = useCallback((message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
  }, []);
  
  const handleBack = () => {
    router.push('/');
  };
  
  const handleSuccess = () => {
    showStatus('App created successfully', 'success');
    // After success, redirect to dashboard after a short delay
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };
  
  // Prevent hydration errors by ensuring we only render when mounted
  if (!isMounted) return null;
  
  // If not connected, redirect to dashboard
  if (!isConnected) {
    router.push('/');
    return null;
  }
  
  return (
    <CreateAppScreen
      onBack={handleBack}
      onSuccess={handleSuccess}
    />
  );
} 