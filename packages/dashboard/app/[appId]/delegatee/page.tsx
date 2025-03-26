"use client";

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formCompleteVincentAppForDev } from '@/services';
import { useAccount } from 'wagmi';
import { AppView } from '@/services/types';
import DelegateeManagerScreen from '@/components/developer/dashboard/ManageDelegatee';

export default function DelegateePage() {
  const params = useParams();
  const appIdParam = Array.isArray(params.appId) ? params.appId[0] : params.appId;
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [dashboard, setDashboard] = useState<AppView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadAppData = useCallback(async () => {
    if (!address || !appIdParam) return;
    
    try {
      setIsLoading(true);
      const appData = await formCompleteVincentAppForDev(address);
      
      if (appData && appData.length > 0) {
        // Find the specific app by appId
        const app = appData.find(app => app.appId && app.appId.toString() === appIdParam);
        if (app) {
          setDashboard(app);
        } else {
          // If app not found, navigate back to dashboard
          router.push('/');
        }
      } else {
        // If no apps found, navigate back to dashboard
        router.push('/');
      }
    } catch (error) {
      console.error("Error loading app data:", error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [address, appIdParam, router]);
  
  useEffect(() => {
    if (isConnected) {
      loadAppData();
    } else {
      router.push('/');
    }
  }, [isConnected, loadAppData, router]);
  
  const handleBack = () => {
    router.push(`/${appIdParam}`);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!dashboard) {
    return null;
  }
  
  return (
    <DelegateeManagerScreen
      onBack={handleBack}
      dashboard={dashboard}
    />
  );
} 