import { getErrorMessage } from './app-forms';

interface BaseActionParams {
  appId: number;
  versionId: number;
  refetchVersionData: () => Promise<any>;
  setStatusMessage: (
    message: { message: string; type: 'success' | 'error' | 'warning' } | null,
  ) => void;
}

interface EnableVersionParams extends BaseActionParams {
  enableAppVersion: (params: { appId: number; version: number }) => Promise<any>;
}

interface DisableVersionParams extends BaseActionParams {
  disableAppVersion: (params: { appId: number; version: number }) => Promise<any>;
}

/**
 * Handles enabling an app version
 */
export const handleEnableVersion = async ({
  appId,
  versionId,
  enableAppVersion,
  refetchVersionData,
  setStatusMessage,
}: EnableVersionParams) => {
  try {
    setStatusMessage(null);
    const result = await enableAppVersion({
      appId,
      version: versionId,
    });

    if ('error' in result) {
      throw new Error(getErrorMessage(result.error, 'Failed to enable version'));
    }

    setStatusMessage({
      message: `Version ${versionId} has been enabled successfully!`,
      type: 'success',
    });

    // Refetch version data to show the updated status
    await refetchVersionData();

    // Clear success message after a delay
    setTimeout(() => setStatusMessage(null), 3000);
  } catch (error: unknown) {
    setStatusMessage({
      message: getErrorMessage(error, 'Failed to enable version'),
      type: 'error',
    });
  }
};

/**
 * Handles disabling an app version with confirmation
 */
export const handleDisableVersion = async ({
  appId,
  versionId,
  disableAppVersion,
  refetchVersionData,
  setStatusMessage,
}: DisableVersionParams) => {
  const confirmed = window.confirm(
    `Are you sure you want to disable version ${versionId}? This will prevent users from accessing this version of your app.`,
  );

  if (!confirmed) return;

  try {
    setStatusMessage(null);
    const result = await disableAppVersion({
      appId,
      version: versionId,
    });

    if ('error' in result) {
      throw new Error(getErrorMessage(result.error, 'Failed to disable version'));
    }

    setStatusMessage({
      message: `Version ${versionId} has been disabled successfully!`,
      type: 'success',
    });

    // Refetch version data to show the updated status
    await refetchVersionData();

    // Clear success message after a delay
    setTimeout(() => setStatusMessage(null), 3000);
  } catch (error: unknown) {
    setStatusMessage({
      message: getErrorMessage(error, 'Failed to disable version'),
      type: 'error',
    });
  }
};
