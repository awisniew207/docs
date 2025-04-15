import { useEffect, useState, useCallback } from 'react';
import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import validateSession from '../utils/validateSession';
// Define interfaces for the authentication info
export interface AuthInfo {
  type: string;
  authenticatedAt: string;
  agentPKP?: IRelayPKP;
  userPKP?: IRelayPKP;
  value?: string;
  userId?: string;
}

export interface UseReadAuthInfo { 
  authInfo: AuthInfo | null;
  sessionSigs: SessionSigs | null;
  isProcessing: boolean;
  error: string | null;
}

const AUTH_INFO_KEY = 'lit-auth-info';

/**
 * Hook to retrieve authentication info from localStorage
 * @returns The authentication info stored in localStorage
 */
export const useReadAuthInfo = (): UseReadAuthInfo => {
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [sessionSigs, setSessionSigs] = useState<SessionSigs | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load auth info from localStorage
  useEffect(() => {
    const loadAuthInfo = async () => {
      try {
        const storedAuthInfo = localStorage.getItem(AUTH_INFO_KEY);
        if (storedAuthInfo) {
          const parsedAuthInfo = JSON.parse(storedAuthInfo) as AuthInfo;
          setAuthInfo(parsedAuthInfo);
        }
        const sigs = await validateSession();
        if (sigs) {
          setSessionSigs(sigs);
        }
      } catch (error) {
        console.error('Error retrieving auth info:', error);
        setError(error as string);
        useClearAuthInfo();
      } finally {
        setIsProcessing(false);
      }
    };
    loadAuthInfo();
  }, []);

  return { authInfo, sessionSigs, isProcessing, error };
};

/**
 * Hook to provide functions for setting and updating authentication info
 * @returns Functions to set and update auth info
 */
export const useSetAuthInfo = () => {
  // Set new auth info (replaces existing)
  const setAuthInfo = useCallback((newAuthInfo: AuthInfo) => {
    try {
      localStorage.setItem(AUTH_INFO_KEY, JSON.stringify(newAuthInfo));
      return true;
    } catch (error) {
      console.error('Error storing auth info:', error);
      return false;
    }
  }, []);

  // Update existing auth info (merges with existing)
  const updateAuthInfo = useCallback((updates: Partial<AuthInfo>) => {
    try {
      const storedAuthInfo = localStorage.getItem(AUTH_INFO_KEY);
      let updatedAuthInfo: AuthInfo;
      
      if (storedAuthInfo) {
        const currentAuthInfo = JSON.parse(storedAuthInfo) as AuthInfo;
        updatedAuthInfo = { ...currentAuthInfo, ...updates };
      } else {
        // If creating new auth info without required fields, set defaults instead of throwing an error
        updatedAuthInfo = {
          type: updates.type || (updates.agentPKP ? 'webauthn' : 'unknown'), // Default to webauthn if we have PKP info
          authenticatedAt: updates.authenticatedAt || new Date().toISOString(),
          ...updates
        } as AuthInfo;
      }
      
      localStorage.setItem(AUTH_INFO_KEY, JSON.stringify(updatedAuthInfo));
      return true;
    } catch (error) {
      console.error('Error updating auth info:', error);
      return false;
    }
  }, []);

  return {
    setAuthInfo,
    updateAuthInfo
  };
};

/**
 * Hook to provide a function for clearing authentication info
 * @returns Function to clear auth info
 */
export const useClearAuthInfo = () => {
  // Clear auth info from localStorage
  const clearAuthInfo = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_INFO_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing auth info:', error);
      return false;
    }
  }, []);

  return clearAuthInfo;
};

// For backward compatibility
export default useReadAuthInfo; 