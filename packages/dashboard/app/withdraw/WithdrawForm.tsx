import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';

import { useErrorPopup } from '@/providers/error-popup';
import { useHiddenTokens } from './utils/hiddenTokens';
import {
  FormHeader,
  StatusMessage,
  TokenList,
  WalletInfo,
  WithdrawPanel,
  TokenBalance,
  StatusType
} from '../../components/withdraw';
import {
  handleTokenSelect,
  handleMaxAmount,
  handleToggleHideToken,
  handleRefreshBalances,
  handleSubmit
} from './utils/handlers';

export interface WithdrawFormProps {
  sessionSigs: SessionSigs;
  agentPKP?: IRelayPKP;
  isSessionValidation?: boolean;
  userPKP?: IRelayPKP;
  shouldRefreshBalances?: boolean;
}

export default function WithdrawForm({
  sessionSigs,
  agentPKP,
  shouldRefreshBalances = false,
}: WithdrawFormProps) {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<StatusType>('info');
  const [showHiddenTokens, setShowHiddenTokens] = useState<boolean>(false);
  const hasInitializedRef = useRef<boolean>(false);
  
  const { showError } = useErrorPopup();
  
  // Ensure that we only fetch the balances once
  useEffect(() => {
    if (!shouldRefreshBalances) {
      return;
    }
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      refreshBalances();
    }
  }, [shouldRefreshBalances]);

  // Auto-select ETH token when balances are loaded, ETH is guaranteed to be in the balances array
  useEffect(() => {
    if (balances.length > 0) {
      const ethToken = balances.find(token => token.symbol === 'ETH');
      handleTokenSelect(ethToken!, setSelectedToken, setWithdrawAmount);
    }
  }, [balances]);

  // Wrapper for refresh balances
  const refreshBalances = () => {
    handleRefreshBalances(
      agentPKP?.ethAddress,
      setLoading,
      setBalances,
      showStatus,
      showError
    );
  };
  
  // Use the hidden tokens hook
  const { hiddenTokens, hideToken, unhideToken } = useHiddenTokens();

  // Helper function to set status message
  const showStatus = (message: string, type: StatusType = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
  };

  // Toggle hidden tokens visibility
  const toggleHiddenTokens = () => {
    setShowHiddenTokens(!showHiddenTokens);
  };

  // Instead of state, use useMemo
  const filteredBalances = useMemo(() => {
    return showHiddenTokens 
      ? balances 
      : balances.filter(token => !hiddenTokens.includes(token.address.toLowerCase()));
  }, [showHiddenTokens, hiddenTokens, balances]);

  // Wrapper for token selection
  const onSelectToken = (token: TokenBalance) => {
    handleTokenSelect(token, setSelectedToken, setWithdrawAmount);
  };

  // Wrapper for max amount
  const onMaxAmount = () => {
    handleMaxAmount(selectedToken, setWithdrawAmount, showStatus);
  };

  // Wrapper for toggle hide token
  const onToggleHideToken = (address: string, e: React.MouseEvent) => {
    handleToggleHideToken(
      address, 
      e, 
      hiddenTokens, 
      selectedToken, 
      hideToken, 
      unhideToken, 
      setSelectedToken, 
      setWithdrawAmount
    );
  };

  // Wrapper for submit
  const onSubmit = (e: React.FormEvent) => {
    handleSubmit(
      e,
      selectedToken,
      withdrawAmount,
      withdrawAddress,
      agentPKP!,
      sessionSigs,
      setSubmitting,
      setWithdrawAmount,
      setWithdrawAddress,
      showStatus,
      showError,
      refreshBalances
    );
  };

  return (
    <div className="withdraw-form-container">
      <FormHeader />
      <h3 className="mt-8 px-6">Account Fund Manager</h3>
      
      <StatusMessage message={statusMessage} type={statusType} />

      {loading ? (
        <div className="px-6 py-4 text-center text-gray-600">
          Loading tokens...
        </div>
      ) : (
        <>
          <TokenList 
            tokens={filteredBalances}
            selectedToken={selectedToken}
            hiddenTokens={hiddenTokens}
            showHiddenTokens={showHiddenTokens}
            loading={loading}
            submitting={submitting}
            onSelectToken={onSelectToken}
            onToggleHidden={onToggleHideToken}
            onToggleShowHidden={toggleHiddenTokens}
            onRefreshBalances={refreshBalances}
          />

          {selectedToken && (
            <WithdrawPanel
              selectedToken={selectedToken}
              withdrawAddress={withdrawAddress}
              withdrawAmount={withdrawAmount}
              submitting={submitting}
              onAddressChange={(e) => setWithdrawAddress(e.target.value)}
              onAmountChange={(e) => setWithdrawAmount(e.target.value)}
              onMaxAmount={onMaxAmount}
              onSubmit={onSubmit}
            />
          )}
        </>
      )}
      
      <WalletInfo ethAddress={agentPKP?.ethAddress} />
    </div>
  );
}