import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import {
  getAllPermittedAppIdsForPkp,
  getPermittedAppVersionForPkp,
} from '@lit-protocol/vincent-contracts-sdk';
import { useEffect, useState } from 'react';

export type UseConsentMiddlewareProps = {
  appId: string;
  pkpTokenId: string;
};

export type UseConsentMiddlewareReturn = {
  isPermitted: boolean | null;
  version: number | null;
  isLoading: boolean;
  error: string | null;
};

export const useConsentMiddleware = ({
  appId,
  pkpTokenId,
}: UseConsentMiddlewareProps): UseConsentMiddlewareReturn => {
  const [state, setState] = useState<UseConsentMiddlewareReturn>({
    isPermitted: null,
    version: 1,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Early return if params are missing
    if (!appId || !pkpTokenId) {
      setState({ isPermitted: null, version: 1, isLoading: false, error: null });
      return;
    }

    const checkPermitted = async () => {
      try {
        console.log('Checking permissions for:', { appId, pkpTokenId });

        const userApps = await getAllPermittedAppIdsForPkp({
          signer: readOnlySigner,
          args: { pkpTokenId },
        });

        if (userApps.includes(appId)) {
          const version = await getPermittedAppVersionForPkp({
            signer: readOnlySigner,
            args: { pkpTokenId, appId },
          });

          console.log('Version fetched:', version);

          setState({
            isPermitted: true,
            version: Number(version),
            isLoading: false,
            error: null,
          });
        } else {
          console.log('App is not permitted');
          setState({
            isPermitted: false,
            version: 1, // FIXME: Currently testing
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error in checkPermitted:', error);
        setState({
          isPermitted: null,
          version: 1, // FIXME: Currently testing
          isLoading: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        });
      }
    };

    checkPermitted();
  }, [appId, pkpTokenId]);

  return state;
};
