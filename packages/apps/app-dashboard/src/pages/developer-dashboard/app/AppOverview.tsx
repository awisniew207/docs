import { useNavigate } from 'react-router';
import { AppDetailsView } from '@/components/developer-dashboard/app/AppDetailsView';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/layout/Loading';
import { useAppDetail } from '@/components/developer-dashboard/app/AppDetailContext';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';

export default function AppOverview() {
  const navigate = useNavigate();
  const { appId, app, appError, appLoading } = useAppDetail();

  useAddressCheck(app);

  // Loading state
  if (appLoading) return <Loading />;

  // Error handling
  if (appError || !app) {
    return <StatusMessage message="App not found" type="error" />;
  }

  return (
    <AppDetailsView
      selectedApp={app}
      onOpenModal={(modalType: string) => navigate(`/developer/appId/${appId}/${modalType}`)}
    />
  );
}
