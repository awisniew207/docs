import { useEffect, useState, useCallback } from 'react';
import { IRelayPKP } from '@lit-protocol/types';

// Define interfaces for the authentication info
export interface AuthInfo {
  type: string;
  authenticatedAt: string;
  agentPKP?: IRelayPKP;
  userPKP?: IRelayPKP;
  value?: string;
  userId?: string;
}

const AUTH_INFO_KEY = 'lit-auth-info';

/**
 * Hook to retrieve authentication info from localStorage
 * @returns The authentication info stored in localStorage
 */
export const useReadAuthInfo = () => {
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);

  // Load auth info from localStorage
  useEffect(() => {
    try {
      const storedAuthInfo = localStorage.getItem(AUTH_INFO_KEY);
      if (storedAuthInfo) {
        const parsedAuthInfo = JSON.parse(storedAuthInfo) as AuthInfo;
        setAuthInfo(parsedAuthInfo);
      }
    } catch (error) {
      console.error('Error retrieving auth info:', error);
    }
  }, []);

  return authInfo;
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
        if (!updates.authenticatedAt || !updates.type) {
          throw new Error('New auth info must include type and authenticatedAt');
        }
        updatedAuthInfo = updates as AuthInfo;
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