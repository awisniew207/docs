import { useNavigate } from 'react-router';
import { AppVersionsListView } from '../views/AppVersionsListView';

interface AppVersionsWrapperProps {
  versions: any[];
  appId: number;
  activeVersion?: number;
}

export function AppVersionsWrapper({ versions, appId, activeVersion }: AppVersionsWrapperProps) {
  const navigate = useNavigate();

  const handleVersionClick = (version: number) => {
    navigate(`/developer/appId/${appId}/version/${version}`);
  };

  return (
    <AppVersionsListView
      versions={versions}
      activeVersion={activeVersion}
      onVersionClick={handleVersionClick}
    />
  );
}
