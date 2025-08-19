import { useCallback, useState } from 'react';
import { AuthMethod } from '@lit-protocol/types';
import {
  authenticateWithWebAuthn,
  authenticateWithStytch,
  authenticateWithEthWallet,
} from '@/utils/user-dashboard/lit';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';

export default function useAuthenticate() {
  const [authMethod, setAuthMethod] = useState<AuthMethod>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  /**
   * Authenticate with WebAuthn credential
   */
  const authWithWebAuthn = useCallback(async (vincentYieldInfo: ConnectInfoMap): Promise<void> => {
    setLoading(true);
    setError(undefined);
    setAuthMethod(undefined);

    try {
      // Wait for Vincent Yield data to be ready if needed
      while (
        vincentYieldInfo &&
        (Object.keys(vincentYieldInfo.supportedPoliciesByAbilityVersion || {}).length === 0 ||
          Object.keys(vincentYieldInfo.abilityVersionsByAppVersionAbility || {}).length === 0)
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const result: AuthMethod = await authenticateWithWebAuthn(vincentYieldInfo);
      setAuthMethod(result);
    } catch (err) {
      // Check if this is a user cancellation - if so, don't treat it as an error
      if (
        !(err instanceof Error) ||
        (!err.message.includes('timed out') &&
          !err.message.includes('not allowed') &&
          !err.message.includes('cancelled') &&
          !err.message.includes('privacy-considerations-client'))
      ) {
        setError(err as Error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Authenticate with Stytch
   */
  const authWithStytch = useCallback(
    async (accessToken: string, userId?: string, method?: string): Promise<void> => {
      setLoading(true);
      setError(undefined);
      setAuthMethod(undefined);

      try {
        const result: AuthMethod = await authenticateWithStytch(
          accessToken,
          userId,
          method as 'sms' | 'email',
        );
        setAuthMethod(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Authenticate with Ethereum wallet
   */
  const authWithEthWallet = useCallback(
    async (address: string, signMessage: (message: string) => Promise<string>): Promise<void> => {
      setLoading(true);
      setError(undefined);
      setAuthMethod(undefined);

      try {
        const result: AuthMethod = await authenticateWithEthWallet(address, signMessage);
        setAuthMethod(result);
      } catch (err) {
        // Don't show error for user rejection - it's not really an error
        if (
          !(err instanceof Error) ||
          (!err.message.includes('User rejected') && !err.message.includes('user rejected'))
        ) {
          setError(err as Error);
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    authWithWebAuthn,
    authWithStytch,
    authWithEthWallet,
    authMethod,
    loading,
    error,
    clearError,
  };
}
