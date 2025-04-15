import { useConnect } from 'wagmi';
import { useIsMounted } from '../hooks/useIsMounted';
import Image from 'next/image';

interface WalletMethodsProps {
  authWithEthWallet: (connector: any) => Promise<void>;
  setView: React.Dispatch<React.SetStateAction<string>>;
}

const WalletMethods = ({ authWithEthWallet, setView }: WalletMethodsProps) => {
  const isMounted = useIsMounted();
  const { connectors } = useConnect();

  if (!isMounted) return null;

  return (
    <>
      <h1 className="text-xl font-semibold text-center text-gray-800 mb-2">Connect your wallet</h1>
      <p className="text-sm text-gray-600 text-center mb-6">
        Connect your wallet and sign a message to verify ownership
      </p>
      
      <div className="space-y-3">
        {connectors.map(connector => (
          <button
            key={connector.id}
            type="button"
            className="w-full bg-white text-gray-700 border border-gray-200 rounded-lg py-3 px-4 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={!connector.ready}
            onClick={() => authWithEthWallet({ connector })}
          >
            {connector.name.toLowerCase() === 'metamask' && (
              <div className="w-5 h-5 relative mr-2">
                <Image
                  src="/metamask.png"
                  alt="MetaMask logo"
                  fill={true}
                />
              </div>
            )}
            {connector.name.toLowerCase() === 'coinbase wallet' && (
              <div className="w-5 h-5 relative mr-2">
                <Image
                  src="/coinbase.png"
                  alt="Coinbase logo"
                  fill={true}
                />
              </div>
            )}
            <span>Continue with {connector.name}</span>
          </button>
        ))}
        
        <div className="mt-6">
          <button 
            type="button"
            onClick={() => setView('default')} 
            className="w-full bg-white text-gray-700 border border-gray-200 rounded-lg py-3 px-4 font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </>
  );
};

export default WalletMethods;
