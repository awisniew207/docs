import { Helmet } from 'react-helmet';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import ProtectedByLit from '@/components/layout/ProtectedByLit';
import Footer from '@/components/layout/Footer';

export default function ConnectWalletScreen() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) {
      navigate('/developer/dashboard');
    }
  }, [isConnected, navigate]);

  return (
    <>
      <Helmet>
        <title>Vincent | Developer Dashboard</title>
        <meta name="description" content="Connect your wallet to Vincent Developer Dashboard" />
      </Helmet>
      <div className="flex flex-col items-center justify-between flex-1 bg-white text-center font-sans relative">
        <main className="flex flex-col items-center flex-1 justify-center">
          <img
            src="/vincent-main-logo.png"
            alt="Vincent by Lit Protocol - Assistant for user owned automation"
            className="max-w-[400px] mb-5"
          />
          <h1 className="text-4xl font-medium text-gray-900 mb-4 mt-0">Developer Dashboard</h1>

          <div className="mb-2.5">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus || authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            className="bg-gray-900 text-white px-5 py-2.5 rounded-[20px] font-medium mx-2.5 inline-block border-none cursor-pointer hover:bg-gray-800 transition-colors"
                            onClick={openConnectModal}
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            className="bg-red-600 text-white px-5 py-2.5 rounded-[20px] font-medium mx-2.5 inline-block border-none cursor-pointer hover:bg-red-700 transition-colors"
                            onClick={openChainModal}
                          >
                            Unsupported network
                          </button>
                        );
                      }

                      return (
                        <div className="flex gap-2.5 justify-center flex-wrap">
                          <button
                            className="bg-transparent text-gray-900 px-5 py-2.5 rounded-[20px] font-medium mx-2.5 inline-block border border-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={openChainModal}
                          >
                            {chain.name}
                          </button>
                          <button
                            className="bg-transparent text-gray-900 px-5 py-2.5 rounded-[20px] font-medium mx-2.5 inline-block border border-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={openAccountModal}
                          >
                            {account.displayName}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>

          <div className="mt-2.5 mb-[30px]">
            <a
              target="_blank"
              href="https://docs.heyvincent.ai/"
              className="text-gray-600 no-underline hover:text-gray-800 transition-colors"
              rel="noopener noreferrer"
              style={{ color: '#666', textDecoration: 'none' }}
            >
              Developer Docs
            </a>
          </div>

          <ProtectedByLit />
        </main>

        <Footer />
      </div>
    </>
  );
}
