import { FormRenderer } from '../FormRenderer';
import { EntitySelector } from '../EntitySelector';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { z } from 'zod';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useState } from 'react';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, X } from 'lucide-react';
import {
  type ToolSelection,
  getErrorMessage,
  clearResultWithDelay,
  formatMultipleErrors,
  REDIRECT_DELAY_MS,
} from '@/utils/developer-dashboard/app-forms';

// =============================================================================
// SCHEMA BUILDERS
// =============================================================================

function buildEditAppVersionToolFormValidationSchema() {
  const { hiddenSupportedPolicies } = docSchemas.appVersionToolDoc.shape;

  return z
    .object({
      hiddenSupportedPolicies: hiddenSupportedPolicies.optional(),
    })
    .partial()
    .strict();
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const AppVersionToolEdit = buildEditAppVersionToolFormValidationSchema();

// =============================================================================
// APP VERSION TOOL FORMS
// =============================================================================

export function CreateAppVersionToolsForm({
  appId,
  versionId,
  hideHeader = false,
}: {
  appId: number;
  versionId: number;
  hideHeader?: boolean;
}) {
  const vincentApi = useVincentApiWithSIWE();
  const [createAppVersionTool] = vincentApi.useCreateAppVersionToolMutation();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTools, setSelectedTools] = useState<ToolSelection[]>([]);

  const handleSubmit = async () => {
    if (selectedTools.length === 0) {
      setError('Please select at least one tool');
      return;
    }

    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      // Create AppVersionTool for each selected tool with its actual version
      const createPromises = selectedTools.map((toolData: ToolSelection) =>
        createAppVersionTool({
          appId,
          appVersion: versionId,
          toolPackageName: toolData.packageName,
          appVersionToolCreate: {
            toolVersion: toolData.activeVersion, // Use actual version from the tool data
            hiddenSupportedPolicies: [],
          },
        }),
      );

      const results = await Promise.all(createPromises);

      // Check for errors
      const errors = results.filter((result) => 'error' in result);
      if (errors.length > 0) {
        throw new Error(formatMultipleErrors(errors, 'add tools'));
      }

      setResult({
        message: `Successfully added ${selectedTools.length} tools to app version ${versionId}`,
      });

      // Clear selected tools and refetch current tools
      setSelectedTools([]);

      // Clear result after a delay
      clearResultWithDelay(() => setResult(null));
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to add tools to app version'));
    } finally {
      setIsLoading(false);
    }
  };

  if (error) return <StatusMessage message={error} type="error" />;
  if (result)
    return (
      <StatusMessage message={'Tools added successfully! Refreshing page...'} type="success" />
    );

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        {!hideHeader && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900">Add Tools to App Version</h3>
            <p className="text-gray-600 text-sm mt-1">
              Select tools to add to app version {versionId}. The actual version from each tool will
              be used.
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Tools</label>
            <EntitySelector
              entityType="tool"
              selectedEntities={selectedTools}
              onChange={setSelectedTools}
              error={undefined}
              disabled={isLoading}
            />
          </div>

          {selectedTools.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Tools:</h4>
              <div className="space-y-1">
                {selectedTools.map((tool) => (
                  <div key={tool.packageName} className="text-sm text-gray-600">
                    <strong>{tool.packageName}</strong> - Version {tool.activeVersion}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || selectedTools.length === 0}
              className="px-4 py-2"
            >
              {isLoading
                ? 'Adding Tools...'
                : `Add ${selectedTools.length} Selected Tool${selectedTools.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditAppVersionToolForm({
  appId,
  versionId,
  toolPackageName,
  initialData,
  hideHeader = false,
  onSuccess,
}: {
  appId: number;
  versionId: number;
  toolPackageName: string;
  initialData?: any;
  hideHeader?: boolean;
  onSuccess?: () => void;
}) {
  const vincentApi = useVincentApiWithSIWE();
  const [editAppVersionTool, { isLoading }] = vincentApi.useEditAppVersionToolMutation();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (data: z.infer<typeof AppVersionToolEdit>) => {
    setError(null);
    setResult(null);

    try {
      const response = await editAppVersionTool({
        appId,
        appVersion: versionId,
        toolPackageName,
        appVersionToolEdit: data,
      });

      if ('error' in response) {
        setError(getErrorMessage(response.error, 'Failed to update tool'));
        return;
      }

      setResult({
        message: `Successfully updated tool ${toolPackageName}`,
      });

      if (onSuccess) {
        setTimeout(() => onSuccess(), REDIRECT_DELAY_MS);
      } else {
        clearResultWithDelay(() => setResult(null));
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to update tool'));
    }
  };

  if (error) return <StatusMessage message={error} type="error" />;
  if (result)
    return <StatusMessage message={'Tool updated successfully! Refreshing...'} type="success" />;

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        {!hideHeader && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900">Edit App Version Tool</h3>
            <p className="text-gray-600 text-sm mt-1">
              Update settings for {toolPackageName} in app version {versionId}
            </p>
          </div>
        )}

        <FormRenderer
          schema={AppVersionToolEdit}
          onSubmit={handleSubmit}
          title=""
          description=""
          initialData={initialData}
          hiddenFields={['_id', 'createdAt', 'updatedAt', 'appId', 'appVersion', 'toolPackageName']}
          isLoading={isLoading}
          hideHeader={true}
        />
      </div>
    </div>
  );
}

// List existing tools for an app version
export function AppVersionToolsList({ appId, versionId }: { appId: number; versionId: number }) {
  const [removingTool, setRemovingTool] = useState<string | null>(null);
  const [editingTool, setEditingTool] = useState<string | null>(null);
  const vincentApi = useVincentApiWithSIWE();
  const [editAppVersionTool] = vincentApi.useEditAppVersionToolMutation();

  const {
    data: tools,
    isLoading,
    error,
    refetch,
  } = vincentApiClient.useListAppVersionToolsQuery({
    appId,
    version: versionId,
  });

  const handleEditTool = (toolPackageName: string) => {
    setEditingTool(toolPackageName);
  };

  const handleCancelEdit = () => {
    setEditingTool(null);
  };

  const handleSaveEdit = async (
    toolPackageName: string,
    data: z.infer<typeof AppVersionToolEdit>,
  ) => {
    try {
      const response = await editAppVersionTool({
        appId,
        appVersion: versionId,
        toolPackageName,
        appVersionToolEdit: data,
      });

      if ('error' in response) {
        throw new Error(getErrorMessage(response.error, 'Failed to update tool'));
      }

      setEditingTool(null);
      await refetch();
    } catch (error: unknown) {
      alert(getErrorMessage(error, 'Failed to update tool'));
    }
  };

  const handleRemoveTool = async (toolPackageName: string) => {
    // TODO: Implement when delete API is available
    const confirmed = window.confirm(
      `Are you sure you want to remove ${toolPackageName} from this app version?`,
    );

    if (!confirmed) return;

    setRemovingTool(toolPackageName);

    try {
      // FIXME: Placeholder for future delete API call
      // await deleteAppVersionTool({ appId, appVersion: versionId, toolPackageName });

      alert('Remove tool functionality is not yet available in the API. Please check back later.');

      // When API is available, uncomment this:
      // await refetch();
    } catch (error) {
      console.error('Failed to remove tool:', error);
      alert('Failed to remove tool. Please try again.');
    } finally {
      setRemovingTool(null);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <StatusMessage message="Failed to load tools" type="error" />;

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
              // Edit mode - render form inline
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h4 className="font-medium text-gray-900">Edit {tool.toolPackageName}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <EditToolForm
                  tool={tool}
                  onSave={(data) => handleSaveEdit(tool.toolPackageName, data)}
                  onCancel={handleCancelEdit}
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
                    onClick={() => handleEditTool(tool.toolPackageName)}
                    className="h-8 px-2"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveTool(tool.toolPackageName)}
                    disabled={removingTool === tool.toolPackageName}
                    className="h-8 px-2"
                  >
                    {removingTool === tool.toolPackageName ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
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

// Compact inline edit form for tool cards
function EditToolForm({
  tool,
  onSave,
  onCancel,
}: {
  tool: any;
  onSave: (data: z.infer<typeof AppVersionToolEdit>) => void;
  onCancel: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: z.infer<typeof AppVersionToolEdit>) => {
    setIsLoading(true);
    try {
      await onSave(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <FormRenderer
        schema={AppVersionToolEdit}
        onSubmit={handleSubmit}
        title=""
        description=""
        initialData={{
          hiddenSupportedPolicies: tool.hiddenSupportedPolicies || [],
        }}
        hiddenFields={['toolVersion']}
        isLoading={isLoading}
        hideHeader={true}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
