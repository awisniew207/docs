import { FormRenderer } from './FormRenderer';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { z } from 'zod';
import { useUrlAppId } from '@/components/consent/hooks/useUrlAppId';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
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

function buildCreateAppFormValidationSchema() {
  const { name, description, contactEmail, appUserUrl, logo, redirectUris, deploymentStatus } =
    docSchemas.appDoc.shape;

  return z
    .object({
      name, // Required
      description,
      contactEmail,
      appUserUrl,
      logo,
      redirectUris,
      deploymentStatus,
      // Tools for initial version with proper typing
      tools: z
        .array(ToolSelectionSchema)
        .optional()
        .describe('Tools to include in the initial version'),
    })
    .strict();
}

function buildEditAppFormValidationSchema() {
  const { name, description, contactEmail, appUserUrl, logo, redirectUris, deploymentStatus } =
    docSchemas.appDoc.shape;

  return z
    .object({
      name,
      description,
      contactEmail,
      appUserUrl,
      logo,
      redirectUris,
      deploymentStatus,
    })
    .partial()
    .strict();
}

const createDeleteAppSchema = (appName: string) =>
  z.object({
    confirmation: z
      .string()
      .min(1, 'Confirmation is required')
      .describe(`Type exactly: "I want to delete app ${appName}" to confirm deletion`),
  });

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const AppCreate = buildCreateAppFormValidationSchema();
const AppEdit = buildEditAppFormValidationSchema();

// =============================================================================
// APP FORMS
// =============================================================================

