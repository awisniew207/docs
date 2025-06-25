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

function buildCreateAppVersionFormValidationSchema() {
  const changesField = z
    .string()
    .min(1, 'Changes description is required')
    .describe('Describes what changed between this version and the previous version.');

  return z.object({ changes: changesField }).strict();
}

function buildEditAppVersionFormValidationSchema() {
  const { changes } = docSchemas.appVersionDoc.shape;
  return z.object({ changes }).partial().strict();
}

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

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const AppCreate = buildCreateAppFormValidationSchema();
const AppEdit = buildEditAppFormValidationSchema();
const AppVersionCreate = buildCreateAppVersionFormValidationSchema();
const AppVersionEdit = buildEditAppVersionFormValidationSchema();

// =============================================================================
// APP FORMS
// =============================================================================

export function CreateAppForm() {
  const vincentApi = useVincentApiWithSIWE();
  const [createApp, { isLoading }] = vincentApi.useCreateAppMutation();
  const { address, isConnected } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

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
      const appDataForApi = { ...data, managerAddress: address };
      const response = await createApp({ appCreate: appDataForApi });
      setResult(response);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to create app');
    }
  };

  if (error) return <StatusMessage message={error} type="error" />;
  if (result)
    return <StatusMessage message="App created successfully! Refreshing page..." type="success" />;

  return (
    <FormRenderer
      schema={AppCreate}
      onSubmit={handleSubmit}
      title="Create App"
      description="Create a new blockchain application"
      defaultValues={{ redirectUris: [''] }}
      hiddenFields={['_id', 'createdAt', 'updatedAt', 'appId', 'activeVersion', 'managerAddress']}
      isLoading={isLoading}
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
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  if (!appData) return <Loading />;

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
      const response = await editApp({
        appId: parseInt(appId),
        appEdit: data,
      });
      setResult(response);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to update app');
    }
  };

  if (error) return <StatusMessage message={error} type="error" />;
  if (result)
    return <StatusMessage message="App updated successfully! Refreshing page..." type="success" />;

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

  if (!appData) return <Loading />;

  const handleSubmit = async (data: any) => {
    if (!appId) {
      setError('No app ID found in URL');
      return;
    }

    const expectedConfirmation = `I want to delete app ${appId}`;
    if (data.confirmation !== expectedConfirmation) {
      setError(`Please type exactly: "${expectedConfirmation}"`);
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete app ID ${appId}? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    setError(null);
    setResult(null);

    try {
      const response = await deleteApp({ appId: parseInt(appId) });
      setResult(response);
      navigate('/developer/dasboard/apps');
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to delete app');
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

// =============================================================================
// APP VERSION FORMS
// =============================================================================

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

  if (!appData) return <Loading />;

  const handleSubmit = async (data: any) => {
    if (!appId) {
      setError('No app ID found in URL');
      return;
    }

    setError(null);
    setResult(null);

    try {
      const result = await createAppVersion({
        appId: parseInt(appId),
        appVersionCreate: data,
      });

      if ('error' in result) {
        throw new Error(
          result.error?.data?.message || result.error?.message || 'Failed to create app version',
        );
      }

      setResult(result);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to create app version');
    }
  };

  if (error) return <StatusMessage message={error} type="error" />;
  if (result)
    return (
      <StatusMessage
        message="App version created successfully! Refreshing page..."
        type="success"
      />
    );

  return (
    <FormRenderer
      schema={AppVersionCreate}
      onSubmit={handleSubmit}
      title="Create App Version"
      description="Create a new version of an application"
      defaultValues={{ changes: '' }}
      isLoading={isLoading}
      hideHeader={hideHeader}
    />
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

  if (!appId || !versionId) return <Loading />;

  const handleSubmit = async (data: any) => {
    setError(null);
    setResult(null);

    try {
      const response = await editAppVersion({
        appId: parseInt(appId),
        version: parseInt(versionId),
        appVersionEdit: data,
      });
      setResult(response);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to edit app version');
    }
  };

  if (error) return <StatusMessage message={error} type="error" />;
  if (result)
    return (
      <StatusMessage
        message="App version updated successfully! Refreshing page..."
        type="success"
      />
    );

  // Specific version editing
  if (versionId) {
    const ChangesOnlySchema = z.object({
      changes: z
        .string()
        .describe('Describes what changed between this version and the previous version.'),
    });

    return (
      <FormRenderer
        schema={ChangesOnlySchema}
        onSubmit={handleSubmit}
        title={`Edit App Version ${versionId}`}
        description="Update the changelog for this specific app version"
        initialData={{ changes: versionData?.changes || '' }}
        isLoading={isLoading}
        hideHeader={hideHeader}
      />
    );
  }

  // General version editing (backward compatibility)
  return (
    <FormRenderer
      schema={AppVersionEdit}
      onSubmit={handleSubmit}
      title="Edit App Version"
      description="Update changes for a specific app version"
      initialData={{ changes: versionData?.changes || '' }}
      isLoading={isLoading}
      hideHeader={hideHeader}
    />
  );
}
