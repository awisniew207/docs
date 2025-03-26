"use client";

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import CreateAppScreen from '@/components/developer/CreateApp';
import { useErrorPopup } from '@/providers/error-popup';

export default function CreateAppPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  
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