export function CreateAppForm() {
  const vincentApi = useVincentApiWithSIWE();
  const [createApp, { isLoading: isCreatingApp }] = vincentApi.useCreateAppMutation();
  const [createAppVersionTool] = vincentApi.useCreateAppVersionToolMutation();
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get refetch function for sidebar's apps query
  const { refetch: refetchApps } = vincentApiClient.useListAppsQuery();

  if (!isConnected || !address) {
    return <Loading />;
  }

  const handleSubmit = async (data: z.infer<typeof AppCreate>) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    setError(null);
    setResult(null);
    setIsProcessing(true);

    try {
      const { tools, ...appDataForApi } = data;
      const appSubmissionData = { ...appDataForApi, managerAddress: address };

      // Step 1: Create the app (this automatically creates version 1)
      const appResponse = await createApp({ appCreate: appSubmissionData });

      if ('error' in appResponse) {
        setError(getErrorMessage(appResponse.error, 'Failed to create app'));
        return;
      }

      const createdApp = appResponse.data;
      const appId = createdApp?.appId;
      const appVersion = 1; // First version is always 1

      // Step 2: If tools were selected, create AppVersionTool entries
      if (tools && tools.length > 0 && appId) {
        const toolPromises = tools.map((tool: ToolSelection) =>
          createAppVersionTool({
            appId,
            appVersion,
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
          // App was created successfully, but some tools failed
          console.warn(`App created but ${toolErrors.length} tools failed to add:`, toolErrors);
          setResult({
            message: `App created successfully! However, ${toolErrors.length} tools failed to add. You can add them manually later.`,
            type: 'warning',
          });
        } else {
          setResult({
            message: `App created successfully with ${tools.length} tools added!`,
            type: 'success',
          });
        }
      } else {
        setResult({
          message: 'App created successfully!',
          type: 'success',
        });
      }

      // Refetch apps list for sidebar update
      await refetchApps();

      // Navigate to the new app's detail page with delay
      navigateWithDelay(navigate, `/developer/appId/${appId}`);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to create app'));
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isCreatingApp || isProcessing;

  if (error) return <StatusMessage message={error} type="error" />;
  if (result) {
    return <StatusMessage message="App created successfully! Redirecting..." type="success" />;
  }

  return (
    <FormRenderer
      schema={AppCreate}
      onSubmit={handleSubmit}
      title="Create New App"
      description="Create a new blockchain application and select initial tools"
      defaultValues={{ redirectUris: [''], tools: [] }}
      hiddenFields={['_id', 'createdAt', 'updatedAt', 'appId', 'activeVersion', 'managerAddress']}
      isLoading={isLoading}
      hideHeader={true}
    />
  );
}

export function EditAppForm({
  appData,
  hideHeader = false,
}: {
  appData?: any;
  hideHeader?: boolean;
}) {
  const vincentApi = useVincentApiWithSIWE();
  const [editApp, { isLoading }] = vincentApi.useEditAppMutation();
  const { address, isConnected } = useAccount();
  const { appId } = useUrlAppId();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  if (!appData) return <Loading />;

  const handleSubmit = async (data: z.infer<typeof AppEdit>) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }
    if (!appId) {
      setError('No app ID found in URL');
      return;
    }

    setError(null);
    setResult(null);

    try {
      const response = await editApp({
        appId: parseInt(appId),
        appEdit: data,
      });

      if ('error' in response) {
        setError(getErrorMessage(response.error, 'Failed to update app'));
        return;
      }

      setResult({ message: 'App updated successfully!' });

      // Navigate back to app detail page with delay
      navigateWithDelay(navigate, `/developer/appId/${appId}`);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to update app'));
    }
  };

  if (error) return <StatusMessage message={error} type="error" />;
  if (result)
    return <StatusMessage message="App updated successfully! Redirecting..." type="success" />;

  return (
    <FormRenderer
      schema={AppEdit}
      onSubmit={handleSubmit}
      title="Edit App"
      description="Update an existing application"
      defaultValues={{ redirectUris: [''] }}
      initialData={{
        name: appData.name,
        description: appData.description,
        contactEmail: appData.contactEmail,
        appUserUrl: appData.appUserUrl,
        logo: appData.logo,
        redirectUris: appData.redirectUris,
        deploymentStatus: appData.deploymentStatus,
      }}
      hiddenFields={['_id', 'createdAt', 'updatedAt', 'appId', 'activeVersion', 'managerAddress']}
      isLoading={isLoading}
      hideHeader={hideHeader}
    />
  );
}

export function DeleteAppForm({
  appData,
  hideHeader = false,
}: {
  appData?: any;
  hideHeader?: boolean;
}) {
  const vincentApi = useVincentApiWithSIWE();
  const [deleteApp, { isLoading }] = vincentApi.useDeleteAppMutation();
  const { appId } = useUrlAppId();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Get refetch function for apps list
  const { refetch: refetchApps } = vincentApiClient.useListAppsQuery();

  if (!appData || !appId) return <Loading />;

  const handleSubmit = async (data: { confirmation: string }) => {
    if (!appId) {
      setError('No app ID found in URL');
      return;
    }

    const expectedConfirmation = `I want to delete app ${appData.name}`;
    if (data.confirmation !== expectedConfirmation) {
      setError(`Please type exactly: "${expectedConfirmation}"`);
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${appData.name}"? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    setError(null);
    setResult(null);

    try {
      const response = await deleteApp({ appId: parseInt(appId) });

      if ('error' in response) {
        setError(getErrorMessage(response.error, 'Failed to delete app'));
        return;
      }

      setResult({ message: 'App deleted successfully!' });

      // Refetch apps list to remove the deleted app from cache
      await refetchApps();

      // Navigate to apps list with delay
      navigateWithDelay(navigate, '/developer/apps');
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to delete app'));
    }
  };

  if (error) return <StatusMessage message={error} type="error" />;
  if (result)
    return (
      <StatusMessage
        message="App deleted successfully! Redirecting to dashboard..."
        type="success"
      />
    );

  return (
    <FormRenderer
      schema={createDeleteAppSchema(appData.name)}
      onSubmit={handleSubmit}
      title="Delete App"
      description="Delete an application permanently"
      hiddenFields={[]}
      isLoading={isLoading}
      hideHeader={hideHeader}
    />
  );
}
