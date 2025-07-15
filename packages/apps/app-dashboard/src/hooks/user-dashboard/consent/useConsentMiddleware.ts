import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import {
  getAllPermittedAppIdsForPkp,
  getPermittedAppVersionForPkp,
  getAppById,
  getAppVersion,
} from '@lit-protocol/vincent-contracts-sdk';
import { useEffect, useState } from 'react';
import { App } from '@/types/developer-dashboard/appTypes';

export type UseConsentMiddlewareProps = {
  appId: string;
  pkpTokenId: string;
  appData: App;
};

export type UseConsentMiddlewareReturn = {
  isPermitted: boolean | null;
  exists: boolean | null;
  activeVersionExists: boolean | null;
  version: number | null;
  isLoading: boolean;
  error: string | null;
};

export const useConsentMiddleware = ({
  appId,
  pkpTokenId,
  appData,
}: UseConsentMiddlewareProps): UseConsentMiddlewareReturn => {
  const [state, setState] = useState<UseConsentMiddlewareReturn>({
    isPermitted: null,
    exists: null,
    activeVersionExists: null,
    version: 1,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Early return if params are missing
    if (!appId || !pkpTokenId) {
      setState({
        isPermitted: null,
        exists: null,
        activeVersionExists: null,
        version: 1,
        isLoading: false,
        error: null,
      }); // FIXME: Currently testing
      return;
    }

    const checkPermitted = async () => {
      try {
        // Check if app exists in on-chain registry
        await getAppById({
          signer: readOnlySigner,
          args: { appId: appId.toString() },
        });

        // Check if the app's active version is published in the registry (if we have app data)
        if (appData?.activeVersion) {
          try {
            await getAppVersion({
              signer: readOnlySigner,
              args: { appId: appId.toString(), version: appData.activeVersion.toString() },
            });
          } catch (versionError: any) {
            if (versionError?.message?.includes('AppVersionNotRegistered')) {
              // Active version not published - return early
              setState({
                isPermitted: false,
                exists: true,
                activeVersionExists: false,
                version: appData.activeVersion,
                isLoading: false,
                error: null,
              });
              return;
            }
            // Other version-related error, re-throw
            throw versionError;
          }
        }

        const userApps = await getAllPermittedAppIdsForPkp({
          signer: readOnlySigner,
          args: { pkpTokenId },
        });

        if (userApps.includes(appId)) {
          const version = await getPermittedAppVersionForPkp({
            signer: readOnlySigner,
            args: { pkpTokenId, appId },
          });

          setState({
            isPermitted: true,
            exists: true,
            activeVersionExists: true,
            version: Number(version),
            isLoading: false,
            error: null,
          });
        } else {
          setState({
            isPermitted: false,
            exists: true,
            activeVersionExists: true,
            version: 1, // FIXME: Currently testing
            isLoading: false,
            error: null,
          });
        }
      } catch (error: any) {
        if (error?.message?.includes('AppNotRegistered')) {
          // App not published - this is fine, set exists to false
          setState({
            isPermitted: false,
            exists: false,
            activeVersionExists: null,
            version: 1,
            isLoading: false,
            error: null,
          });
        } else {
          // Other error
          setState({
            isPermitted: null,
            exists: null,
            activeVersionExists: null,
            version: 1, // FIXME: Currently testing
            isLoading: false,
            error: error instanceof Error ? error.message : 'An error occurred',
          });
        }
      }
    };

    checkPermitted();
  }, [appId, pkpTokenId, appData]);

  console.log('state', state);
  return state;
};
