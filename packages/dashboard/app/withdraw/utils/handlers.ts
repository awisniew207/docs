import { ethers } from 'ethers';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { TokenBalance, StatusType } from '../../../components/withdraw/types';
import { sendEthTransaction, sendTokenTransaction } from './transactionService';
import { fetchTokenBalances } from './alchemyUtils';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import { LIT_NETWORK } from '@lit-protocol/constants';

const BASE_MAINNET_RPC = process.env.NEXT_PUBLIC_BASE_MAINNET_RPC;
const BASE_EXPLORER_URL = "https://basescan.org/tx/";

type ShowStatusFn = (message: string, type: StatusType) => void;
type ShowErrorFn = (message: string, title: string) => void;

export const handleTokenSelect = (
  token: TokenBalance, 
  setSelectedToken: (token: TokenBalance | null) => void,
  setWithdrawAmount: (amount: string) => void
) => {
  setSelectedToken(token);
  setWithdrawAmount('');
};

export const handleMaxAmount = async (
  selectedToken: TokenBalance | null,
  setWithdrawAmount: (amount: string) => void,
  showStatus: ShowStatusFn
) => {
  if (selectedToken) {
    // If ETH, estimate gas dynamically
    if (selectedToken.symbol === 'ETH') {
      try {
        const provider = new ethers.providers.JsonRpcProvider(BASE_MAINNET_RPC);
        
        const gasPrice = (await provider.getGasPrice()).mul(120).div(100);
        
        if (selectedToken.rawBalance.lte(gasPrice)) {
          setWithdrawAmount('0');
          showStatus('Insufficient balance for gas fees', 'warning');
        } else {
          const maxAmount = selectedToken.rawBalance.sub(gasPrice);
          setWithdrawAmount(ethers.utils.formatEther(maxAmount));
          showStatus(`Reserved ~${ethers.utils.formatEther(gasPrice)} ETH for gas`, 'info');
        }
      } catch (error) {
        // Fallback to 90% of balance if estimation fails.
        // This isn't a critical issue, as the user can always adjust the amount.
        console.error('Error calculating max amount:', error);
        const maxAmount = selectedToken.rawBalance.mul(90).div(100);
        setWithdrawAmount(ethers.utils.formatEther(maxAmount));
        showStatus('Using fallback 90% of balance due to estimation error', 'warning');
      }
    } else {
      // For tokens, use the full balance
      setWithdrawAmount(selectedToken.balance);
    }
  }
};

export const handleToggleHideToken = (
  address: string, 
  e: React.MouseEvent,
  hiddenTokens: string[],
  selectedToken: TokenBalance | null,
  hideToken: (address: string) => void,
  unhideToken: (address: string) => void,
  setSelectedToken: (token: TokenBalance | null) => void,
  setWithdrawAmount: (amount: string) => void
) => {
  e.stopPropagation();
  
  if (hiddenTokens.includes(address.toLowerCase())) {
    unhideToken(address);
  } else {
    hideToken(address);
    
    // If the hidden token was selected, clear selection
    if (selectedToken && selectedToken.address.toLowerCase() === address.toLowerCase()) {
      setSelectedToken(null);
      setWithdrawAmount('');
    }
  }
};

export const handleRefreshBalances = async (
  ethAddress: string | undefined,
  setLoading: (loading: boolean) => void,
  setBalances: (balances: TokenBalance[]) => void,
  showStatus: ShowStatusFn,
  showError: ShowErrorFn
) => {
  if (!ethAddress) return;
  
  try {
    setLoading(true);
    const tokens = await fetchTokenBalances(ethAddress);
    setBalances(tokens);
    showStatus('Token balances fetched successfully', 'success');
  } catch (err: any) {
    showStatus('Failed to fetch token balances', 'error');
    showError('Error fetching token balances', 'Error');
  } finally {
    setLoading(false);
  }
};

