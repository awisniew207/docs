import { AppVersionToolsWrapper } from '@/components/developer-dashboard/app/wrappers/AppVersionToolsWrapper';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { App } from '@/contexts/DeveloperDataContext';

interface AppVersionToolsProps {
  app: App;
  versionId: number;
  versionTools: any[];
  refetchVersionTools: () => Promise<any>;
  onToolAdd: (tool: any) => Promise<void>;
  availableTools: any[];
}

export default function AppVersionTools({
  app,
  versionId,
  versionTools,
  refetchVersionTools,
  onToolAdd,
  availableTools,
}: AppVersionToolsProps) {
  useAddressCheck(app);

  const appId = app.appId;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {app.name} - Version {versionId} Tools
          </h1>
          <p className="text-gray-600 mt-2">Manage tools for this app version</p>
        </div>
      </div>

      <AppVersionToolsWrapper
        appId={appId}
        versionId={versionId}
        tools={versionTools}
        refetchVersionTools={refetchVersionTools}
        onToolAdd={onToolAdd}
        availableTools={availableTools}
      />
    </div>
  );
}
