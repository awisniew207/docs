import React, { useState, useEffect } from 'react';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import { LIT_CHAINS } from '@lit-protocol/constants';

import {
  FormHeader,
  StatusMessage,
  WalletInfo,
  StatusType,
  ChainSelector,
  TokenSelector,
  WithdrawPanel,
  BalanceDisplay
} from '../../components/withdraw';
import { handleSubmit } from './utils/handlers';
import { ethers } from 'ethers';
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
}: WithdrawFormProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedChain, setSelectedChain] = useState<string>('ethereum');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<StatusType>('info');
  const [isCustomToken, setIsCustomToken] = useState<boolean>(false);
  const [customTokenAddress, setCustomTokenAddress] = useState<string>('');
  const [ethBalance, setEthBalance] = useState<string>('0');
  
  const showStatus = (message: string, type: StatusType = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
  };

  const refreshBalance = async () => {
    setLoading(true);
    const chain = LIT_CHAINS[selectedChain]; // Chains are only from the dropdown  
    const rpcUrl = chain.rpcUrls[0]; // rpcUrl is a require prop for chains
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    try {
      const result = await provider.getBalance(agentPKP!.ethAddress);
      setEthBalance(ethers.utils.formatEther(result));
      showStatus('Balance successfully fetched', 'success');   
    } catch (error: any) {
      showStatus(`Error: ${error.message || 'Error fetching balance'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshBalance();
  }, [selectedChain]);

  // Handle submission
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await handleSubmit(
      isCustomToken,
      customTokenAddress,
      withdrawAmount,
      withdrawAddress,
      agentPKP!,
      sessionSigs,
      selectedChain,
      setLoading,
      showStatus
    );

    if (result.success) {
        refreshBalance();
    }
  };

  return (
    <div className="withdraw-form-container">
      <FormHeader />
      <h3 className="mt-8 px-6">Account Fund Manager</h3>
      
      <StatusMessage message={statusMessage} type={statusType} />

      <WalletInfo ethAddress={agentPKP?.ethAddress} />

      <div className="p-6">
        <ChainSelector 
          selectedChain={selectedChain}
          ethAddress={agentPKP!.ethAddress}
          onChange={setSelectedChain}
        />
        
        <BalanceDisplay 
          ethBalance={ethBalance}
          loading={loading}
          refreshBalance={refreshBalance}
        />

        <TokenSelector
          isCustomToken={isCustomToken}
          setIsCustomToken={setIsCustomToken}
          customTokenAddress={customTokenAddress}
          setCustomTokenAddress={setCustomTokenAddress}
        />

        <WithdrawPanel
          withdrawAddress={withdrawAddress}
          setWithdrawAddress={setWithdrawAddress}
          withdrawAmount={withdrawAmount}
          setWithdrawAmount={setWithdrawAmount}
          tokenSymbol={isCustomToken ? 'TOKEN' : 'ETH'}
          loading={loading}
          onSubmit={onSubmit}
        />
      </div>
      
    </div>
  );
}