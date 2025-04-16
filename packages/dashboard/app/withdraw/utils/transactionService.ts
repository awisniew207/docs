import { ethers } from 'ethers';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

// ERC-20 ABI (minimal interface needed for transfers)
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

interface TokenDetails {
  address: string;
  symbol: string;
  decimals: number;
  rawBalance: ethers.BigNumber;
}

interface TransactionResult {
  success: boolean;
  hash: string;
  error?: string;
  receipt?: ethers.providers.TransactionReceipt;
}

/**
 * Sends an ETH transfer transaction
 */
export async function sendEthTransaction(
  pkpWallet: PKPEthersWallet,
  amount: ethers.BigNumber,
  recipientAddress: string,
  tokenBalance: ethers.BigNumber
): Promise<TransactionResult> {
  try {
    const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
    
    // Get current gas price
    const gasPrice = await provider.getGasPrice();
    
    // Estimate gas for the ETH transfer
    let gasLimit;
    try {
      // Prepare transaction for estimation
      const estimateTransaction = {
        from: await pkpWallet.getAddress(),
        to: recipientAddress,
        value: amount
      };
      
      // Estimate gas
      const estimatedGas = await provider.estimateGas(estimateTransaction);
      
      // Add 20% buffer to estimated gas
      gasLimit = estimatedGas.mul(110).div(100);
      console.log('Estimated gas for ETH transfer:', gasLimit.toString());
    } catch (err) {
      console.error('Failed to estimate gas for ETH transfer:', err);
      return {
        success: false,
        hash: '',
        error: 'Failed to estimate gas for transaction'
      };
    }
    
    // Calculate gas cost and check if balance is sufficient
    const gasCost = gasLimit.mul(gasPrice);
    const totalCost = amount.add(gasCost);
    
    if (totalCost.gt(tokenBalance)) {
      const maxPossible = tokenBalance.sub(gasCost);
      const humanReadable = maxPossible.lte(ethers.constants.Zero) 
        ? '0' 
        : ethers.utils.formatEther(maxPossible);
      
      return {
        success: false,
        hash: '',
        error: `Insufficient funds for gas. Maximum possible amount: ${humanReadable} ETH`
      };
    }
    
    // Configure ETH transaction options
    const txOptions = {
      to: recipientAddress,
      value: amount,
      gasLimit: gasLimit,
      gasPrice: gasPrice
    };
    
    console.log('Sending ETH transaction with options:', {
      to: recipientAddress,
      value: ethers.utils.formatEther(amount) + ' ETH',
      gasLimit: gasLimit.toString(),
      gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei') + ' gwei'
    });
    
    // Send the ETH transaction
    const tx = await pkpWallet.sendTransaction(txOptions);
    
    // Wait for the transaction to be mined with 1 confirmation
    const receipt = await provider.waitForTransaction(tx.hash, 1);
    
    return {
      success: receipt.status === 1,
      hash: tx.hash,
      receipt
    };
  } catch (error: any) {
    console.error('Error sending ETH transaction:', error);
    return {
      success: false,
      hash: '',
      error: error.message || 'Failed to send ETH'
    };
  }
}

/**
 * Sends an ERC-20 token transfer transaction
 */
export async function sendTokenTransaction(
  pkpWallet: PKPEthersWallet,
  tokenDetails: TokenDetails,
  amount: ethers.BigNumber,
  recipientAddress: string,
  senderAddress: string
): Promise<TransactionResult> {
  try {
    const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
    
    // Get current gas price
    const gasPrice = await provider.getGasPrice();
    
    // Check if token balance is sufficient
    if (amount.gt(tokenDetails.rawBalance)) {
      return {
        success: false,
        hash: '',
        error: 'Insufficient token balance'
      };
    }
    
    // Create a contract instance for the token
    const tokenContract = new ethers.Contract(
      tokenDetails.address,
      ERC20_ABI,
      provider
    );
    
    // Estimate gas for the token transfer
    let gasLimit;
    try {
      // Create a contract with signer
      const tokenWithSigner = tokenContract.connect(pkpWallet as unknown as ethers.Signer);
      
      // Estimate gas for the transfer
      const estimatedGas = await tokenWithSigner.estimateGas.transfer(
        recipientAddress,
        amount
      );
      
      // Add 50% buffer to estimated gas for token transfers
      gasLimit = estimatedGas.mul(110).div(100);
      console.log('Estimated gas for token transfer:', gasLimit.toString());
    } catch (err) {
      console.warn('Failed to estimate gas for token transfer, using default:', err);
      // Default gas limit for ERC-20 transfers (higher than ETH transfers)
      gasLimit = ethers.BigNumber.from(100000);
    }
    
    // Prepare data for token transfer
    const data = tokenContract.interface.encodeFunctionData(
      'transfer',
      [recipientAddress, amount]
    );
    
    // Configure token transaction
    const txOptions = {
      to: tokenDetails.address, // Token contract address
      value: 0,  // No ETH is being sent
      data: data, // ERC-20 transfer function call
      gasLimit: gasLimit,
      gasPrice: gasPrice
    };
    
    // Check if we have enough ETH to pay for gas
    const ethBalance = await provider.getBalance(senderAddress);
    const gasCost = gasLimit.mul(gasPrice);
    
    if (ethBalance.lt(gasCost)) {
      return {
        success: false,
        hash: '',
        error: `Insufficient ETH for gas fees. Need ${ethers.utils.formatEther(gasCost)} ETH for gas.`
      };
    }
    
    // Send the token transaction
    const tx = await pkpWallet.sendTransaction(txOptions);
    
    // Wait for the transaction to be mined with 1 confirmation
    const receipt = await provider.waitForTransaction(tx.hash, 1);
    
    return {
      success: receipt.status === 1,
      hash: tx.hash,
      receipt
    };
  } catch (error: any) {
    console.error('Error sending token transaction:', error);
    return {
      success: false,
      hash: '',
      error: error.message || 'Failed to send token'
    };
  }
}

/**
 * Formats a transaction hash for display
 */
export function formatTxHash(hash: string): string {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...`;
}

/**
 * Parses an amount string with the correct number of decimals
 */
export function parseTokenAmount(amount: string, decimals: number): ethers.BigNumber {
  return ethers.utils.parseUnits(amount, decimals);
} 