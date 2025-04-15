import React from 'react';
import Image from 'next/image';
import { AUTH_METHOD_TYPE } from '@lit-protocol/constants';
import Loading from '../components/Loading';

interface SignUpViewProps {
  authMethodType: typeof AUTH_METHOD_TYPE[keyof typeof AUTH_METHOD_TYPE];
  handleRegisterWithWebAuthn?: () => Promise<void>;
  authWithWebAuthn?: () => void;
}

const SignUpView: React.FC<SignUpViewProps> = ({
  authMethodType,
  handleRegisterWithWebAuthn,
  authWithWebAuthn
}) => {
  const renderWebAuthnView = () => (
    <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center">
        <div className="h-8 w-8 rounded-md flex items-center justify-center">
          <Image src="/V.svg" alt="Vincent logo" width={20} height={20} />
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
            onClick={authWithWebAuthn}
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
  );

  const renderStytchView = () => (
    <Loading copy={'Creating your account...'} />
  );

  const renderWalletView = () => (
    <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center">
        <div className="h-8 w-8 rounded-md flex items-center justify-center">
          <Image src="/V.svg" alt="Vincent logo" width={20} height={20} />
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
  );

  const renderDefaultView = () => (
    <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center">
        <div className="h-8 w-8 rounded-md flex items-center justify-center">
          <Image src="/V.svg" alt="Vincent logo" width={20} height={20} />
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
  );

  switch (authMethodType) {
    case AUTH_METHOD_TYPE.WebAuthn:
      return renderWebAuthnView();
    case AUTH_METHOD_TYPE.StytchEmailFactorOtp:
    case AUTH_METHOD_TYPE.StytchSmsFactorOtp:
      return renderStytchView();
    case AUTH_METHOD_TYPE.EthWallet:
      return renderWalletView();
    default:
      return renderDefaultView();
  }
};

export default SignUpView; 