import { EditAppVersionWrapper } from '@/components/developer-dashboard/app/wrappers/EditAppVersionWrapper';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { App } from '@/contexts/DeveloperDataContext';

interface AppEditVersionProps {
  app: App;
  versionData: any;
  refetchVersions: () => Promise<any>;
  refetchVersionData: () => Promise<any>;
}

export default function AppEditVersion({
  app,
  versionData,
  refetchVersions,
  refetchVersionData,
}: AppEditVersionProps) {
  useAddressCheck(app);

  const versionId = versionData.version;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Edit Version {versionId}</h1>
          <p className="text-gray-600 mt-2">Update this version of your application</p>
        </div>
      </div>

      <EditAppVersionWrapper
        app={app}
        versionData={versionData}
        refetchVersions={refetchVersions}
        refetchVersionData={refetchVersionData}
      />
    </div>
  );
}
