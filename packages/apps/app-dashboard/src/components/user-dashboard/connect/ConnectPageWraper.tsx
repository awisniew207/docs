import { useParams } from 'react-router';
import { ConnectPage } from './ConnectPage';
import { ConnectPageSkeleton } from './ConnectPageSkeleton';
import { GeneralErrorScreen } from './GeneralErrorScreen';
import { BadRedirectUriError } from './BadRedirectUriError';
import { AuthConnectScreen } from './AuthConnectScreen';
import { useConnectInfo } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { useConnectMiddleware } from '@/hooks/user-dashboard/connect/useConnectMiddleware';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { ReturningUserConnect } from './ReturningUserConnect';
import { AppVersionNotInRegistryConnect } from './AppVersionNotInRegistry';
import { useUriPrecheck } from '@/hooks/user-dashboard/connect/useUriPrecheck';

export function ConnectPageWrapper() {
  const { appId } = useParams();

  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();
  const { isLoading, isError, errors, data } = useConnectInfo(appId || '');
  const {
    isPermitted,
    appExists,
    activeVersionExists,
    userPermittedVersion,
    isLoading: isPermittedLoading,
    error: isPermittedError,
  } = useConnectMiddleware({
    appId: Number(appId),
    pkpEthAddress: authInfo?.agentPKP?.ethAddress || '',
    appData: data?.app,
  });

  const { result: isRedirectUriAuthorized, redirectUri } = useUriPrecheck({
    authorizedRedirectUris: data?.app?.redirectUris,
  });

  // Fetch version data for returning users to check if version is disabled
  const {
    data: versionData,
    isLoading: versionDataLoading,
    error: versionDataError,
  } = vincentApiClient.useGetAppVersionQuery(
    {
      appId: Number(appId),
      version: userPermittedVersion || 0,
    },
    {
      skip: !userPermittedVersion, // Only fetch if user has a permitted version
    },
  );

  // Early return if required params are missing
  if (!appId) {
    return <GeneralErrorScreen errorDetails="App ID was not provided" />;
  }

  // Wait for data to load first (but don't require sessionSigs for unauthenticated users)
  if (!data) {
    return <ConnectPageSkeleton />;
  }

  if (isLoading || isProcessing || isPermittedLoading || versionDataLoading) {
    return <ConnectPageSkeleton />;
  }

  // Check for redirect URI validation errors (only when redirectUri is provided but invalid)
  if (isRedirectUriAuthorized === false && redirectUri) {
    return (
      <BadRedirectUriError
        redirectUri={redirectUri || undefined}
        authorizedUris={data.app?.redirectUris}
      />
    );
  }

  const isUserAuthed = authInfo?.userPKP && authInfo?.agentPKP && sessionSigs;

  // Now that we have data, check authentication
  if (!isUserAuthed) {
    return (
      <AuthConnectScreen
        app={data.app}
        readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      />
    );
  }

  if (isError || error || isPermittedError || versionDataError) {
    const errorMessage =
      errors.length > 0
        ? errors.join(', ')
        : (error ?? isPermittedError ?? 'An unknown error occurred');
    return <GeneralErrorScreen errorDetails={errorMessage} />;
  }

  if (appExists === true && activeVersionExists === false) {
    return (
      <AppVersionNotInRegistryConnect
        appData={data.app}
        readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      />
    );
  }

  if (isPermitted === true && userPermittedVersion && versionData) {
    return (
      <ReturningUserConnect
        appData={data.app}
        version={userPermittedVersion}
        versionData={versionData}
        redirectUri={redirectUri || undefined}
        readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      />
    );
  }

  return (
    <ConnectPage
      connectInfoMap={data}
      readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
    />
  );
}
