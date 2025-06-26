import { AppVersionsListView } from '@/components/developer-dashboard/app/AppVersionsListView';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { App } from '@/contexts/DeveloperDataContext';

interface AppVersionsProps {
  app: App;
  appVersions: any[];
  isLoading: boolean;
}

export default function AppVersions({ app, appVersions, isLoading }: AppVersionsProps) {
  useAddressCheck(app);

  return (
    <AppVersionsListView
      versions={appVersions}
      appId={app.appId}
      latestVersion={app.activeVersion}
      isLoading={isLoading}
    />
  );
}
