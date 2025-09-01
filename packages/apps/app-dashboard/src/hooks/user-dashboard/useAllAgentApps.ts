import { useEffect, useState } from 'react';
import { getAgentPKPs, AgentAppPermission } from '../../utils/user-dashboard/getAgentPKP';

export function useAllAgentApps(userAddress: string | undefined) {
  const [permittedPKPs, setPermittedPKPs] = useState<AgentAppPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userAddress) {
      setPermittedPKPs([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchAllPermissions = async () => {
      try {
        const agentPKPs = await getAgentPKPs(userAddress);

        setPermittedPKPs(agentPKPs);
      } catch (err) {
        setError(err as Error);
        setPermittedPKPs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPermissions();
  }, [userAddress]);

  return { permittedPKPs, loading, error };
}
