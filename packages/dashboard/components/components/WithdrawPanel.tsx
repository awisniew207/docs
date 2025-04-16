import React from 'react';
import { TokenBalance } from './types';

interface WithdrawPanelProps {
  selectedToken: TokenBalance;
  withdrawAddress: string;
  withdrawAmount: string;
  submitting: boolean;
  onAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxAmount: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const WithdrawPanel: React.FC<WithdrawPanelProps> = ({
  selectedToken,
  withdrawAddress,
  withdrawAmount,
  submitting,
  onAddressChange,
  onAmountChange,
  onMaxAmount,
  onSubmit
}) => {
  return (
    <form className="withdraw-form" onSubmit={onSubmit}>
      <div className="px-6 pb-6">
        <h3>Withdraw {selectedToken.symbol}</h3>
        
        <div className="form-group">
          <label htmlFor="withdraw-address">Recipient Address</label>
          <input
            id="withdraw-address"
            type="text"
            value={withdrawAddress}
            onChange={onAddressChange}
            placeholder="0x..."
            disabled={submitting}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="withdraw-amount">Amount</label>
          <div className="amount-input-container">
            <input
              id="withdraw-amount"
              type="text"
              value={withdrawAmount}
              onChange={onAmountChange}
              placeholder="0.0"
              disabled={submitting}
              required
            />
            <button 
              type="button" 
              className="max-button"
              onClick={onMaxAmount}
              disabled={submitting}
            >
              MAX
            </button>
          </div>
          <div className="balance-info">
            Available: {selectedToken.balance} {selectedToken.symbol}
          </div>
        </div>
      </div>
      
      <div className="withdraw-button-container">
        <button 
          type="submit" 
          className="withdraw-button"
          disabled={submitting || !withdrawAmount || !withdrawAddress}
        >
          {submitting ? 'Processing...' : `Withdraw ${selectedToken.symbol}`}
        </button>
      </div>
    </form>
  );
};

export default WithdrawPanel; 