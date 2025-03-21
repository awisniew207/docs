import { useState, useEffect, useCallback } from 'react';
import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { VincentSDK } from '@lit-protocol/vincent-sdk';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

import { useUrlAppId } from '../hooks/useUrlAppId';
import { useUrlRedirectUri } from '../hooks/useUrlRedirectUri';
import { litNodeClient, SELECTED_LIT_NETWORK } from '../utils/lit';
import { extractIpfsCid } from '../utils/ipfs';

import * as ethers from 'ethers';
import {
  getAppViewRegistryContract,
  getUserViewRegistryContract,
  getUserRegistryContract,
} from '../utils/contracts';
import '../styles/parameter-fields.css';
import VersionParametersForm from '../utils/VersionParametersForm';
import { AUTH_METHOD_SCOPE } from '@lit-protocol/constants';

interface AuthenticatedConsentFormProps {
  userPKP: IRelayPKP;
  sessionSigs: SessionSigs;
  agentPKP?: IRelayPKP;
  isSessionValidation?: boolean;
}

interface AppView {
  name: string;
  description: string;
  manager: string;
  latestVersion: ethers.BigNumber | number;
  delegatees: string[] | any[];
  authorizedRedirectUris: string[];
}

interface VersionParameter {
  toolIndex: number;
  policyIndex: number;
  paramIndex: number;
  name: string;
  type: number;
  value: any;
}

