import { useParams } from 'react-router';
import { ConsentPage } from './ConsentPage';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useConsentInfo } from '@/hooks/user-dashboard/useConsentInfo';

export function ConsentPageWrapper() {
  const { appId } = useParams();

  const { isLoading, isError, data } = useConsentInfo(appId || '');

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <StatusMessage message="Error loading consent info" type="error" />;
  }

  if (!data) {
    return <Loading />;
  }

  return <ConsentPage consentInfoMap={data} />;
}
