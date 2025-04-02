import { useState, useEffect } from 'react';

interface UrlParamsResult {
    redirectUri: string | null;
    error: string | null;
}

export function useUrlRedirectUri(): UrlParamsResult {
    const [redirectUri, setRedirectUri] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    
    const urlRedirectUri = params.get('redirectUri');


    if (!urlRedirectUri) {
      setError('No redirectUri provided');
      setRedirectUri(null);
      return;
    }

    setRedirectUri(urlRedirectUri);
    setError(null);
  }, []);

  return { redirectUri, error };
} 