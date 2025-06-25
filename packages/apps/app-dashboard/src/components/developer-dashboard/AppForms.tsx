import { FormRenderer } from './FormRenderer';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { z } from 'zod';
import { useUrlAppId } from '@/components/consent/hooks/useUrlAppId';
import { useAccount } from 'wagmi';
import { useNavigate, useParams } from 'react-router-dom';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useState } from 'react';
import { docSchemas } from '@lit-protocol/vincent-registry-sdk';

// Build proper form validation schemas from the SDK doc schemas
function buildCreateAppFormValidationSchema() {
  // Get the original fields with their types preserved
  const { name, description, contactEmail, appUserUrl, logo, redirectUris, deploymentStatus } =
    docSchemas.appDoc.shape;

  return z
    .object({
      // Required fields
      name,

      // Optional fields - use the original schema definitions
      description,
      contactEmail,
      appUserUrl,
      logo,
      redirectUris,
      deploymentStatus, // Remove .default('dev') to preserve enum structure
    })
    .strict();
}

function buildEditAppFormValidationSchema() {
  // Get the original fields with their types preserved
  const { name, description, contactEmail, appUserUrl, logo, redirectUris, deploymentStatus } =
    docSchemas.appDoc.shape;

  return z
    .object({
      // All fields optional for editing
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

function buildCreateAppVersionFormValidationSchema() {
  // Create a new string field with the same description as the original
  const changesField = z
    .string()
    .min(1, 'Changes description is required')
    .describe('Describes what changed between this version and the previous version.');

  return z
    .object({
      changes: changesField,
    })
    .strict();
}

function buildEditAppVersionFormValidationSchema() {
  const { changes } = docSchemas.appVersionDoc.shape;

  return z
    .object({
      changes,
    })
    .partial()
    .strict();
}

// Create schemas using the builders
const AppCreate = buildCreateAppFormValidationSchema();
const AppEdit = buildEditAppFormValidationSchema();
const AppVersionCreate = buildCreateAppVersionFormValidationSchema();
const AppVersionEdit = buildEditAppVersionFormValidationSchema();

// Create local DeleteApp schema since it doesn't exist in the SDK
const createDeleteAppSchema = (appId: string) =>
  z.object({
    confirmation: z
      .string()
      .min(1, 'Confirmation is required')
      .describe(`Type exactly: "I want to delete app ${appId}" to confirm deletion`)
      .refine((val: string) => val === `I want to delete app ${appId}`, {
        message: `Please type exactly: "I want to delete app ${appId}"`,
      }),
  });

export function CreateAppForm() {
  const vincentApi = useVincentApiWithSIWE();
  const [createApp, { isLoading }] = vincentApi.useCreateAppMutation();
  const { address, isConnected } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Show loading if wallet is not connected yet (required for creating apps)
  if (!isConnected || !address) {
    return <Loading />;
  }

  const handleSubmit = async (data: any) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    setError(null);
    setResult(null);

    try {
      // Prepare app data (backend generates its own appId)
      const appDataForApi = {
        ...data,
        managerAddress: address,
      };

      const response = await createApp({
        appCreate: appDataForApi,
      });

      setResult(response);
      // Refresh the page after successful submission
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to create app');
    }
  };

  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  if (result) {
    return <StatusMessage message="App created successfully! Refreshing page..." type="success" />;
  }

  return (
    <div>
      <FormRenderer
        schema={AppCreate}
        onSubmit={handleSubmit}
        title="Create App"
        description="Create a new blockchain application"
        defaultValues={{
          redirectUris: [''],
        }}
        hiddenFields={['_id', 'createdAt', 'updatedAt', 'appId', 'activeVersion', 'managerAddress']}
        isLoading={isLoading}
      />
    </div>
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
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Show loading if we don't have appData yet (required for editing)
  if (!appData) {
    return <Loading />;
  }

  const handleSubmit = async (data: any) => {
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
      const { ...editAppData } = data;

      const response = await editApp({
        appId: parseInt(appId),
        appEdit: editAppData,
      });

      setResult(response);
      // Refresh the page after successful submission
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to update app');
    }
  };

  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  if (result) {
    return <StatusMessage message="App updated successfully! Refreshing page..." type="success" />;
  }

  return (
    <FormRenderer
      schema={AppEdit}
      onSubmit={handleSubmit}
      title="Edit App"
      description="Update an existing application"
      defaultValues={{
        redirectUris: [''],
      }}
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

  // Show loading if we don't have appData yet (required for deletion context)
  if (!appData) {
    return <Loading />;
  }

  const handleSubmit = async (data: any) => {
    if (!appId) {
      setError('No app ID found in URL');
      return;
    }

    // Additional validation - check if the confirmation matches
    const expectedConfirmation = `I want to delete app ${appId}`;
    if (data.confirmation !== expectedConfirmation) {
      setError(`Please type exactly: "${expectedConfirmation}"`);
      return;
    }

    // Confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete app ID ${appId}? This action cannot be undone.`,
    );
    if (!confirmDelete) {
      return;
    }

    setError(null);
    setResult(null);

    try {
      const response = await deleteApp({
        appId: parseInt(appId),
      });

      setResult(response);
      // Refresh the page after successful submission
      navigate('/developer/dasboard/apps');
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to delete app');
    }
  };

  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  if (result) {
    return (
      <StatusMessage
        message="App deleted successfully! Redirecting to dashboard..."
        type="success"
      />
    );
  }

  return (
    <FormRenderer
      schema={createDeleteAppSchema(appId || '0')}
      onSubmit={handleSubmit}
      title="Delete App"
      description="Delete an application permanently"
      hiddenFields={[]}
      isLoading={isLoading}
      hideHeader={hideHeader}
    />
  );
}

export function CreateAppVersionForm({
  appData,
  hideHeader = false,
}: {
  appData?: any;
  hideHeader?: boolean;
}) {
  const vincentApi = useVincentApiWithSIWE();
  const [createAppVersion, { isLoading }] = vincentApi.useCreateAppVersionMutation();
  const { appId } = useUrlAppId();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Show loading if we don't have appData yet (required for context)
  if (!appData) {
    return <Loading />;
  }

  const handleSubmit = async (data: any) => {
    if (!appId) {
      setError('No app ID found in URL');
      return;
    }

    setError(null);
    setResult(null);

    try {
      const { ...versionDataForApi } = data;
      const result = await createAppVersion({
        appId: parseInt(appId),
        appVersionCreate: versionDataForApi,
      });

      if ('error' in result) {
        throw new Error(
          result.error?.data?.message || result.error?.message || 'Failed to create app version',
        );
      }

      setResult(result);
      // Refresh the page after successful submission
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to create app version');
    }
  };

  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  if (result) {
    return (
      <StatusMessage
        message="App version created successfully! Refreshing page..."
        type="success"
      />
    );
  }

  return (
    <FormRenderer
      schema={AppVersionCreate}
      onSubmit={handleSubmit}
      title="Create App Version"
      description="Create a new version of an application"
      defaultValues={{
        changes: '',
      }}
      isLoading={isLoading}
      hideHeader={hideHeader}
    />
  );
}

export function GetAppVersionsForm() {
  const vincentApi = useVincentApiWithSIWE();
  const [getAppVersions, { isLoading }] = vincentApi.useLazyGetAppVersionsQuery({} as any);
  const { appId } = useUrlAppId();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Show loading if we don't have appId yet (required for the API call)
  if (!appId) {
    return <Loading />;
  }

  const handleSubmit = async () => {
    setError(null);
    setResult(null);

    try {
      const data = await getAppVersions({ appId: parseInt(appId) });
      setResult(data);
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to get app versions');
    }
  };

  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  if (result) {
    return (
      <div>
        <StatusMessage message="App versions retrieved successfully!" type="success" />
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  }

  // Create a minimal schema for the form (no fields needed since appId comes from URL)
  const EmptySchema = z.object({});

  return (
    <div>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-800">App ID from URL: {appId}</p>
      </div>
      <FormRenderer
        schema={EmptySchema}
        onSubmit={handleSubmit}
        title="Get App Versions"
        description="Fetch all versions of an application"
        isLoading={isLoading}
      />
    </div>
  );
}

export function EditAppVersionForm({
  versionData,
  hideHeader = false,
}: {
  versionData?: any;
  hideHeader?: boolean;
}) {
  const vincentApi = useVincentApiWithSIWE();
  const [editAppVersion, { isLoading }] = vincentApi.useEditAppVersionMutation();
  const { appId, versionId } = useParams<{ appId: string; versionId: string }>();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Show loading if we don't have required params or version data
  if (!appId || !versionId || !versionData) {
    return <Loading />;
  }

  const handleSubmit = async (data: any) => {
    setError(null);
    setResult(null);

    try {
      const { ...versionDataForApi } = data;
      const response = await editAppVersion({
        appId: parseInt(appId),
        version: parseInt(versionId),
        appVersionEdit: versionDataForApi,
      });

      setResult(response);
      // Refresh the page after successful submission
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to edit app version');
    }
  };

  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  if (result) {
    return (
      <StatusMessage
        message="App version updated successfully! Refreshing page..."
        type="success"
      />
    );
  }

  // If we have a version from URL path, only show the changes field
  if (versionId) {
    const ChangesOnlySchema = z.object({
      changes: z
        .string()
        .describe('Describes what changed between this version and the previous version.'),
    });

    return (
      <div>
        <FormRenderer
          schema={ChangesOnlySchema}
          onSubmit={handleSubmit}
          title={`Edit App Version ${versionId}`}
          description="Update the changelog for this specific app version"
          initialData={{
            changes: versionData?.changes || '',
          }}
          isLoading={isLoading}
          hideHeader={hideHeader}
        />
      </div>
    );
  }

  // Original form with version selector for backward compatibility
  return (
    <FormRenderer
      schema={AppVersionEdit}
      onSubmit={handleSubmit}
      title="Edit App Version"
      description="Update changes for a specific app version"
      isLoading={isLoading}
      hideHeader={hideHeader}
    />
  );
}
