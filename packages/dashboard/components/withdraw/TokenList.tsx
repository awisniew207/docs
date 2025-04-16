import React from 'react';
import { TokenBalance } from './types';

interface TokenListProps {
  tokens: TokenBalance[];
  selectedToken: TokenBalance | null;
  hiddenTokens: string[];
  showHiddenTokens: boolean;
  loading: boolean;
  submitting: boolean;
  onSelectToken: (token: TokenBalance) => void;
  onToggleHidden: (address: string, e: React.MouseEvent) => void;
  onToggleShowHidden: () => void;
  onRefreshBalances: () => void;
}

const TokenList: React.FC<TokenListProps> = ({
  tokens,
  selectedToken,
  hiddenTokens,
  showHiddenTokens,
  loading,
  submitting,
  onSelectToken,
  onToggleHidden,
  onToggleShowHidden,
  onRefreshBalances
}) => {
  return (
    <div className="px-6">
      <div className="balances-header">
        <div className="flex items-center gap-2">
          <h3 className="my-0 flex items-center">Your Balances
            <button 
              className="refresh-icon-button ml-2 inline-flex items-center justify-center p-1"
              onClick={onRefreshBalances}
              disabled={loading || submitting}
              title="Refresh Balances"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
            </button>
          </h3>
        </div>
        <div className="filter-controls">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showHiddenTokens}
              onChange={onToggleShowHidden}
            />
            Show hidden tokens
          </label>
        </div>
      </div>
      
      {tokens.length === 0 ? (
        <div className="mb-4">No tokens found</div>
      ) : (
        <div className="token-grid">
          {tokens.map((token) => (
            <div
              key={token.address}
              className={`token-card ${
                selectedToken?.address === token.address ? 'selected' : ''
              } ${hiddenTokens.includes(token.address.toLowerCase()) ? 'hidden-token' : ''}`}
              onClick={() => onSelectToken(token)}
            >
              {token.logoUrl && (
                <img
                  src={token.logoUrl}
                  alt={token.symbol}
                  className="token-logo"
                  onError={(e) => {
                    // Hide broken images
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
              <div className="token-info">
                <div className="token-name">
                  {token.name} ({token.symbol})
                </div>
                <div className="token-balance">{token.balance}</div>
              </div>
              {token.address !== 'ETH' && (
                <button
                  className="token-action-btn"
                  onClick={(e) => onToggleHidden(token.address, e)}
                >
                  {hiddenTokens.includes(token.address.toLowerCase()) ? 'Show' : 'Hide'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TokenList; 