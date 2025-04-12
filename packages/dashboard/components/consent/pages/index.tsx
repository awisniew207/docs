"use client";

import { useEffect, useState, useCallback } from 'react';
import { AUTH_METHOD_TYPE } from '@lit-protocol/constants';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import Image from 'next/image';

import useAuthenticate from '../hooks/useAuthenticate';
import useAccounts from '../hooks/useAccounts';
import { registerWebAuthn, getSessionSigs, cleanupSession } from '../utils/lit';
import AuthenticatedConsentForm from '../components/AuthenticatedConsentForm';
import Loading from '../components/Loading';
import LoginMethods from '../components/LoginMethods';
import { getAgentPKP } from '../utils/getAgentPKP';
import { useErrorPopup } from '@/providers/error-popup';
import { useSetAuthInfo } from '../hooks/useAuthInfo';

// Wrapper component for centering content
const CenteredContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 pt-20">
    {children}
  </div>
);

export default function IndexView() {
  const [sessionSigs, setSessionSigs] = useState<SessionSigs>();
  const [agentPKP, setAgentPKP] = useState<IRelayPKP>();
  const [sessionLoading, setSessionLoading] = useState<boolean>(false);
  const [sessionError, setSessionError] = useState<Error>();
  const { showError } = useErrorPopup();
  const { updateAuthInfo } = useSetAuthInfo();

  const {
    authMethod,
    authWithEthWallet,
    authWithWebAuthn,
    authWithStytch,
    loading: authLoading,
    error: authError,
  } = useAuthenticate();
  const {
    fetchAccounts,
    setuserPKP,
    userPKP,
    accounts,
    loading: accountsLoading,
    error: accountsError,
  } = useAccounts();

  const error = authError || accountsError || sessionError;

  // Show errors in the popup when they occur
  useEffect(() => {
    if (error) {
      showError(error, 'Authentication Error');
    }
  }, [error, showError]);

  // Store referrer URL when component mounts
  useEffect(() => {
    // Get the document referrer (the URL the user came from)
    const referrer = document.referrer;
    if (referrer && referrer !== '') {
      sessionStorage.setItem('referrerUrl', referrer);
    }
  }, []);

  // Function to generate session signatures on-demand
  const generateSessionSigs = useCallback(async () => {
    if (!authMethod || !userPKP) return;

    setSessionLoading(true);
    setSessionError(undefined);
    try {
      // Generate session signatures for the user PKP
      const sigs = await getSessionSigs({
        pkpPublicKey: userPKP.publicKey,
        authMethod
      });
      setSessionSigs(sigs);

      // After getting user PKP session sigs, try to get the agent PKP
      try {
        const agentPkpInfo = await getAgentPKP(userPKP.ethAddress);
        setAgentPKP(agentPkpInfo);
      } catch (agentError) {
        console.error('Error handling Agent PKP:', agentError);
        showError(agentError as Error, 'Agent PKP Error');
      }
    } catch (err) {
      setSessionError(err as Error);
    } finally {
      setSessionLoading(false);
    }
  }, [authMethod, userPKP, setSessionSigs, setAgentPKP, setSessionError, setSessionLoading, showError]);

  async function handleRegisterWithWebAuthn() {
    const newPKP = await registerWebAuthn();
    if (newPKP) {
      setuserPKP(newPKP);
    }
  }

  useEffect(() => {
    // If user is authenticated, fetch accounts
    if (authMethod) {
      fetchAccounts(authMethod);
    }
  }, [authMethod, fetchAccounts]);

  useEffect(() => {
    // If user is authenticated and has accounts, select the first one
    if (authMethod && accounts.length > 0 && !userPKP) {
      setuserPKP(accounts[0]);
    }
  }, [authMethod, accounts, userPKP, setuserPKP]);

  useEffect(() => {
    // If user is authenticated and has selected an account, generate session sigs
    if (authMethod && userPKP) {
      generateSessionSigs();
    }
  }, [authMethod, userPKP, generateSessionSigs]);

  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Update loading message based on current state with smooth transitions
  useEffect(() => {
    // Determine the appropriate message based on current loading state
    let newMessage = '';
    if (authLoading) {
      newMessage = 'Authenticating your credentials...';
    } else if (accountsLoading) {
      newMessage = 'Fetching your Agent Wallet...';
    } else if (sessionLoading) {
      newMessage = 'Securing your session...';
    }
    
    // Only transition if the message is actually changing and not empty
    if (newMessage && newMessage !== loadingMessage) {
      // Start the transition
      setIsTransitioning(true);
      
      // Wait briefly before changing the message
      const timeout = setTimeout(() => {
        setLoadingMessage(newMessage);
        
        // After changing message, end the transition
        setTimeout(() => {
          setIsTransitioning(false);
        }, 150);
      }, 150);
      
      return () => clearTimeout(timeout);
    }
  }, [authLoading, accountsLoading, sessionLoading, loadingMessage]);

  useEffect(() => {
    return () => {
      // Cleanup web3 connection when component unmounts
      if (sessionSigs) {
        cleanupSession();
      }
    };
  }, [sessionSigs]);

  // Unified loading state
  if (authLoading || accountsLoading || sessionLoading) {
    return (
      <CenteredContainer>
        <Loading 
          copy={loadingMessage} 
          isTransitioning={isTransitioning}
        />
      </CenteredContainer>
    );
  }

  // Authenticated states
  if (userPKP && sessionSigs) {
    // Save the PKP info in localStorage for SessionValidator to use
    try {
      updateAuthInfo({
        agentPKP,
        userPKP
      });
    } catch (error) {
      console.error('Error saving PKP info to localStorage:', error);
    }

    return (
      <CenteredContainer>
        <AuthenticatedConsentForm
          userPKP={userPKP}
          sessionSigs={sessionSigs}
          agentPKP={agentPKP}
        />
      </CenteredContainer>
    );
  }

  // No accounts found state
  if (authMethod && accounts.length === 0) {
    switch (authMethod.authMethodType) {
      case AUTH_METHOD_TYPE.WebAuthn:
        return (
          <CenteredContainer>
            <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center">
                <div className="h-8 w-8 rounded-md bg-black flex items-center justify-center">
                  <Image src="/V.svg" alt="Vincent logo" width={16} height={16} />
                </div>
                <div className="ml-3 text-base font-medium text-gray-700">Connect with Vincent</div>
              </div>
              
              <div className="p-6">
                <h1 className="text-xl font-semibold text-center mb-4">No Accounts Found</h1>
                <p className="text-sm text-gray-600 text-center mb-6">You don&apos;t have any accounts associated with this WebAuthn credential.</p>
                <div className="flex flex-col space-y-3">
                  <button
                    type="button"
                    className="bg-black text-white rounded-lg py-3 font-medium text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleRegisterWithWebAuthn}
                  >
                    Create New Account
                  </button>
                  <button
                    type="button"
                    className="bg-white text-gray-700 border border-gray-200 rounded-lg py-3 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => authWithWebAuthn()}
                  >
                    Try Sign In Again
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-3 text-center border-t border-gray-100">
                <p className="text-xs text-black flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <a href="https://litprotocol.com" target="_blank" rel="noopener noreferrer" className="flex items-center">
                    Protected by <Image src="/wordmark.svg" alt="Lit" width={15} height={9} className="ml-1" />
                  </a>
                </p>
              </div>
            </div>
          </CenteredContainer>
        );

      case AUTH_METHOD_TYPE.StytchEmailFactorOtp:
      case AUTH_METHOD_TYPE.StytchSmsFactorOtp:
        return (
          <CenteredContainer>
            <Loading copy={'Creating your account...'} />
          </CenteredContainer>
        );

      case AUTH_METHOD_TYPE.EthWallet:
        return (
          <CenteredContainer>
            <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center">
                <div className="h-8 w-8 rounded-md bg-black flex items-center justify-center">
                  <Image src="/V.svg" alt="Vincent logo" width={16} height={16} />
                </div>
                <div className="ml-3 text-base font-medium text-gray-700">Connect with Vincent</div>
              </div>
              
              <div className="p-6">
                <h1 className="text-xl font-semibold text-center mb-4">No Accounts Found</h1>
                <p className="text-sm text-gray-600 text-center mb-6">No accounts were found for this wallet address.</p>
                <button
                  type="button"
                  className="bg-white text-gray-700 border border-gray-200 rounded-lg py-3 w-full font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
              
              <div className="px-6 py-3 text-center border-t border-gray-100">
                <p className="text-xs text-black flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <a href="https://litprotocol.com" target="_blank" rel="noopener noreferrer" className="flex items-center">
                    Protected by <Image src="/wordmark.svg" alt="Lit" width={15} height={9} className="ml-1" />
                  </a>
                </p>
              </div>
            </div>
          </CenteredContainer>
        );

      default:
        return (
          <CenteredContainer>
            <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center">
                <div className="h-8 w-8 rounded-md bg-black flex items-center justify-center">
                  <Image src="/V.svg" alt="Vincent logo" width={16} height={16} />
                </div>
                <div className="ml-3 text-base font-medium text-gray-700">Connect with Vincent</div>
              </div>
              
              <div className="p-6">
                <h1 className="text-xl font-semibold text-center mb-4">Unsupported Authentication Method</h1>
                <p className="text-sm text-gray-600 text-center mb-6">The authentication method you&apos;re using is not supported.</p>
                <button
                  type="button"
                  className="bg-white text-gray-700 border border-gray-200 rounded-lg py-3 w-full font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => window.location.reload()}
                >
                  Start Over
                </button>
              </div>
              
              <div className="px-6 py-3 text-center border-t border-gray-100">
                <p className="text-xs text-black flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <a href="https://litprotocol.com" target="_blank" rel="noopener noreferrer" className="flex items-center">
                    Protected by <Image src="/wordmark.svg" alt="Lit" width={15} height={9} className="ml-1" />
                  </a>
                </p>
              </div>
            </div>
          </CenteredContainer>
        );
    }
  }

  // Initial authentication state
  return (
    <CenteredContainer>
      <LoginMethods
        authWithEthWallet={authWithEthWallet}
        authWithWebAuthn={authWithWebAuthn}
        authWithStytch={authWithStytch}
        registerWithWebAuthn={handleRegisterWithWebAuthn}
      />
    </CenteredContainer>
  );
} 