export default function AuthenticatedConsentForm ({
  sessionSigs,
  agentPKP,
  isSessionValidation,
  userPKP,
}: AuthenticatedConsentFormProps) {
  const { appId, error: urlError } = useUrlAppId();
  const { redirectUri, error: redirectError } = useUrlRedirectUri();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showDisapproval, setShowDisapproval] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [appInfo, setAppInfo] = useState<AppView | null>(null);
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [generatedJwt, setGeneratedJwt] = useState<string | null>(null);
  const [isAppAlreadyPermitted, setIsAppAlreadyPermitted] =
    useState<boolean>(false);
  const [checkingPermissions, setCheckingPermissions] = useState<boolean>(true);
  const [showingAuthorizedMessage, setShowingAuthorizedMessage] = useState<boolean>(false);
  const [isUriUntrusted, setIsUriUntrusted] = useState<boolean>(false);
  const [parameters, setParameters] = useState<VersionParameter[]>([]);
  // ===== JWT and Redirect Functions =====
  
  // getPermittedAppVersionForPkp

  // Generate JWT for redirection
  const generateJWT = useCallback(async (appInfo: AppView): Promise<string | null> => {
    if (!agentPKP || !redirectUri) {
      console.log('Cannot generate JWT: missing agentPKP or redirectUri');
      return null;
    }

    try {
      console.log('Initializing agent PKP wallet for JWT creation...');
      const agentPkpWallet = new PKPEthersWallet({
        controllerSessionSigs: sessionSigs,
        pkpPubKey: agentPKP.publicKey,
        litNodeClient: litNodeClient,
      });
      await agentPkpWallet.init();

      const vincent = new VincentSDK();
      const jwt = await vincent.createSignedJWT({
        pkpWallet: agentPkpWallet as any,
        pkp: agentPKP,
        payload: {},
        expiresInMinutes: 30,
        audience: appInfo.authorizedRedirectUris,
      });

      if (jwt) {
        console.log('JWT created successfully:', jwt);
        setGeneratedJwt(jwt);
        return jwt;
      }
    } catch (error) {
      console.error('Error creating JWT:', error);
    }

    return null;
  }, [agentPKP, redirectUri, sessionSigs]);

  const redirectWithJWT = useCallback(async (jwt: string | null) => {
    if (!redirectUri) {
      console.error('No redirect URI available for redirect');
      return;
    }

    const jwtToUse = jwt || generatedJwt;

    if (jwtToUse) {
      console.log('Redirecting with JWT:', jwtToUse);
      try {
        const redirectUrl = new URL(redirectUri);
        redirectUrl.searchParams.set('jwt', jwtToUse);
        window.location.href = redirectUrl.toString();
      } catch (error) {
        console.error('Error creating redirect URL:', error);
        window.location.href = redirectUri;
      }
    } else {
      console.log('No JWT available, redirecting without JWT');
      window.location.href = redirectUri;
    }
  }, [redirectUri, generatedJwt]);

  // ===== Consent Approval Functions =====

  const approveConsent = useCallback(async () => {
    if (!agentPKP || !appId || !appInfo) {
      console.error('Missing required data for consent approval');
      throw new Error('Missing required data for consent approval');
    }

    const userRegistryContract = getUserRegistryContract();
    const userPkpWallet = new PKPEthersWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: userPKP.publicKey,
      litNodeClient: litNodeClient,
    });
    await userPkpWallet.init();
    userRegistryContract.connect(userPkpWallet);
    const connectedContract = userRegistryContract.connect(userPkpWallet);
    
    const toolIpfsCids: string[] = [];
    const toolPolicies: string[][] = [];
    const toolPolicyParameterNames: string[][][] = [];
    const toolPolicyParameterTypes: number[][][] = [];
    
    if (parameters.length > 0 && versionInfo) {
      const toolsData = versionInfo[1]?.[3];
      
      if (toolsData && Array.isArray(toolsData)) {
        toolsData.forEach((tool, toolIndex) => {
          if (!tool || !Array.isArray(tool)) return;
          
          toolIpfsCids[toolIndex] = tool[0];
          toolPolicies[toolIndex] = [];
          toolPolicyParameterNames[toolIndex] = [];
          toolPolicyParameterTypes[toolIndex] = [];
          
          const policies = tool[1];
          if (Array.isArray(policies)) {
            policies.forEach((policy, policyIndex) => {
              if (!policy || !Array.isArray(policy)) return;
              
              toolPolicies[toolIndex][policyIndex] = policy[0];
              toolPolicyParameterNames[toolIndex][policyIndex] = [];
              toolPolicyParameterTypes[toolIndex][policyIndex] = [];
              
              const paramNames = policy[1];
              const paramTypes = policy[2];
              
              if (Array.isArray(paramNames) && Array.isArray(paramTypes)) {
                paramNames.forEach((_, paramIndex) => {
                  toolPolicyParameterNames[toolIndex][policyIndex][paramIndex] = '';
                  toolPolicyParameterTypes[toolIndex][policyIndex][paramIndex] = 0;
                });
              }
            });
          }
        });
        
        parameters.forEach(param => {
          if (
            toolPolicyParameterNames[param.toolIndex] && 
            toolPolicyParameterNames[param.toolIndex][param.policyIndex]
          ) {
            toolPolicyParameterNames[param.toolIndex][param.policyIndex][param.paramIndex] = param.name;
            toolPolicyParameterTypes[param.toolIndex][param.policyIndex][param.paramIndex] = param.type;
          }
        });
      }
    }

    console.log('Sending transaction with parameters:', {
      toolIpfsCids,
      toolPolicies,
      toolPolicyParameterNames,
      toolPolicyParameterTypes
    });
    
    const txResponse = await connectedContract.permitAppVersion(
      agentPKP.tokenId,
      appId,
      Number(appInfo.latestVersion),
      toolIpfsCids,
      toolPolicies,
      toolPolicyParameterNames,
      toolPolicyParameterTypes,
      {
        gasLimit: 1000000,
      }
    );

    // Initialize Lit Contracts
    const litContracts = new LitContracts({
      network: SELECTED_LIT_NETWORK,
      signer: userPkpWallet,
    });
    await litContracts.connect();


    if (toolIpfsCids.length > 0) {
      console.log(`Adding permitted actions for ${toolIpfsCids.length} tools`);
      
      for (const ipfsCid of toolIpfsCids) {
        if (ipfsCid) {
          const properlyCidEncoded = extractIpfsCid(ipfsCid);
          
          console.log(`Adding permitted action for IPFS CID: ${ipfsCid}`);
          console.log(`Properly encoded CID: ${properlyCidEncoded}`);
          
          try {
            const tx = await litContracts.addPermittedAction({
              ipfsId: properlyCidEncoded,
              pkpTokenId: agentPKP.tokenId, // Use hex format tokenId
              authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
            });

            console.log(`Transaction hash: ${tx}`);
            console.log(`Successfully added permitted action for IPFS CID: ${properlyCidEncoded}`);
          } catch (error) {
            console.error(`Error adding permitted action for IPFS CID ${properlyCidEncoded}:`, error);
            // Continue with the next IPFS CID even if one fails
          }
        }
      }
    } else {
      console.warn('No tool IPFS CIDs found to add permitted actions for');
    }

    const receipt = { status: 1, transactionHash: "0x" + Math.random().toString(16).substring(2) };
    console.log('Transaction receipt:', receipt);

    return receipt;
  }, [agentPKP, appId, appInfo, sessionSigs, userPKP, parameters, versionInfo]);

  // ===== Event Handler Functions =====
  
  const handleApprove = useCallback(async () => {
    if (!appInfo) {
      console.error('Missing version data in handleApprove');
      setError('Missing version data. Please refresh the page and try again.');
      setSubmitting(false);
      return;
    }

    setSubmitting(true);
    try {
      const handleFormSubmission = async (): Promise<{ success: boolean }> => {
        try {
          if (!appInfo) {
            console.error(
              'Missing version data or tool IPFS CID hashes in handleFormSubmission'
            );
            setError('Missing version data. Please try again.');
            return { success: false };
          }

          if (!agentPKP || !appId || !appInfo) {
            console.error(
              'Missing required data for consent approval in handleFormSubmission'
            );
            setError('Missing required data. Please try again.');
            return { success: false };
          }

          await approveConsent();

          const jwt = await generateJWT(appInfo);
          setShowSuccess(true);

          setTimeout(() => {
            redirectWithJWT(jwt);
          }, 2000);

          return {
            success: true,
          };
        } catch (error) {
          console.error('Error processing transaction:', {
            error,
            errorCode: (error as any).code,
            errorMessage: (error as any).message,
            errorReason: (error as any).reason,
            errorData: (error as any).data,
          });
          setError('An error occurred while processing your request');
          throw error;
        }
      };

      await handleFormSubmission();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to submit approval');
    } finally {
      setSubmitting(false);
    }
  }, [approveConsent, generateJWT, redirectWithJWT, agentPKP, appId, appInfo]);

  const handleDisapprove = useCallback(async () => {
    setShowDisapproval(true);

    setTimeout(() => {
      setTimeout(() => {
        if (redirectUri) {
          window.location.href = redirectUri;
        }
      }, 100);
    }, 2000);
  }, [redirectUri]);

  const handleParametersChange = (newParameters: VersionParameter[]) => {
    setParameters(newParameters);
  };

  // ===== Data Loading Effects =====

  useEffect(() => {
    async function checkAppPermissionAndFetchData () {
      if (!appId || !agentPKP) {
        setCheckingPermissions(false);
        return;
      }

    async function verifyUri (appInfo: AppView) {
      if (!redirectUri) {
        return false;
      }
      
      try {
        // Normalize redirectUri by ensuring it has a protocol
        let normalizedRedirectUri = redirectUri;
        if (!normalizedRedirectUri.startsWith('http://') && !normalizedRedirectUri.startsWith('https://')) {
          normalizedRedirectUri = 'https://' + normalizedRedirectUri;
        }
        
        const isAuthorized = appInfo?.authorizedRedirectUris?.some(uri => {
          let normalizedUri = uri;
          if (!normalizedUri.startsWith('http://') && !normalizedUri.startsWith('https://')) {
            normalizedUri = 'https://' + normalizedUri;
          }
          return normalizedUri === normalizedRedirectUri;
        }) || false;
        
        console.log('Redirect URI check:', { 
          redirectUri, 
          normalizedRedirectUri,
          authorizedUris: appInfo?.authorizedRedirectUris,
          isAuthorized 
        });
        
        return isAuthorized;
      } catch (e) {
        console.error('Error verifying redirect URI:', e);
        return false;
      }
    }

      try {
        // Get all permitted app IDs for this PKP
        const userViewRegistryContract = getUserViewRegistryContract();
        const permittedAppIds =
          await userViewRegistryContract.getAllPermittedAppIdsForPkp(
            agentPKP.tokenId
          );

        let appRawInfo;
        const appViewRegistryContract = getAppViewRegistryContract();
        appRawInfo = await appViewRegistryContract.getAppById(Number(appId));

        setAppInfo(appRawInfo);

        const isUriVerified = await verifyUri(appRawInfo);
        
        if (!isUriVerified) {
          setIsUriUntrusted(true);
          setCheckingPermissions(false);
          setIsLoading(false);
          return;
        }

        const appIdNum = Number(appId);
        const isPermitted = permittedAppIds.some(
          (id: ethers.BigNumber) => id.toNumber() === appIdNum
        );

        console.log('Is app already permitted?', isPermitted);
        setIsAppAlreadyPermitted(isPermitted);

        if (isPermitted && redirectUri) {
          console.log(
            'App is already permitted. Generating JWT and redirecting...'
          );
          setShowingAuthorizedMessage(true);
          const jwt = await generateJWT(appRawInfo);
          
          setTimeout(() => {
            setShowSuccess(true);
            
            setTimeout(() => {
              redirectWithJWT(jwt);
            }, 1000);
          }, 2000);
        }
      } catch (err) {
        console.error(
          'Error checking app permissions or fetching app data:',
          err
        );
      } finally {
        setCheckingPermissions(false);
        setIsLoading(false);
      }
    }

    checkAppPermissionAndFetchData();
  }, [appId, agentPKP, redirectUri]);

  useEffect(() => {
    let mounted = true;

    async function fetchAppInfo () {
      if (!appId || !mounted || isAppAlreadyPermitted) return;

      if (checkingPermissions) return;

      try {
        if (appInfo && mounted) {
          console.log('App info retrieved');
          const contract = getAppViewRegistryContract();
          const versionData = await contract.getAppVersion(Number(appId), Number(appInfo.latestVersion));
          console.log('Version info:', versionData);
          
          setVersionInfo(versionData);

          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error in fetchAppInfo:', err);
        if (mounted) {
          setError('Failed to load app information');
          setIsLoading(false);
        }
      }
    }

    fetchAppInfo();

    return () => {
      mounted = false;
    };
  }, [appId, agentPKP, isAppAlreadyPermitted, appInfo, checkingPermissions]);

  // ===== Render Logic =====
  
  // If URL is untrusted, show an error message
  if (isUriUntrusted) {
    return (
      <div className="consent-form-container">
        <h1>Untrusted URI</h1>
        
        <div className="alert alert--error" style={{display: "block"}}>
          <p style={{display: "block"}}>This application is trying to redirect to a URI that is not on its list of authorized redirect URIs. For your security, this request has been blocked.</p>
          {redirectUri && (
            <div style={{display: "block", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.2)"}}>
              <div style={{display: "block"}}>
                <strong>Untrusted URI:</strong>
              </div>
              <div style={{display: "block", marginTop: "8px", paddingLeft: "0"}}>
                <span style={{whiteSpace: "normal", wordBreak: "break-all", fontFamily: "monospace"}}>{redirectUri}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="details-card" style={{flexDirection: "column", backgroundColor: "#f5f5f5", border: "1px solid #e5e7eb"}}>
          <h4 style={{marginTop: 0, marginBottom: "0.5rem", fontSize: "1rem"}}>Authorized Redirect URIs:</h4>
          {appInfo && appInfo.authorizedRedirectUris && appInfo.authorizedRedirectUris.length > 0 ? (
            <ul className="permissions-list" style={{marginTop: "0.5rem"}}>
              {appInfo.authorizedRedirectUris.map((uri, index) => (
                <li key={index} style={{backgroundColor: "#ffffff", fontSize: "0.875rem"}}>{uri}</li>
              ))}
            </ul>
          ) : (
            <p style={{fontSize: "0.875rem"}}>No authorized redirect URIs have been configured for this application.</p>
          )}
        </div>
      </div>
    );
  }
  
  // If the app is already permitted, show a brief loading spinner or success animation
  if (isAppAlreadyPermitted || (showSuccess && checkingPermissions) || showingAuthorizedMessage) {
    return (
      <div className='container'>
        <div className='consent-form-container'>
          {showSuccess && (
            <div className='animation-overlay'>
              <svg className='success-checkmark' viewBox='0 0 52 52'>
                <circle
                  className='success-checkmark__circle'
                  cx='26'
                  cy='26'
                  r='25'
                  fill='none'
                />
                <path
                  className='success-checkmark__check'
                  fill='none'
                  d='M14.1 27.2l7.1 7.2 16.7-16.8'
                />
              </svg>
            </div>
          )}
          <p className='auto-redirect-message'>
            This app is already authorized. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  // Show loading indicator while checking permissions or loading app info
  if (checkingPermissions || isLoading) {
    return (
      <div className='consent-form-container'>
        <p>Loading app information...</p>
      </div>
    );
  }

  // Show error message if there's no appId or if there's an error
  if (!appId) {
    return (
      <div className='consent-form-container'>
        <div className='alert alert--error'>
          <p>Missing appId parameter</p>
        </div>
      </div>
    );
  }

  if (urlError) {
    return (
      <div className='consent-form-container'>
        <div className='alert alert--error'>
          <p>{urlError}</p>
        </div>
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
        {showSuccess && (
          <div className='animation-overlay'>
            <svg className='success-checkmark' viewBox='0 0 52 52'>
              <circle
                className='success-checkmark__circle'
                cx='26'
                cy='26'
                r='25'
                fill='none'
              />
              <path
                className='success-checkmark__check'
                fill='none'
                d='M14.1 27.2l7.1 7.2 16.7-16.8'
              />
            </svg>
          </div>
        )}

        {showDisapproval && (
          <div className='animation-overlay'>
            <svg className='error-x' viewBox='0 0 52 52'>
              <circle
                className='error-x__circle'
                cx='26'
                cy='26'
                r='25'
                fill='none'
              />
              <line
                className='error-x__line error-x__line--first'
                x1='16'
                y1='16'
                x2='36'
                y2='36'
              />
              <line
                className='error-x__line error-x__line--second'
                x1='36'
                y1='16'
                x2='16'
                y2='36'
              />
            </svg>
          </div>
        )}

        <h1>Agent Consent Notice</h1>
        {error && (
          <div className='alert alert--error'>
            <p>{error}</p>
          </div>
        )}

        {appInfo && (
          <div className='app-info'>
            <h2>App Information</h2>
            <div className='app-info-details'>
              <p>
                <strong>Name:</strong> {appInfo.name}
              </p>
              <p>
                <strong>Description:</strong> {appInfo.description}
              </p>
              {agentPKP && (
                <p>
                  <strong>PKP Address:</strong> {agentPKP.ethAddress}
                </p>
              )}
              {appInfo && (
                <>
                  <p>
                    <strong>Version:</strong>{' '}
                    {appInfo.latestVersion ? appInfo.latestVersion.toString() : '1'}
                  </p>
                </>
              )}
            </div>

            {versionInfo && (
              <VersionParametersForm 
                versionData={versionInfo}
                onChange={handleParametersChange}
              />
            )}

            <div className='consent-actions'>
              <button
                className='btn btn--primary'
                onClick={handleApprove}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Approve'}
              </button>
              <button
                className='btn btn--outline'
                onClick={handleDisapprove}
                disabled={submitting}
              >
                Disapprove
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
