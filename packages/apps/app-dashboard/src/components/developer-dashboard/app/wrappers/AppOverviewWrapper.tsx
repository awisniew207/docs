import { useNavigate } from 'react-router-dom';
import { useUrlAppId } from '@/components/consent/hooks/useUrlAppId';
import { AppDetailsView } from '../views/AppDetailsView';
import { App } from '@/contexts/DeveloperDataContext';

interface AppOverviewWrapperProps {
  app: App;
}

export function AppOverviewWrapper({ app }: AppOverviewWrapperProps) {
  const navigate = useNavigate();
  const { appId } = useUrlAppId();

  const handleOpenMutation = (mutationType: string) => {
    navigate(`/developer/appId/${appId}/${mutationType}`);
  };

  return <AppDetailsView selectedApp={app} onOpenMutation={handleOpenMutation} />;
}
