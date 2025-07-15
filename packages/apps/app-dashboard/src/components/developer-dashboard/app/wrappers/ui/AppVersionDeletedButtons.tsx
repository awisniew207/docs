import { UndeleteAppVersionButton } from './UndeleteAppVersionButton';
import { AppVersion } from '@/types/developer-dashboard/appTypes';

interface AppVersionDeletedButtonsProps {
  appVersion: AppVersion;
}

export function AppVersionDeletedButtons({ appVersion }: AppVersionDeletedButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative z-10 bg-white rounded-lg opacity-100">
        <UndeleteAppVersionButton appVersion={appVersion} />
      </div>
    </div>
  );
}