export const handleSubmit = async (
  e: React.FormEvent,
  selectedToken: TokenBalance | null,
  withdrawAmount: string,
  withdrawAddress: string,
  agentPKP: IRelayPKP,
  sessionSigs: SessionSigs,
  setSubmitting: (submitting: boolean) => void,
  setWithdrawAmount: (amount: string) => void,
  setWithdrawAddress: (address: string) => void,
  showStatus: ShowStatusFn,
  showError: ShowErrorFn,
  refreshBalances: () => void
) => {
  e.preventDefault();

  if (!selectedToken || !withdrawAmount || !withdrawAddress) {
    showStatus('Please fill all fields', 'warning');
    return;
  }

  if (parseFloat(withdrawAmount) === 0) {
    showStatus('Withdrawal amount cannot be zero', 'warning');
    return;
  }

  if (!ethers.utils.isAddress(withdrawAddress)) {
    showStatus('Invalid withdrawal address', 'error');
    return;
  }

  if (selectedToken) {
    if (selectedToken.symbol === 'ETH') {
      const parsedAmount = ethers.utils.parseUnits(withdrawAmount, selectedToken.decimals);
      if (parsedAmount.eq(selectedToken.rawBalance)) {
        showStatus(`You won't be able to withdraw the full amount due to gas fees`, 'warning');
        return;
      }
    } else {
      const parsedAmount = ethers.utils.parseUnits(withdrawAmount, selectedToken.decimals);
      if (parsedAmount.gt(selectedToken.rawBalance)) {
        showStatus(`Insufficient ${selectedToken.symbol} balance`, 'error');
        return;
      }
    }
  }

  try {
    setSubmitting(true);
    showStatus('Preparing withdrawal...', 'info');

    const litNodeClient = new LitNodeClient({
      litNetwork: LIT_NETWORK.Datil
    });
    await litNodeClient.connect();

    const pkpWallet = new PKPEthersWallet({
      pkpPubKey: agentPKP.publicKey,
      litNodeClient: litNodeClient,
      controllerSessionSigs: sessionSigs,
      rpc: BASE_MAINNET_RPC
    })

    await pkpWallet.init();

    const amount = ethers.utils.parseUnits(withdrawAmount, selectedToken.decimals);
    
    let transactionResult;
    
    if (selectedToken.symbol === 'ETH') {
      // ETH Transfer
      console.log('Preparing ETH transfer');
      showStatus(`Preparing ETH withdrawal of ${withdrawAmount} ETH...`, 'info');
      
      transactionResult = await sendEthTransaction(
        pkpWallet,
        amount,
        withdrawAddress,
        selectedToken.rawBalance
      );
    } else {
      // ERC-20 Token Transfer
      console.log('Preparing ERC-20 token transfer');
      showStatus(`Preparing ${selectedToken.symbol} withdrawal of ${withdrawAmount}...`, 'info');
      
      transactionResult = await sendTokenTransaction(
        pkpWallet,
        selectedToken,
        amount,
        withdrawAddress,
        agentPKP.ethAddress
      );
    }
    
    if (transactionResult.success) {
      // Create a clickable link to the transaction on Basescan
      const txLink = `${BASE_EXPLORER_URL}${transactionResult.hash}`;
      showStatus(`${selectedToken.symbol} withdrawal confirmed!&nbsp;&nbsp;<a href="${txLink}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">View transaction</a>`, 'success');
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
      
      // Reset form and balances
      setWithdrawAmount('');
      setWithdrawAddress('');
      refreshBalances();
    } else {
      if (transactionResult.hash) {
        const txLink = `${BASE_EXPLORER_URL}${transactionResult.hash}`;
        showStatus(`Transaction may have failed.&nbsp;&nbsp;<a href="${txLink}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">Check on Basescan</a>`, 'warning');
      } else {
        showStatus(transactionResult.error || 'Transaction failed', 'error');
      }
    }
    
  } catch (err: any) {
    console.error('Error submitting withdrawal:', err);
    showStatus('Failed to submit withdrawal', 'error');
    showError(`Error processing withdrawal request: ${err.message}`, 'Transaction Error');
  } finally {
    setSubmitting(false);
  }
}; 