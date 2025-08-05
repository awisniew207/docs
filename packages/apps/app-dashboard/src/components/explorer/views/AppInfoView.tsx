import { App, AppVersion, AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import { AppInfo } from '../ui/AppInfo';
import { AppHeader } from '../ui/AppHeader';
import { Header } from '../ui/Header';
import { VersionInfo } from '../ui/VersionInfo';

interface AppInfoViewProps {
  app: App;
  versions: AppVersion[];
  versionAbilities: AppVersionAbility[];
}

export function AppInfoView({ app, versions, versionAbilities }: AppInfoViewProps) {
  // Filter out deleted AppVersionAbilities
  const activeVersionAbilities = versionAbilities.filter((ability) => !ability.isDeleted);

  return (
    <div className="fixed inset-0 bg-white overflow-auto">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Header with Back Button */}
        <Header showBackButton={true} />

        {/* Header Card */}
        <AppHeader app={app} versions={versions} versionAbilities={activeVersionAbilities} />

        {/* Main Content Grid */}
        <AppInfo app={app} />

        {/* Version Information */}
        <VersionInfo versions={versions} versionAbilities={activeVersionAbilities} app={app} />
      </div>
    </div>
  );
}
