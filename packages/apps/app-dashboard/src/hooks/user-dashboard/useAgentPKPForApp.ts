import { useEffect, useState } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import { getAgentPKPs, getAgentPKPForApp } from '../../utils/user-dashboard/getAgentPKP';
import { env } from '@/config/env';

export function useAgentPKPForApp(userAddress: string | undefined, appId: number | undefined) {
  const [agentPKP, setAgentPKP] = useState<IRelayPKP | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userAddress || appId === undefined) {
      setAgentPKP(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchAgentPKP = async () => {
      try {
        const agentPKPs = await getAgentPKPs(userAddress);

        // Check if this is Vincent Yield and we have unpermitted fallback
        if (appId === Number(env.VITE_VINCENT_YIELD_APPID)) {
          // hadUnpermittedFallback is true when there's only one PKP with appId = -1
          const hadUnpermittedFallback = agentPKPs.length === 1 && agentPKPs[0].appId === -1;
          if (hadUnpermittedFallback) {
            setAgentPKP(agentPKPs[0].pkp);
            setLoading(false);
            return;
          }
        }

        const pkp = getAgentPKPForApp(agentPKPs, appId);
        setAgentPKP(pkp);
      } catch (err) {
        setError(err as Error);
        setAgentPKP(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentPKP();
  }, [userAddress, appId]);

  return { agentPKP, loading, error };
}
