import { useNavigate } from 'react-router-dom';
import { useUrlAppId } from '@/components/consent/hooks/useUrlAppId';
import { AppDetailsView } from '../views/AppDetailsView';

interface AppOverviewWrapperProps {
  app: any;
}

export function AppOverviewWrapper({ app }: AppOverviewWrapperProps) {
  const navigate = useNavigate();
  const { appId } = useUrlAppId();

  const handleOpenModal = (modalType: string) => {
    navigate(`/developer/appId/${appId}/${modalType}`);
  };

  return <AppDetailsView selectedApp={app} onOpenModal={handleOpenModal} />;
}
