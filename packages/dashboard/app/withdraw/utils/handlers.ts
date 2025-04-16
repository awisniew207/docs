import { ethers } from 'ethers';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { TokenBalance, StatusType } from '../../../components/components/types';
import { parseTokenAmount, sendEthTransaction, sendTokenTransaction } from './transactionService';
import { fetchTokenBalances } from './alchemyUtils';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { SessionSigs } from '@lit-protocol/types';
import { IRelayPKP } from '@lit-protocol/types';

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
        const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
        
        // Get current gas price
        const gasPrice = await provider.getGasPrice();
        
        // For ETH transfers specifically:
        // 21000 is the gas used by a basic ETH transfer operation
        // This is determined by the Ethereum protocol, not a "standard"
        const basicTransferGas = ethers.BigNumber.from(21000);
        
        // Add a buffer for potential network congestion (50%)
        const estimatedGasWithBuffer = basicTransferGas.mul(150).div(100);
        
        // Calculate estimated gas cost based on current network conditions
        const estimatedGasCost = estimatedGasWithBuffer.mul(gasPrice);
        
        // Add a small additional buffer for price fluctuations during transaction confirmation
        const totalReserve = estimatedGasCost.mul(120).div(100);
        
        // If balance is less than the estimated cost, set 0
        if (selectedToken.rawBalance.lte(totalReserve)) {
          setWithdrawAmount('0');
          showStatus('Insufficient balance for gas fees', 'warning');
        } else {
          // Subtract estimated cost from balance
          const maxAmount = selectedToken.rawBalance.sub(totalReserve);
          setWithdrawAmount(ethers.utils.formatEther(maxAmount));
          showStatus(`Reserved ~${ethers.utils.formatEther(totalReserve)} ETH for gas`, 'info');
        }
      } catch (error) {
        console.error('Error calculating max amount:', error);
        // Fallback to 90% of balance if estimation fails
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
  agentPKP: IRelayPKP | undefined,
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

  if (!ethers.utils.isAddress(withdrawAddress)) {
    showStatus('Invalid withdrawal address', 'error');
    return;
  }

  try {
    setSubmitting(true);
    showStatus('Preparing withdrawal...', 'info');

    const litNodeClient = new LitNodeClient({
      litNetwork: "datil"
    });
    await litNodeClient.connect();

    const pkpWallet = new PKPEthersWallet({
      pkpPubKey: agentPKP!.publicKey,
      litNodeClient: litNodeClient,
      controllerSessionSigs: sessionSigs,
      rpc: "https://mainnet.base.org"
    })

    await pkpWallet.init();
    console.log("pkpWallet", pkpWallet);
  

    // Parse the amount using the token's decimals
    const amount = parseTokenAmount(withdrawAmount, selectedToken.decimals);
    
    let transactionResult;
    
    // Check if selected token is ETH or an ERC-20
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
      
      const tokenDetails = {
        address: selectedToken.address,
        symbol: selectedToken.symbol,
        decimals: selectedToken.decimals,
        rawBalance: selectedToken.rawBalance
      };
      
      if (!agentPKP?.ethAddress) {
        showStatus('Sender address not found', 'error');
        setSubmitting(false);
        return;
      }
      
      transactionResult = await sendTokenTransaction(
        pkpWallet,
        tokenDetails,
        amount,
        withdrawAddress,
        agentPKP?.ethAddress
      );
    }
    
    // Handle transaction result
    if (transactionResult.success) {
      showStatus(`${selectedToken.symbol} withdrawal confirmed! TX Hash: ${transactionResult.hash}`, 'success');
      
      // Reset form
      setWithdrawAmount('');
      setWithdrawAddress('');
    } else {
      if (transactionResult.hash) {
        showStatus(`Transaction may have failed. Please check explorer. TX: ${transactionResult.hash}`, 'warning');
      } else {
        showStatus(transactionResult.error || 'Transaction failed', 'error');
      }
    }
    
    // Refresh balances regardless of status
    refreshBalances();
  } catch (err: any) {
    console.error('Error submitting withdrawal:', err);
    showStatus('Failed to submit withdrawal', 'error');
    showError(`Error processing withdrawal request: ${err.message}`, 'Transaction Error');
  } finally {
    setSubmitting(false);
  }
}; 