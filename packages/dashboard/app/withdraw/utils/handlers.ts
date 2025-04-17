import { ethers } from 'ethers';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { TokenBalance, StatusType } from '../../../components/withdraw/types';
import { sendEthTransaction, sendTokenTransaction, calculateEthGasCosts } from './transactionService';
import { fetchERC20TokenBalances, fetchEthBalance } from './tokenUtils';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import { SELECTED_LIT_NETWORK } from '@/components/consent/utils/lit';

let isLitNodeClientInitialized = false;
let litNodeClient: LitNodeClient;
async function initLitNodeClient() {
  if (!isLitNodeClientInitialized) {
    litNodeClient = new LitNodeClient({
      litNetwork: SELECTED_LIT_NETWORK
    });
    await litNodeClient.connect();
    isLitNodeClientInitialized = true;
  }
  return litNodeClient;
}

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
    // If ETH, account for both L1 and L2 fees on Base
    if (selectedToken.symbol === 'ETH') {
      try {
        const gasInfo = await calculateEthGasCosts();
        // Setting a 100% buffer here for the total cost. Cost is >$.002 and it isn't worth
        // the potential transaction failure just for the extra $.002
        const totalCost = gasInfo.totalCost.mul(2);

        if (selectedToken.rawBalance.lte(totalCost)) {
          setWithdrawAmount('0');
          showStatus('Insufficient balance for gas fees', 'warning');
        } else {
          const maxAmount = selectedToken.rawBalance.sub(totalCost);
          setWithdrawAmount(ethers.utils.formatEther(maxAmount));
          showStatus(`Reserved ETH for gas fees`, 'info');
        }
      } catch (error) {
        // Fallback to 80% of balance if estimation fails
        console.error('Error calculating max amount:', error);
        const maxAmount = selectedToken.rawBalance.mul(80).div(100);
        setWithdrawAmount(ethers.utils.formatEther(maxAmount));
        showStatus('Using fallback 80% of balance due to estimation error', 'warning');
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
    const ethBalance = await fetchEthBalance(ethAddress);
    const erc20TokenBalances = await fetchERC20TokenBalances(ethAddress);

    const balances = [ethBalance.balances[0],...erc20TokenBalances.balances];

    if (erc20TokenBalances.success && ethBalance.success) {
      setBalances(balances);
      showStatus('Token balances fetched successfully', 'success');
    } else {
      showStatus('Failed to fetch all token balances', 'warning');
      if (erc20TokenBalances.error) {
        showError(erc20TokenBalances.error, 'Token Balance Error');
      }
      if (ethBalance.error) {
        showError(ethBalance.error, 'Token Balance Error');
      }
    }
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
      if (parsedAmount.gte(selectedToken.rawBalance)) {
        showStatus(`You have entered an amount greater than or equal to your balance. Please enter a smaller amount.`, 'warning');
        return;
      }
    }
  }

  try {
    setSubmitting(true);
    showStatus('Preparing withdrawal...', 'info');
    litNodeClient = await initLitNodeClient();

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