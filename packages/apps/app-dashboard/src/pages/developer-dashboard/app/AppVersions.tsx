import { AppVersionsWrapper } from '@/components/developer-dashboard/app/wrappers/AppVersionsWrapper';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { App } from '@/contexts/DeveloperDataContext';

interface AppVersionsProps {
  app: App;
  appVersions: any[];
}

export default function AppVersions({ app, appVersions }: AppVersionsProps) {
  useAddressCheck(app);

  return (
    <AppVersionsWrapper
      versions={appVersions}
      appId={app.appId}
      latestVersion={app.activeVersion}
    />
  );
}
