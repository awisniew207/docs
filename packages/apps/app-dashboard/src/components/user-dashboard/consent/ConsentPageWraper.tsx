import { useParams } from 'react-router';
import { ConsentPage } from './ConsentPage';
import { ConsentPageSkeleton } from './ConsentPageSkeleton';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useConsentInfo } from '@/hooks/user-dashboard/consent/useConsentInfo';
import { useConsentMiddleware } from '@/hooks/user-dashboard/consent/useConsentMiddleware';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { ReturningUserConsent } from './ReturningUserConsent';
import { AppNotInRegistryConsent } from './AppNotInRegistry';
import { AppVersionNotInRegistryConsent } from './AppVersionNotInRegistry';

export function ConsentPageWrapper() {
  const { appId } = useParams();

  const { authInfo, sessionSigs, isProcessing, error } = useReadAuthInfo();
  const { isLoading, isError, data } = useConsentInfo(appId || '');
  const {
    isPermitted,
    exists,
    activeVersionExists,
    version,
    isLoading: isPermittedLoading,
    error: isPermittedError,
  } = useConsentMiddleware({
    appId: appId || '',
    pkpTokenId: authInfo?.agentPKP?.tokenId || '',
    appData: data?.app,
  });

  // Early return if required params are missing
  if (!appId || !authInfo?.agentPKP?.tokenId) {
    return <ConsentPageSkeleton />;
  }

  if (isLoading || isProcessing || isPermittedLoading) {
    return <ConsentPageSkeleton />;
  }

  if (isError || error || isPermittedError) {
    return <StatusMessage message="Error loading consent info" type="error" />;
  }

  if (!data || !authInfo || !sessionSigs) {
    return <ConsentPageSkeleton />;
  }

  if (exists === false) {
    return (
      <AppNotInRegistryConsent
        appData={data.app}
        readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      />
    );
  }

  if (exists === true && activeVersionExists === false) {
    return (
      <AppVersionNotInRegistryConsent
        appData={data.app}
        readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      />
    );
  }

  if (isPermitted === true && version) {
    return (
      <ReturningUserConsent
        appData={data.app}
        version={version}
        readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
      />
    );
  }

  return (
    <ConsentPage
      consentInfoMap={data}
      readAuthInfo={{ authInfo, sessionSigs, isProcessing, error }}
    />
  );
}
