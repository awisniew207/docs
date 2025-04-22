import { useState, Dispatch, SetStateAction } from 'react';

import AuthMethods from './AuthMethods';
import WalletMethods from './WalletMethods';
import WebAuthn from './WebAuthn';
import StytchOTP from './StytchOTP';

interface LoginProps {
  authWithEthWallet: (address: string) => Promise<void>;
  authWithWebAuthn: (credentialId: string, userId: string) => Promise<void>;
  authWithStytch: (sessionJwt: string, userId: string, method: 'email' | 'phone') => Promise<void>;
  registerWithWebAuthn?: (credentialId: string) => Promise<void>;
}

type AuthView = 'default' | 'email' | 'phone' | 'wallet' | 'webauthn';

export default function LoginMethods({
  authWithEthWallet,
  authWithWebAuthn,
  authWithStytch,
  registerWithWebAuthn,
}: LoginProps) {
  const [view, setView] = useState<AuthView>('default');

  return (
    <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center">
        <div className="h-8 w-8 rounded-md flex items-center justify-center">
          <img src="/logo.svg" alt="Vincent logo" width={20} height={20} />
        </div>
        <div className="ml-3 text-base font-medium text-gray-700">Connect with Vincent</div>
      </div>

      <div className="p-6">
        {view === 'default' && (
          <>
            <div className="flex flex-col items-center mb-6">
              <img
                src="/vincent-logo.png"
                alt="Vincent Logo"
                width={120}
                height={36}
                className="mb-3"
              />
              <h1 className="text-xl font-semibold text-center text-gray-800">Agent Wallet Authentication</h1>
              <p className="text-sm text-gray-600 mt-2">Access or create your Vincent Agent Wallet</p>
            </div>
            <AuthMethods setView={setView as Dispatch<SetStateAction<string>>} />
          </>
        )}
        {view === 'email' && (
          <StytchOTP
            method="email"
            authWithStytch={authWithStytch}
            setView={setView as Dispatch<SetStateAction<string>>}
          />
        )}
        {view === 'phone' && (
          <StytchOTP
            method="phone"
            authWithStytch={authWithStytch}
            setView={setView as Dispatch<SetStateAction<string>>}
          />
        )}
        {view === 'wallet' && (
          <WalletMethods
            authWithEthWallet={authWithEthWallet}
            setView={setView as Dispatch<SetStateAction<string>>}
          />
        )}
        {view === 'webauthn' && (
          <WebAuthn
            authWithWebAuthn={authWithWebAuthn}
            registerWithWebAuthn={registerWithWebAuthn}
            setView={setView as Dispatch<SetStateAction<string>>}
          />
        )}
      </div>

      <div className="px-6 py-3 text-center border-t border-gray-100">
        <p className="text-xs text-black flex items-center justify-center">
          <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <a href="https://litprotocol.com" target="_blank" rel="noopener noreferrer" className="flex items-center">
            Protected by <img src="/wordmark.svg" alt="Lit" width={15} height={9} className="ml-1" />
          </a>
        </p>
      </div>
    </div>
  );
}
