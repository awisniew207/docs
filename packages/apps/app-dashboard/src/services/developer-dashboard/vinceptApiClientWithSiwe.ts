import { useCallback, useState, useEffect } from 'react';
import { vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { useAccount, useSignMessage } from 'wagmi';
import { verifyMessage } from 'viem';

/**
 * SIWE validation and authentication utilities
 */
interface SIWEData {
  message: string;
  signature: string;
  address: string;
  domain: string;
  expirationTime: string;
  issuedAt: string;
}

const SIWE_STORAGE_KEY = 'vincentDeveloperSIWE';
const SIWE_EXPIRATION_HOURS = 72;
const domain = window.location.hostname;

// Global storage for current SIWE token to be used in requests
let currentSIWEToken: string | null = null;

// Global promise to prevent concurrent authentication attempts
let authenticationPromise: Promise<boolean> | null = null;

/**
 * Get current SIWE token for request headers
 */
export const getCurrentSIWEToken = (): string | null => {
  return currentSIWEToken;
};

/**
 * Validates SIWE data from localStorage. Just return true/false, if false, the user can just sign a new SIWE. No need for displaying an error message.
 */
const validateSIWEData = async (siweData: SIWEData, currentAddress: string): Promise<boolean> => {
  try {
    // Check expiration
    if (new Date(siweData.expirationTime) <= new Date()) return false;

    // Check address match
    if (siweData.address.toLowerCase() !== currentAddress.toLowerCase()) return false;

    // Check domain
    if (siweData.domain !== domain) return false;

    // Verify signature
    const isValidSignature = await verifyMessage({
      address: siweData.address as `0x${string}`,
      message: siweData.message,
      signature: siweData.signature as `0x${string}`,
    });

    return isValidSignature;
  } catch (error) {
    return false;
  }
};

/**
 * Removes invalid SIWE data from localStorage
 */
const clearInvalidSIWE = (): void => {
  localStorage.removeItem(SIWE_STORAGE_KEY);
  currentSIWEToken = null;
};

/**
 * Generates a cryptographically secure nonce
 */
const generateSecureNonce = (): string => {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Generates a new SIWE message
 */
const generateSIWEMessage = (address: string): string => {
  const issuedAt = new Date().toISOString();
  const expirationTime = new Date(
    Date.now() + SIWE_EXPIRATION_HOURS * 60 * 60 * 1000,
  ).toISOString();
  const nonce = generateSecureNonce();

  return `${domain} wants you to sign in with your Ethereum account:
${address}

Vincent Developer Registry Access

URI: ${domain}
Version: 1
Chain ID: 175188
Nonce: ${nonce}
Issued At: ${issuedAt}
Expiration Time: ${expirationTime}`;
};

/**
 * Hook that wraps vincentApiClient hooks and handles SIWE authentication for registry changes
 *
 * @returns Object containing wrapped API hooks with automatic SIWE authentication and utility functions
 */
export function useVincentApiWithSIWE() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  /**
   * Check and set up SIWE token on component mount or address change
   */
  useEffect(() => {
    const initializeSIWE = async () => {
      if (!isConnected || !address) {
        currentSIWEToken = null;
        return;
      }

      const storedSIWE = localStorage.getItem(SIWE_STORAGE_KEY);
      if (storedSIWE) {
        try {
          const siweData: SIWEData = JSON.parse(storedSIWE);

          if (await validateSIWEData(siweData, address)) {
            currentSIWEToken = siweData.signature;
          } else {
            clearInvalidSIWE();
          }
        } catch (error) {
          clearInvalidSIWE();
        }
      }
    };

    initializeSIWE();
  }, [address, isConnected]);

  /**
   * Manually trigger SIWE authentication with race condition protection
   */
  const authenticateWithSIWE = useCallback(async (): Promise<boolean> => {
    // If already authenticating, return the existing promise
    if (authenticationPromise) {
      return authenticationPromise;
    }

    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    // New authentication promise
    authenticationPromise = (async () => {
      setIsAuthenticating(true);

      try {
        const message = generateSIWEMessage(address);
        const signature = await signMessageAsync({ message });

        const newSIWEData: SIWEData = {
          message,
          signature,
          address,
          domain,
          expirationTime: new Date(
            Date.now() + SIWE_EXPIRATION_HOURS * 60 * 60 * 1000,
          ).toISOString(),
          issuedAt: new Date().toISOString(),
        };

        localStorage.setItem(SIWE_STORAGE_KEY, JSON.stringify(newSIWEData));
        currentSIWEToken = signature;
        return true;
      } catch (error) {
        throw new Error('SIWE authentication failed');
      } finally {
        setIsAuthenticating(false);
      }
    })();

    try {
      return await authenticationPromise;
    } finally {
      // Clear the promise after completion
      authenticationPromise = null;
    }
  }, [address, isConnected, signMessageAsync]);

  /**
   * Check if SIWE authentication is available
   */
  const hasSIWEAuthentication = useCallback(() => {
    return currentSIWEToken !== null;
  }, []);

  // Create a wrapper for query hooks without authentication (GET requests)
  const createQueryWrapper = useCallback(<T extends (...args: any[]) => any>(originalHook: T) => {
    return (args: Parameters<T>[0], options?: Parameters<T>[1]) => {
      // No authentication needed for GET requests
      return originalHook(args, options);
    };
  }, []);

  // Create a wrapper for mutation hooks that checks SIWE authentication (POST/PUT/DELETE)
  const createMutationWrapper = useCallback(
    <T extends () => readonly [any, any]>(originalHook: T, method: string) => {
      return () => {
        const [originalMutation, mutationResult] = originalHook();

        const wrappedMutation = useCallback(
          async (args: any) => {
            if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
              if (!isConnected || !address) {
                throw new Error('Wallet not connected');
              }

              // Ensure we have authentication before proceeding
              if (!currentSIWEToken) {
                await authenticateWithSIWE();
              }
            }

            return originalMutation(args);
          },
          [originalMutation],
        );

        return [wrappedMutation, mutationResult] as const;
      };
    },
    [isConnected, address, authenticateWithSIWE],
  );

  return {
    authenticateWithSIWE,
    hasSIWEAuthentication,
    isAuthenticating,

    // Lazy query hooks (GET requests - no authentication needed)
    /* Temporarily commented out since they're not exported from the SDK
    useLazyListAppsQuery: createQueryWrapper(vincentApiClient.useLazyListAppsQuery),
    useLazyGetAppQuery: createQueryWrapper(vincentApiClient.useLazyGetAppQuery),
    useLazyGetAppVersionsQuery: createQueryWrapper(vincentApiClient.useLazyGetAppVersionsQuery),
    useLazyGetAppVersionQuery: createQueryWrapper(vincentApiClient.useLazyGetAppVersionQuery),
    useLazyListAllToolsQuery: createQueryWrapper(vincentApiClient.useLazyListAllToolsQuery),
    useLazyGetToolQuery: createQueryWrapper(vincentApiClient.useLazyGetToolQuery),
    useLazyGetToolVersionsQuery: createQueryWrapper(vincentApiClient.useLazyGetToolVersionsQuery),
    useLazyGetToolVersionQuery: createQueryWrapper(vincentApiClient.useLazyGetToolVersionQuery),
    useLazyListAllPoliciesQuery: createQueryWrapper(vincentApiClient.useLazyListAllPoliciesQuery),
    useLazyGetPolicyQuery: createQueryWrapper(vincentApiClient.useLazyGetPolicyQuery),
    useLazyGetPolicyVersionsQuery: createQueryWrapper(vincentApiClient.useLazyGetPolicyVersionsQuery),
    useLazyGetPolicyVersionQuery: createQueryWrapper(vincentApiClient.useLazyGetPolicyVersionQuery),

    // Mutation hooks (POST/PUT/DELETE requests - SIWE authentication required)
    useCreateAppMutation: createMutationWrapper(vincentApiClient.useCreateAppMutation, 'POST'),
    useEditAppMutation: createMutationWrapper(vincentApiClient.useEditAppMutation, 'PUT'),
    useDeleteAppMutation: createMutationWrapper(vincentApiClient.useDeleteAppMutation, 'DELETE'),
    useCreateAppVersionMutation: createMutationWrapper(vincentApiClient.useCreateAppVersionMutation, 'POST'),
    useEditAppVersionMutation: createMutationWrapper(vincentApiClient.useEditAppVersionMutation, 'PUT'),
    useEnableAppVersionMutation: createMutationWrapper(vincentApiClient.useEnableAppVersionMutation, 'POST'),
    useDisableAppVersionMutation: createMutationWrapper(vincentApiClient.useDisableAppVersionMutation, 'POST'),
    useCreateToolMutation: createMutationWrapper(vincentApiClient.useCreateToolMutation, 'POST'),
    useEditToolMutation: createMutationWrapper(vincentApiClient.useEditToolMutation, 'PUT'),
    useChangeToolOwnerMutation: createMutationWrapper(vincentApiClient.useChangeToolOwnerMutation, 'PUT'),
    useCreateToolVersionMutation: createMutationWrapper(vincentApiClient.useCreateToolVersionMutation, 'POST'),
    useEditToolVersionMutation: createMutationWrapper(vincentApiClient.useEditToolVersionMutation, 'PUT'),
    useCreatePolicyMutation: createMutationWrapper(vincentApiClient.useCreatePolicyMutation, 'POST'),
    useEditPolicyMutation: createMutationWrapper(vincentApiClient.useEditPolicyMutation, 'PUT'),
    useCreatePolicyVersionMutation: createMutationWrapper(vincentApiClient.useCreatePolicyVersionMutation, 'POST'),
    useEditPolicyVersionMutation: createMutationWrapper(vincentApiClient.useEditPolicyVersionMutation, 'PUT'),
    useChangePolicyOwnerMutation: createMutationWrapper(vincentApiClient.useChangePolicyOwnerMutation, 'PUT'),
    */
  };
}
