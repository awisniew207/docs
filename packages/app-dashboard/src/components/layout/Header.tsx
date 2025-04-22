import { JSX } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header() {
  return (
    <div className="border-b">
      <div className="max-w-screen-xl mx-auto p-6">
        <div className="flex justify-between items-center">
          <a href="/" className="flex items-center">
            <img
              src="/vincent-logo.png"
              alt="Vincent"
              width={150}
              height={40}
            />
          </a>
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openConnectModal,
              mounted,
            }) => {
              if (!mounted) {
                return null;
              }

              return (
                <button
                  onClick={openConnectModal}
                  className="bg-black text-white px-4 py-2 rounded-md hover:bg-black/90 transition-colors"
                >
                  {!account && !chain && 'Connect Wallet'}
                  {account && chain && (
                    <div onClick={openAccountModal} className="flex items-center gap-2">
                      {account.displayName}
                      {account.displayBalance ? ` (${account.displayBalance})` : ''}
                    </div>
                  )}
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </div>
  );
}

export function WithHeader<T extends JSX.IntrinsicAttributes>(Component: React.ComponentType<T>) {
  return function WrappedComponent(props: T) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-screen-xl min-h-screen mx-auto p-6">
          <Component {...props} />
        </main>
      </div>
    );
  };
}
