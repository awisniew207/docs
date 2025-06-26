import { useNavigate } from 'react-router';
import { AppVersionsListView } from '../AppVersionsListView';

interface AppVersionsWrapperProps {
  versions: any[];
  appId: number;
  latestVersion?: number;
}

export function AppVersionsWrapper({ versions, appId, latestVersion }: AppVersionsWrapperProps) {
  const navigate = useNavigate();

  const handleVersionClick = (version: number) => {
    navigate(`/developer/appId/${appId}/version/${version}`);
  };

  return (
    <AppVersionsListView
      versions={versions}
      latestVersion={latestVersion}
      onVersionClick={handleVersionClick}
    />
  );
}
