import { CreateAppVersionWrapper } from '@/components/developer-dashboard/app/wrappers/CreateAppVersionWrapper';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { App } from '@/contexts/DeveloperDataContext';

interface AppCreateVersionProps {
  app: App;
  refetchVersions: () => Promise<any>;
}

export default function AppCreateVersion({ app, refetchVersions }: AppCreateVersionProps) {
  useAddressCheck(app);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Create New Version</h1>
          <p className="text-gray-600 mt-2">
            Create a new version of your application with updated features
          </p>
        </div>
      </div>

      <CreateAppVersionWrapper app={app} refetchVersions={refetchVersions} />
    </div>
  );
}
