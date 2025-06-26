import { Button } from '@/components/ui/button';
import { Edit, X } from 'lucide-react';
import { EditAppVersionToolWrapper } from './wrappers/EditAppVersionToolWrapper';

interface AppVersionToolsListProps {
  tools: any[];
  appId: number;
  versionId: number;
  editingTool: string | null;
  onEditTool: (toolPackageName: string) => void;
  onCancelEdit: () => void;
  onEditSuccess: () => Promise<void>;
}

export function AppVersionToolsList({
  tools,
  appId,
  versionId,
  editingTool,
  onEditTool,
  onCancelEdit,
  onEditSuccess,
}: AppVersionToolsListProps) {
  if (!tools || tools.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No tools assigned to this app version yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {tools.map((tool: any) => (
          <div key={tool.toolPackageName} className="bg-white border rounded-lg p-4">
            {editingTool === tool.toolPackageName ? (
              // Edit mode - render wrapper
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h4 className="font-medium text-gray-900">Edit {tool.toolPackageName}</h4>
                  <Button variant="ghost" size="sm" onClick={onCancelEdit} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <EditAppVersionToolWrapper
                  appId={appId}
                  versionId={versionId}
                  tool={tool}
                  onSuccess={onEditSuccess}
                  onCancel={onCancelEdit}
                />
              </div>
            ) : (
              // Normal display mode
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{tool.toolPackageName}</h4>
                  <p className="text-sm text-gray-500">Version: {tool.toolVersion}</p>
                  {tool.hiddenSupportedPolicies?.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Hidden policies: {tool.hiddenSupportedPolicies.join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-400">
                    Added: {new Date(tool.createdAt).toLocaleDateString()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditTool(tool.toolPackageName)}
                    className="h-8 px-2"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
