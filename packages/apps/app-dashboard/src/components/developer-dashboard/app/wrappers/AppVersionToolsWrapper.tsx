import { AppVersionTool } from '@/contexts/DeveloperDataContext';
import { ManageAppVersionTools } from '../views/ManageAppVersionTools';
import { CreateAppVersionToolsWrapper } from './CreateAppVersionToolsWrapper';

interface AppVersionToolsWrapperProps {
  appId: number;
  versionId: number;
  tools: AppVersionTool[];
  refetchVersionTools: () => Promise<any>;
  onToolAdd: (tool: any) => Promise<void>;
  availableTools: any[];
}

export function AppVersionToolsWrapper({
  appId,
  versionId,
  tools,
  refetchVersionTools,
  onToolAdd,
  availableTools,
}: AppVersionToolsWrapperProps) {
  const existingToolNames = tools?.map((tool) => tool.toolPackageName) || [];

  return (
    <div className="space-y-6">
      {/* Add Tools Form */}
      <CreateAppVersionToolsWrapper
        versionId={versionId}
        existingTools={existingToolNames}
        onToolAdd={onToolAdd}
        availableTools={availableTools}
      />

      {/* Current Tools List */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Current Tools</h3>
          <p className="text-gray-600 text-sm mt-1">
            Tools currently associated with this version. Click the edit button to modify settings
            inline.
          </p>
        </div>
        <ManageAppVersionTools
          tools={tools}
          appId={appId}
          versionId={versionId}
          onEditSuccess={refetchVersionTools}
        />
      </div>
    </div>
  );
}
