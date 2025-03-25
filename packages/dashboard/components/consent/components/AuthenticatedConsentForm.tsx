import { useState, useEffect, useCallback, useRef } from 'react';

import '../styles/parameter-fields.css';
import VersionParametersForm from '../utils/VersionParametersForm';
import { useErrorPopup } from '@/components/ui/error-popup';

import StatusMessage from './authForm/StatusMessage';
import StatusAnimation from './authForm/StatusAnimation';
import ParameterUpdateModal from './authForm/ParameterUpdateModal';
import AppInfo from './authForm/AppInfo';
import ConsentActions from './authForm/ConsentActions';
import RedirectMessage from './authForm/RedirectMessage';
import VersionUpgradePrompt from './authForm/VersionUpgradePrompt';
import UntrustedUriError from './authForm/UntrustedUriError';
import { useUrlAppId } from '../hooks/useUrlAppId';
import { useUrlRedirectUri } from '../hooks/useUrlRedirectUri';
import { useStatusMessage } from '../hooks/useStatusMessage';
import { useConsentApproval } from '../hooks/useConsentApproval';
import { useConsentDisapproval } from '../hooks/useConsentDisapproval';
import { useJwtRedirect } from '../hooks/useJwtRedirect';
import { useParameterManagement } from '../hooks/useParameterManagement';
import { useAppPermissionCheck } from '../hooks/useAppPermissionCheck';

// Import types
import {
  AuthenticatedConsentFormProps,
} from '../types';

/**
 * AuthenticatedConsentForm is the main component for handling app permissions.
 * 
 * This component manages the entire flow for agent authorization:
 * 1. Checking if an app is already permitted
 * 2. Verifying redirect URIs for security
 * 3. Handling parameter updates and management
 * 4. Managing version upgrades
 * 5. Providing UI for approval/disapproval actions
 * 6. JWT generation and redirection
 * 
 * The component uses several custom hooks to modularize functionality:
 * - useStatusMessage: For status messages and notifications
 * - useJwtRedirect: For JWT token generation and redirection
 * - useParameterManagement: For handling app parameters
 * - useAppPermissionCheck: For checking permissions and app info
 * - useConsentApproval: For handling the consent approval process
 * - useConsentDisapproval: For handling the disapproval flow
 */
