import { useEffect, useState } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import { getAgentPKPs } from '../../utils/user-dashboard/getAgentPKP';

export type AgentAppPermission = {
  appId: number;
  pkp: IRelayPKP;
};

export function useAllAgentAppPermissions(userAddress: string | undefined) {
  const [permittedPKPs, setPermittedPKPs] = useState<AgentAppPermission[]>([]);
  const [unpermittedPKPs, setUnpermittedPKPs] = useState<IRelayPKP[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userAddress) {
      setPermittedPKPs([]);
      setUnpermittedPKPs([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchAllPermissions = async () => {
      try {
        const agentPkpResult = await getAgentPKPs(userAddress);
        // Flatten the Record<number, IRelayPKP[]> into AgentAppPermission[]
        const allPermissions: AgentAppPermission[] = [];

        for (const [appId, pkps] of Object.entries(agentPkpResult.permitted)) {
          const numericAppId = parseInt(appId);
          pkps.forEach((pkp) => {
            allPermissions.push({ appId: numericAppId, pkp });
          });
        }

        setPermittedPKPs(allPermissions);
        setUnpermittedPKPs(agentPkpResult.unpermitted);
      } catch (err) {
        setError(err as Error);
        setPermittedPKPs([]);
        setUnpermittedPKPs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPermissions();
  }, [userAddress]);

  return { permittedPKPs, unpermittedPKPs, loading, error };
}
