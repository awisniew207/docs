import { FormRenderer } from './FormRenderer';
import { useVincentApiWithSIWE } from '@/hooks/developer-dashboard/useVincentApiWithSIWE';
import { z } from 'zod';
import { useUrlAppId } from '@/components/consent/hooks/useUrlAppId';
import { useAccount } from 'wagmi';
import { useParams } from 'react-router-dom';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useState } from 'react';

// Local Zod schemas since the SDK only exports TypeScript types, not Zod schemas
const AppCreate = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  contactEmail: z.string().email().optional(),
  appUserUrl: z.string().url().optional(),
  logo: z.string().optional(),
  redirectUris: z.array(z.string().url()).optional(),
  deploymentStatus: z.enum(['dev', 'test', 'prod']).optional(),
  managerAddress: z.string().optional(),
});

const AppEdit = AppCreate.partial();

const AppVersionCreate = z.object({
  changes: z.string().optional(),
});

const AppVersionEdit = z.object({
  changes: z.string().optional(),
});

// Create local DeleteApp schema since it doesn't exist in the SDK
const createDeleteAppSchema = (appId: string) =>
  z.object({
    confirmation: z
      .string()
      .min(1, 'Confirmation is required')
      .refine((val) => val === `I want to delete app ${appId}`, {
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
      // Generate appId and prepare app data
      const appId = Math.floor(Math.random() * 10000);
      const appDataForApi = {
        ...data,
        appId,
        managerAddress: address,
      };

      const response = await createApp({
        createApp: appDataForApi,
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
          tools: [],
          managerAddress: address || '',
        }}
        hiddenFields={['managerAddress', 'appId']}
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
        createApp: { ...editAppData, managerAddress: address },
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
      initialData={appData}
      isLoading={isLoading}
      hideHeader={hideHeader}
    />
  );
}

export function GetAppForm() {
  const vincentApi = useVincentApiWithSIWE();
  const [getApp, { isLoading }] = vincentApi.useLazyGetAppQuery({} as any);
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
      const data = await getApp({ appId: parseInt(appId) });
      setResult(data);
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to get app');
    }
  };

  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  if (result) {
    return (
      <div>
        <StatusMessage message="App retrieved successfully!" type="success" />
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
        title="Get App"
        description="Fetch an application by its ID from the URL"
        isLoading={isLoading}
      />
    </div>
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
      // Navigate back to dashboard after successful deletion
      setTimeout(() => (window.location.href = '/developer'), 2000);
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
        createAppVersion: versionDataForApi,
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
        tools: [''],
      }}
      initialData={appData}
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

export function EditAppVersionForm({ hideHeader = false }: { hideHeader?: boolean }) {
  const vincentApi = useVincentApiWithSIWE();
  const [editAppVersion, { isLoading }] = vincentApi.useEditAppVersionMutation();
  const { appId, versionId } = useParams<{ appId: string; versionId: string }>();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Show loading if we don't have required params
  if (!appId || !versionId) {
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
        versionChanges: versionDataForApi,
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
      changes: z.string().min(1, 'Changes description is required'),
    });

    return (
      <div>
        <FormRenderer
          schema={ChangesOnlySchema}
          onSubmit={handleSubmit}
          title={`Edit App Version ${versionId}`}
          description="Update the changelog for this specific app version"
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

export function GetAllAppsForm() {
  const vincentApi = useVincentApiWithSIWE();
  const [listApps, { isLoading }] = vincentApi.useLazyListAppsQuery({} as any);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    setError(null);
    setResult(null);

    try {
      const data = await listApps({});
      setResult(data);
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to get all apps');
    }
  };

  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  if (result) {
    return (
      <div>
        <StatusMessage message="Apps retrieved successfully!" type="success" />
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  }

  // Create a minimal schema for the form (no fields needed)
  const EmptySchema = z.object({});

  return (
    <FormRenderer
      schema={EmptySchema}
      onSubmit={handleSubmit}
      title="Get All Apps"
      description="Fetch all applications from the system"
      isLoading={isLoading}
    />
  );
}

export function SIWEAuthenticationStatus() {
  const vincentApi = useVincentApiWithSIWE();
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800">Please connect your wallet to enable registry changes.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
      <h3 className="text-lg font-semibold text-blue-900 mb-2">SIWE Authentication Status</h3>
      <p className="text-blue-800 mb-3">Connected wallet: {address}</p>
      <p className="text-blue-800 mb-3">
        Authentication status:{' '}
        {vincentApi.hasSIWEAuthentication() ? '✅ Authenticated' : '❌ Not authenticated'}
      </p>
      <button
        onClick={vincentApi.authenticateWithSIWE}
        disabled={vincentApi.isAuthenticating}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {vincentApi.isAuthenticating ? 'Authenticating...' : 'Sign Message for Registry Access'}
      </button>
      <p className="text-sm text-blue-600 mt-2">
        Note: Registry changes (create, edit, delete) require SIWE authentication. Authentication
        will be automatically triggered when needed.
      </p>
    </div>
  );
}
