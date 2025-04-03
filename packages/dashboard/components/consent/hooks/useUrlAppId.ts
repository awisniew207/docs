import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface UrlParamsResult {
  appId: string | null;
  error: string | null;
}

export function useUrlAppId(): UrlParamsResult {
  const params = useParams();
  const [appId, setAppId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const routeAppId = params.appId as string;

    if (!routeAppId) {
      setError('No appId provided');
      setAppId(null);
      return;
    }

    setAppId(routeAppId);
    setError(null);
  }, [params]);

  return { appId, error };
} 