import { FormRenderer } from './FormRenderer';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { z } from 'zod';
import { useUrlAppId } from '@/components/consent/hooks/useUrlAppId';
import { useParams, useNavigate } from 'react-router-dom';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useState } from 'react';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import {
  ToolSelectionSchema,
  type ToolSelection,
  navigateWithDelay,
  getErrorMessage,
} from '@/utils/developer-dashboard/app-forms';

// =============================================================================
// SCHEMA BUILDERS
// =============================================================================

function buildCreateAppVersionFormValidationSchema() {
  const changesField = z
    .string()
    .min(1, 'Changes description is required')
    .describe('Describes what changed between this version and the previous version.');

  return z
    .object({
      changes: changesField,
      // Tools for this version with proper typing
      tools: z.array(ToolSelectionSchema).optional().describe('Tools to include in this version'),
    })
    .strict();
}

function buildEditAppVersionFormValidationSchema() {
  const { changes } = docSchemas.appVersionDoc.shape;
  return z.object({ changes }).partial().strict();
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const AppVersionCreate = buildCreateAppVersionFormValidationSchema();
const AppVersionEdit = buildEditAppVersionFormValidationSchema();

// =============================================================================
// APP VERSION FORMS
// =============================================================================

export function CreateAppVersionForm({ appData }: { appData?: any }) {
  const vincentApi = useVincentApiWithSIWE();
  const [createAppVersion, { isLoading: isCreatingVersion }] =
    vincentApi.useCreateAppVersionMutation();
  const [createAppVersionTool] = vincentApi.useCreateAppVersionToolMutation();
  const { appId } = useUrlAppId();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get refetch function for sidebar's version query
  const { refetch: refetchAppVersions } = vincentApiClient.useGetAppVersionsQuery(
    { appId: parseInt(appId!) },
    { skip: !appId },
  );

  if (!appData) return <Loading />;

  const handleSubmit = async (data: z.infer<typeof AppVersionCreate>) => {
    if (!appId) {
      setError('No app ID found in URL');
      return;
    }

    setError(null);
    setResult(null);
    setIsProcessing(true);

    try {
      // Extract tools from data before creating the version
      const { tools, ...versionData } = data;

      const versionResult = await createAppVersion({
        appId: parseInt(appId),
        appVersionCreate: versionData,
      });

      if ('error' in versionResult) {
        setError(getErrorMessage(versionResult.error, 'Failed to create app version'));
        return;
      }

      const createdVersion = versionResult.data;
      const newVersionNumber = createdVersion?.version;

      // If tools were selected, create AppVersionTool entries
      if (tools && tools.length > 0 && newVersionNumber) {
        const toolPromises = tools.map((tool: ToolSelection) =>
          createAppVersionTool({
            appId: parseInt(appId),
            appVersion: newVersionNumber,
            toolPackageName: tool.packageName,
            appVersionToolCreate: {
              toolVersion: tool.activeVersion, // Use actual version from selected tool
              hiddenSupportedPolicies: [], // No hidden policies by default
            },
          }),
        );

        const toolResults = await Promise.all(toolPromises);

        // Check for any tool creation errors
        const toolErrors = toolResults.filter((result) => 'error' in result);
        if (toolErrors.length > 0) {
          // Version was created successfully, but some tools failed
          console.warn(`Version created but ${toolErrors.length} tools failed to add:`, toolErrors);
          setResult({
            message: `App version created successfully! However, ${toolErrors.length} tools failed to add. You can add them manually later.`,
            type: 'warning',
          });
        } else {
          setResult({
            message: `App version created successfully with ${tools.length} tools added!`,
            type: 'success',
          });
        }
      } else {
        setResult({
          message: 'App version created successfully!',
          type: 'success',
        });
      }

      // Refetch app versions for sidebar update
      await refetchAppVersions();

      // Navigate to the new version's detail page with delay
      navigateWithDelay(navigate, `/developer/appId/${appId}/version/${newVersionNumber}`);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to create app version'));
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isCreatingVersion || isProcessing;

  if (error) return <StatusMessage message={error} type="error" />;
  if (result) {
    return (
      <StatusMessage message="App version created successfully! Redirecting..." type="success" />
    );
  }

  return (
    <FormRenderer
      schema={AppVersionCreate}
      onSubmit={handleSubmit}
      title="Create App Version"
      description="Create a new version of an application and select tools"
      defaultValues={{ changes: '', tools: [] }}
      hiddenFields={['_id', 'createdAt', 'updatedAt', 'appId', 'version']}
      isLoading={isLoading}
      hideHeader={true}
    />
  );
}

export function EditAppVersionForm({ versionData }: { versionData?: any }) {
  const vincentApi = useVincentApiWithSIWE();
  const [editAppVersion, { isLoading }] = vincentApi.useEditAppVersionMutation();
  const { appId, versionId } = useParams<{ appId: string; versionId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  if (!appId || !versionId) return <Loading />;

  const handleSubmit = async (data: z.infer<typeof AppVersionEdit>) => {
    setError(null);
    setResult(null);

    try {
      const response = await editAppVersion({
        appId: parseInt(appId),
        version: parseInt(versionId),
        appVersionEdit: data,
      });

      if ('error' in response) {
        setError(getErrorMessage(response.error, 'Failed to update app version'));
        return;
      }

      setResult({ message: 'App version updated successfully!' });

      // Navigate back to version detail page with delay
      navigateWithDelay(navigate, `/developer/appId/${appId}/version/${versionId}`);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to update app version'));
    }
  };

  if (error) return <StatusMessage message={error} type="error" />;
  if (result)
    return (
      <StatusMessage message="App version updated successfully! Redirecting..." type="success" />
    );

  return (
    <FormRenderer
      schema={AppVersionEdit}
      onSubmit={handleSubmit}
      title="Edit App Version"
      description="Update changes for a specific app version"
      initialData={{ changes: versionData?.changes || '' }}
      hiddenFields={['_id', 'createdAt', 'updatedAt', 'appId', 'version']}
      isLoading={isLoading}
      hideHeader={true}
    />
  );
}
