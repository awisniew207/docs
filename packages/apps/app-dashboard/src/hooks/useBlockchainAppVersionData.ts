import { useState, useEffect, useCallback } from 'react';
import { getAppVersion, AppVersion, App } from '@lit-protocol/vincent-contracts-sdk';
import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';

export function useBlockchainAppVersionData(
  appId: string | undefined,
  versionId: string | undefined,
) {
  const [blockchainAppVersion, setBlockchainAppVersion] = useState<AppVersion | null>(null);
  const [blockchainAppVersionError, setBlockchainAppVersionError] = useState<string | null>(null);
  const [blockchainAppVersionLoading, setBlockchainAppVersionLoading] = useState(true);
  const [blockchainAppData, setBlockchainAppData] = useState<App | null>(null);
  const [isAppRegistered, setIsAppRegistered] = useState(false);

  const fetchBlockchainAppVersionData = useCallback(async () => {
    if (!appId || !versionId) {
      setBlockchainAppVersionError('App ID and Version ID are required');
      setBlockchainAppVersionLoading(false);
      return;
    }

    setBlockchainAppVersionLoading(true);
    setBlockchainAppVersionError(null);

    try {
      const appVersionResult = await getAppVersion({
        signer: readOnlySigner,
        args: {
          appId: appId.toString(),
          version: versionId.toString(),
        },
      });
      setBlockchainAppVersion(appVersionResult.appVersion);
      setBlockchainAppData(appVersionResult.app);
      setIsAppRegistered(true);
      setBlockchainAppVersionError(null);
    } catch (error: any) {
      if (error?.message?.includes('AppVersionNotRegistered')) {
        setBlockchainAppVersion(null);
        setBlockchainAppData(null);
        setIsAppRegistered(true); // App exists, but version doesn't
        setBlockchainAppVersionError(null);
      } else if (error?.message?.includes('AppNotRegistered')) {
        setBlockchainAppVersion(null);
        setBlockchainAppData(null);
        setIsAppRegistered(false); // App doesn't exist
        setBlockchainAppVersionError(null);
      } else {
        setBlockchainAppVersionError(`Failed to fetch app version data: ${error.message}`);
        setBlockchainAppVersion(null);
        setBlockchainAppData(null);
        setIsAppRegistered(false);
      }
    } finally {
      setBlockchainAppVersionLoading(false);
    }
  }, [appId, versionId]);

  useEffect(() => {
    fetchBlockchainAppVersionData();
  }, [appId, versionId, fetchBlockchainAppVersionData]);

  const refetch = useCallback(() => {
    fetchBlockchainAppVersionData();
  }, [fetchBlockchainAppVersionData]);

  return {
    blockchainAppVersion,
    blockchainAppVersionError,
    blockchainAppVersionLoading,
    blockchainAppData,
    isAppRegistered,
    refetch,
  };
}
