import React from 'react';

interface WalletInfoProps {
  ethAddress?: string;
}

const WalletInfo: React.FC<WalletInfoProps> = ({ ethAddress }) => {
  return (
    <div className="wallet-info">
      <h3>Wallet Information</h3>
      <div className="wallet-address">
        <strong>EVM Address:</strong> {ethAddress || 'Not available'}
      </div>
      <div className="wallet-network">
        <strong>Network:</strong> Base Mainnet
      </div>
    </div>
  );
};

export default WalletInfo; 