export default function AuthenticatedConsentForm({
  sessionSigs,
  agentPKP,
  isSessionValidation,
  userPKP,
}: AuthenticatedConsentFormProps) {
  const { appId, error: urlError } = useUrlAppId();
  const { redirectUri: encodedRedirectUri, error: redirectError } = useUrlRedirectUri();
  const redirectUri = encodedRedirectUri ? decodeURIComponent(encodedRedirectUri) : null;

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Use the extracted status message hook
  const { statusMessage, statusType, showStatus, showErrorWithStatus } = useStatusMessage();

  // Add the error popup hook
  useErrorPopup();

  // Use the JWT redirect hook
  const { generateJWT, redirectWithJWT } = useJwtRedirect({
    agentPKP,
    sessionSigs,
    redirectUri,
    onStatusChange: showStatus
  });

  const fetchExistingParametersRef = useRef<(() => Promise<void>) | undefined>(undefined);

  const {
    appInfo,
    isAppAlreadyPermitted,
    isUriUntrusted,
    showVersionUpgradePrompt,
    showUpdateModal,
    permittedVersion,
    showingAuthorizedMessage,
    showSuccess,
    showDisapproval,
    isLoading,
    checkingPermissions,
    continueWithExistingPermission,
    handleUpgrade,
    updateState
  } = useAppPermissionCheck({
    appId,
    agentPKP,
    redirectUri,
    generateJWT,
    redirectWithJWT,
    fetchExistingParameters: useCallback(async () => {
      if (fetchExistingParametersRef.current) {
        return fetchExistingParametersRef.current();
      }
    }, []),
    onStatusChange: showStatus
  });

  // Use the parameter management hook
  const {
    parameters,
    setParameters,
    existingParameters,
    isLoadingParameters,
    versionInfo,
    fetchVersionInfo,
    fetchExistingParameters,
    handleParametersChange
  } = useParameterManagement({
    appId,
    agentPKP,
    appInfo,
    onStatusChange: showStatus
  });

  // Set the fetchExistingParameters ref after it's created
  useEffect(() => {
    if (fetchExistingParameters && fetchExistingParametersRef.current !== fetchExistingParameters) {
      fetchExistingParametersRef.current = fetchExistingParameters;
    }
  }, [fetchExistingParameters]);

  /**
   * Ensures parameters are fetched once when appInfo becomes available.
   * This useEffect:
   * 1. Runs when appInfo becomes available
   * 2. Fetches version info if needed
   * 3. Uses a ref to prevent duplicate calls
   */
  const appInfoSetRef = useRef(false);
  useEffect(() => {
    if (appInfo && !appInfoSetRef.current) {
      appInfoSetRef.current = true;

      // We'll let the permission check flow handle parameter fetching
      if (!versionInfo) {
        fetchVersionInfo();
      }
    }
  }, [appInfo, fetchVersionInfo, versionInfo]);

  // Use the consent approval hook
  const { approveConsent } = useConsentApproval({
    appId,
    appInfo,
    versionInfo,
    parameters,
    agentPKP,
    userPKP,
    sessionSigs,
    onStatusChange: showStatus,
    onError: showErrorWithStatus
  });

  // Add the consent disapproval hook
  const { disapproveConsent, executeRedirect } = useConsentDisapproval({
    redirectUri,
    onStatusChange: showStatus,
    onError: showErrorWithStatus
  });

  // Use error popup for URL errors
  useEffect(() => {
    if (urlError) {
      showErrorWithStatus(urlError, 'URL Error');
    }
    if (redirectError) {
      showErrorWithStatus(redirectError, 'Redirect Error');
    }
  }, [urlError, redirectError, showErrorWithStatus]);

  // ===== Event Handler Functions =====

  /**
   * Handles the approval action when the user grants permission to the app.
   * This function:
   * 1. Validates required data (appInfo, agentPKP, appId)
   * 2. Calls the approval process from the useConsentApproval hook
   * 3. Generates a JWT for authentication
   * 4. Redirects the user to the app with the JWT
   * 5. Handles errors and displays appropriate messages
   */
  const handleApprove = useCallback(async () => {
    if (!appInfo) {
      console.error('Missing version data in handleApprove');
      const errorMessage = 'Missing version data. Please refresh the page and try again.';
      setError(errorMessage);
      showErrorWithStatus(errorMessage, 'Missing Data');
      setSubmitting(false);
      return;
    }

    setSubmitting(true);
    showStatus('Processing approval...', 'info');
    try {
      const handleFormSubmission = async (): Promise<{ success: boolean }> => {
        try {
          if (!appInfo) {
            console.error(
              'Missing version data in handleFormSubmission'
            );
            const errorMessage = 'Missing version data. Please try again.';
            setError(errorMessage);
            showErrorWithStatus(errorMessage, 'Missing Data');
            return { success: false };
          }

          if (!agentPKP || !appId) {
            console.error(
              'Missing required data for consent approval in handleFormSubmission'
            );
            const errorMessage = 'Missing required data. Please try again.';
            setError(errorMessage);
            showErrorWithStatus(errorMessage, 'Missing Data');
            return { success: false };
          }

          await approveConsent();

          showStatus('Generating authentication token...', 'info');
          const jwt = await generateJWT(appInfo);
          updateState({ showSuccess: true });

          showStatus('Approval successful! Redirecting...', 'success');
          setTimeout(() => {
            redirectWithJWT(jwt);
          }, 2000);

          return {
            success: true,
          };
        } catch (error) {
          // Error details are already handled by approveConsent()
          // Just log the error here for tracing purposes
          console.error('Error processing transaction:', {
            error,
            errorCode: (error as any).code,
            errorMessage: (error as any).message,
            errorReason: (error as any).reason,
            errorData: (error as any).data,
          });
          throw error;
        }
      };

      await handleFormSubmission();
    } catch (err) {
      console.error('Error submitting form:', err);
    } finally {
      setSubmitting(false);
    }
  }, [approveConsent, generateJWT, redirectWithJWT, agentPKP, appId, appInfo, showErrorWithStatus, showStatus, updateState]);

  /**
   * Handles the disapproval action when the user denies permission to the app.
   * This function:
   * 1. Updates UI state to show disapproval
   * 2. Calls the disapproval handler from the useConsentDisapproval hook
   * 3. Redirects to the appropriate URI with an error message
   * 4. Handles errors and displays appropriate messages
   */
  const handleDisapprove = useCallback(async () => {
    setSubmitting(true);
    try {
      updateState({ showDisapproval: true });

      const result = await disapproveConsent();

      setTimeout(() => {
        if (result.redirectUri) {
          executeRedirect(result.redirectUri);
        }
      }, 1000);
    } catch (err) {
      console.error('Error in handleDisapprove:', err);
      const errorMessage = 'Failed to disapprove. Please try again.';
      setError(errorMessage);
      showErrorWithStatus(errorMessage, 'Disapproval Failed');
      updateState({ showDisapproval: false });
    } finally {
      setSubmitting(false);
    }
  }, [disapproveConsent, executeRedirect, setError, showErrorWithStatus, updateState]);

  /**
   * Handles continuing with existing parameters without updating them.
   * This function:
   * 1. Hides the update modal
   * 2. Continues the existing permission flow with current parameters
   */
  const handleContinueWithExisting = useCallback(() => {
    updateState({ showUpdateModal: false });
    continueWithExistingPermission();
  }, [continueWithExistingPermission, updateState]);

  /**
   * Handles updating parameters for an app with existing permissions.
   * This function:
   * 1. Updates the UI state to close modals
   * 2. Sets the parameters form with existing parameter values
   */
  const handleUpdateParameters = useCallback(() => {
    updateState({
      showUpdateModal: false,
      showingAuthorizedMessage: false,
      showSuccess: false,
      isAppAlreadyPermitted: false,
      showVersionUpgradePrompt: false,
      isLoading: false,
      checkingPermissions: false
    });

    // Populate the form with existing parameter values
    if (existingParameters.length > 0) {
      console.log('Setting form fields with existing parameter values:', existingParameters);
      setParameters(existingParameters);
    }
  }, [existingParameters, setParameters, updateState]);


  useEffect(() => {
    if (error) {
      showErrorWithStatus(error, 'Error');
    }
  }, [error, showErrorWithStatus]);

  /**
   * Automatically resolves loading state after a timeout period.
   * This prevents the UI from getting stuck in a loading state if:
   * 1. Network issues occur
   * 2. Contract calls fail silently
   * 3. Permission checking takes too long
   */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if ((checkingPermissions || isLoading) && appInfo) {
      timer = setTimeout(() => {
        updateState({
          checkingPermissions: false,
          isLoading: false
        });
      }, 3000); // 3 seconds timeout with appInfo
    } else if (checkingPermissions || isLoading) {
      timer = setTimeout(() => {
        updateState({
          checkingPermissions: false,
          isLoading: false
        });
      }, 8000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [checkingPermissions, isLoading, appInfo, updateState]);

  // ===== Render Logic =====

  // Show the parameter update modal - this should take precedence over all other views
  if (showUpdateModal && appInfo) {
    return (
      <div className='container'>
        <div className='consent-form-container'>
          <StatusMessage message={statusMessage} type={statusType} />
          <ParameterUpdateModal
            isOpen={showUpdateModal && !isLoadingParameters}
            onContinue={handleContinueWithExisting}
            onUpdate={handleUpdateParameters}
            appName={appInfo.name}
          />
          {isLoadingParameters && (
            <p className="text-center mt-4">Loading your existing parameters...</p>
          )}
        </div>
      </div>
    );
  }

  // If URL is untrusted, show an error message
  if (isUriUntrusted) {
    return (
      <UntrustedUriError
        redirectUri={redirectUri}
        appInfo={appInfo}
        statusMessage={statusMessage}
        statusType={statusType}
      />
    );
  }

  // Change the rendering order to check for version upgrade prompt before checking for already permitted
  // If the app is already permitted, show a brief loading spinner or success animation
  if (showVersionUpgradePrompt && appInfo && permittedVersion !== null) {
    return (
      <VersionUpgradePrompt
        appInfo={appInfo}
        permittedVersion={permittedVersion}
        agentPKP={agentPKP}
        onUpgrade={handleUpgrade}
        onContinue={continueWithExistingPermission}
        statusMessage={statusMessage}
        statusType={statusType}
      />
    );
  }

  // Only check this after we've checked for the version upgrade prompt
  if ((isAppAlreadyPermitted && !showUpdateModal) || (showSuccess && !showUpdateModal) || (showingAuthorizedMessage && !showUpdateModal)) {
    return (
      <RedirectMessage
        showSuccess={showSuccess}
        showDisapproval={showDisapproval}
        statusMessage={statusMessage}
        statusType={statusType}
      />
    );
  }

  // Show loading indicator while checking permissions or loading app info
  if (checkingPermissions || isLoading) {
    return (
      <div className='container'>
        <div className='consent-form-container'>
          <StatusMessage message={statusMessage || 'Loading app information...'} type="info" />
          <div className="text-center mt-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            {appInfo && (
              <div className="mt-3">
                <h3>{appInfo.name}</h3>
                <p>{appInfo.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show error message if there's no appId or if there's an error
  if (!appId) {
    showErrorWithStatus('Missing appId parameter', 'Invalid Request');
    return (
      <div className='consent-form-container'>
        <StatusMessage message="Missing app ID" type="error" />
        <p>Invalid request. Missing app ID.</p>
      </div>
    );
  }

  if (urlError) {
    // Use the error popup instead of inline display
    return (
      <div className='consent-form-container'>
        <p>Invalid request. Please check your URL parameters.</p>
      </div>
    );
  }

  if (redirectError) {
    // Use the error popup instead of inline display
    return (
      <div className='consent-form-container'>
        <p>Invalid redirect URI. Please check your URL parameters.</p>
      </div>
    );
  }

  return (
    <div
      className={
        isSessionValidation ? 'session-validator-consent' : 'container'
      }
    >
      <div className='consent-form-container'>
        <StatusMessage message={statusMessage} type={statusType} />

        {showSuccess && <StatusAnimation type="success" />}
        {showDisapproval && <StatusAnimation type="disapproval" />}

        <h1>Agent Consent Notice</h1>

        {appInfo && (
          <>
            <AppInfo
              appInfo={appInfo}
              agentPKP={agentPKP}
              versionInfo={versionInfo}
              showIPFSDetails={true}
            />

            {versionInfo && (
              <VersionParametersForm
                versionData={versionInfo}
                onChange={handleParametersChange}
                existingParameters={existingParameters}
              />
            )}

            <ConsentActions
              onApprove={handleApprove}
              onDisapprove={handleDisapprove}
              submitting={submitting}
            />
          </>
        )}
      </div>
    </div>
  );
}
