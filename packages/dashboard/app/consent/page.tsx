'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ConsentRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const appId = searchParams.get('appId');
    
    if (appId) {
      // Preserve all other query parameters
      const otherParams = Array.from(searchParams.entries())
        .filter(([key]) => key !== 'appId')
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      
      const queryString = otherParams ? `?${otherParams}` : '';
      
      // Redirect to the new route structure
      router.replace(`/consent/${appId}${queryString}`);
    }
  }, [router, searchParams]);
  
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Redirecting...</p>
    </div>
  );
} 