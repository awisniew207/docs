import { useEffect, useState } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import { getAgentPKPs, getAgentPKPForApp } from '../../utils/user-dashboard/getAgentPKP';

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
