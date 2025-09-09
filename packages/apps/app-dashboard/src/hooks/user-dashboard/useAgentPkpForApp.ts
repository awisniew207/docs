import { useEffect, useState } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import { getAgentPkps } from '../../utils/user-dashboard/getAgentPkps';
import { env } from '@/config/env';

export function useAgentPkpForApp(userAddress: string | undefined, appId: number | undefined) {
  const [agentPKP, setAgentPKP] = useState<IRelayPKP | null>(null);
  const [permittedVersion, setPermittedVersion] = useState<number | null>(null);
  const [versionEnabled, setVersionEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userAddress || appId === undefined) {
      setAgentPKP(null);
      setPermittedVersion(null);
      setVersionEnabled(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchAgentPKP = async () => {
      try {
        const { permitted, unpermitted } = await getAgentPkps(userAddress);

        // Check if this is Vincent Yield and we have unpermitted fallback
        if (appId === Number(env.VITE_VINCENT_YIELD_APPID)) {
          // hadUnpermittedFallback is true when there's only one PKP with appId = -1
          const hadUnpermittedFallback = permitted.length === 1 && permitted[0].appId === -1;
          if (hadUnpermittedFallback) {
            setAgentPKP(permitted[0].pkp);
            setPermittedVersion(null);
            setVersionEnabled(null);
            setLoading(false);
            return;
          }
        }

        // Find the permission entry for this specific app in permitted list
        const appPermission = permitted.find((p) => p.appId === appId);

        if (appPermission) {
          setAgentPKP(appPermission.pkp);
          setPermittedVersion(appPermission.permittedVersion);
          setVersionEnabled(null); // For permitted apps, versionEnabled is not relevant
        } else {
          // Check if this app was previously permitted and return that PKP for reuse
          const previousPermission = unpermitted.find((p) => p.appId === appId);
          if (previousPermission) {
            // Return the PKP that was previously permitted so ConnectPage can reuse it
            setAgentPKP(previousPermission.pkp);
            setPermittedVersion(null);
            setVersionEnabled(previousPermission.versionEnabled ?? null);
          } else {
            setAgentPKP(null);
            setPermittedVersion(null);
            setVersionEnabled(null);
          }
        }
      } catch (err) {
        setError(err as Error);
        setAgentPKP(null);
        setPermittedVersion(null);
        setVersionEnabled(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentPKP();
  }, [userAddress, appId]);

  return { agentPKP, permittedVersion, versionEnabled, loading, error };
}
