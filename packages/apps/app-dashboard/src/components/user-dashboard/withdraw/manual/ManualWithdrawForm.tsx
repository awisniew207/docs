import { useCallback, useState, useEffect } from 'react';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import { LIT_CHAINS } from '@lit-protocol/constants';
import StatusMessage from '@/components/user-dashboard/connect/StatusMessage';

import { ChainSelector } from './ChainSelector';
import { TokenSelector } from './TokenSelector';
import { WithdrawPanel } from './ManualWithdraw';
import { BalanceDisplay } from './BalanceDisplay';
import { StatusType } from '@/types/shared/StatusType';
import { handleSubmit } from '@/utils/user-dashboard/withdrawHandler';
import { ethers } from 'ethers';

export interface ManualWithdrawProps {
  sessionSigs: SessionSigs;
  agentPKP: IRelayPKP;
  isSessionValidation?: boolean;
  userPKP?: IRelayPKP;
  shouldRefreshBalances?: boolean;
}

export interface TokenDetails {
  address: string;
  symbol: string;
  decimals: number;
}

export const ManualWithdraw: React.FC<ManualWithdrawProps> = ({ sessionSigs, agentPKP }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedChain, setSelectedChain] = useState<string>('ethereum');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<StatusType>('info');
  const [isCustomToken, setIsCustomToken] = useState<boolean>(false);
  const [customTokenAddress, setCustomTokenAddress] = useState<string>('');
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  const [nativeToken, setNativeToken] = useState<TokenDetails>({
    address: '',
    symbol: '',
    decimals: 18,
  });
  const [isConfirmationMode, setIsConfirmationMode] = useState<boolean>(false);

  const showStatus = (message: string, type: StatusType = 'info') => {
    setStatusMessage(message);
    setStatusType(type);

    // Clear success messages after 10 seconds
    if (type === 'success' && message.includes('withdrawal confirmed')) {
      setTimeout(() => {
        setStatusMessage(null);
      }, 10000);
    }
  };

  const refreshBalance = useCallback(async () => {
    setLoading(true);
    const chain = LIT_CHAINS[selectedChain];
    const rpcUrl = chain.rpcUrls[0];
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    try {
      const result = await provider.getBalance(agentPKP!.ethAddress);
      setNativeBalance(ethers.utils.formatUnits(result, chain.decimals));
      const token = {
        address: chain.contractAddress!,
        symbol: chain.symbol,
        decimals: chain.decimals,
      };
      setNativeToken(token);
      showStatus('Balance successfully fetched', 'success');
    } catch (error: unknown) {
      showStatus(`Error: ${(error as Error).message || 'Error fetching balance'}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [agentPKP, selectedChain]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await handleSubmit(
      isCustomToken,
      customTokenAddress,
      withdrawAmount,
      withdrawAddress,
      agentPKP,
      sessionSigs,
      selectedChain,
      setLoading,
      showStatus,
      isConfirmationMode,
    );

    if (result.success && result.needsConfirmation) {
      setIsConfirmationMode(true);
    } else if (result.success) {
      setIsConfirmationMode(false);
      setTimeout(() => {
        refreshBalance();
      }, 5000);
    }
  };

  const onCancel = () => {
    setIsConfirmationMode(false);
    showStatus('Transaction cancelled', 'success');
  };

  return (
    <div className="space-y-4">
      {statusMessage && <StatusMessage message={statusMessage} type={statusType} />}

      <BalanceDisplay
        balance={nativeBalance}
        token={nativeToken}
        loading={loading}
        refreshBalance={refreshBalance}
      />

      <ChainSelector
        selectedChain={selectedChain}
        ethAddress={agentPKP.ethAddress}
        onChange={setSelectedChain}
      />

      <TokenSelector
        isCustomToken={isCustomToken}
        customTokenAddress={customTokenAddress}
        setIsCustomToken={setIsCustomToken}
        setCustomTokenAddress={setCustomTokenAddress}
      />

      <WithdrawPanel
        withdrawAddress={withdrawAddress}
        setWithdrawAddress={setWithdrawAddress}
        withdrawAmount={withdrawAmount}
        setWithdrawAmount={setWithdrawAmount}
        tokenSymbol={nativeToken.symbol}
        loading={loading}
        onSubmit={onSubmit}
        confirmationMode={isConfirmationMode}
        onCancel={onCancel}
      />
    </div>
  );
};
