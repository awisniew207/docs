import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface UrlParamsResult {
  appId: string | null;
  version: string | null;
  error: string | null;
}

export function useUrlAppId(): UrlParamsResult {
  const params = useParams();
  const [appId, setAppId] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const searchParams = new URLSearchParams(url.search);
    
    // Get appId from route parameter
    const routeAppId = params.appId as string;
    // Fallback to query parameter for backward compatibility
    const queryAppId = searchParams.get('appId');
    const urlVersion = searchParams.get('version');

    // Prioritize route parameter, fall back to query parameter
    const urlAppId = routeAppId || queryAppId;

    if (!urlAppId) {
      setError('No appId provided');
      setAppId(null);
      return;
    }

    // Set the parsed appId 
    setAppId(urlAppId);
    
    if (!urlVersion) {
      // Default to version "0" if not provided
      setVersion("0");
    } else {
      setVersion(urlVersion);
    }

    // Clear any previous errors
    setError(null);
  }, [params]);

  return { appId, version, error };
} 