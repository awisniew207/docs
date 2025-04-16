import { ethers } from 'ethers';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

const BASE_MAINNET_RPC = process.env.NEXT_PUBLIC_BASE_MAINNET_RPC;
const ETH_MAINNET_RPC = process.env.NEXT_PUBLIC_ETH_MAINNET_RPC;

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
 * Calculates the gas costs for ETH transactions on Base network
 */
export async function calculateEthGasCosts(): Promise<{
  totalCost: ethers.BigNumber;
  gasLimit: ethers.BigNumber;
  gasPrice: ethers.BigNumber;
}> {
  const baseProvider = new ethers.providers.JsonRpcProvider(BASE_MAINNET_RPC);
  const ethProvider = new ethers.providers.JsonRpcProvider(ETH_MAINNET_RPC);

  // Get current gas prices for L1 and L2
  const l1GasPrice = await ethProvider.getGasPrice();
  const l2GasPrice = await baseProvider.getGasPrice();
  
  // Fixed gas limits
  const l1GasLimit = ethers.BigNumber.from(1600);
  const l2GasLimit = ethers.BigNumber.from(23100);
  
  // Calculate gas costs
  const l1GasCost = l1GasLimit.mul(l1GasPrice);
  const l2GasCost = l2GasLimit.mul(l2GasPrice);
  
  // Add a buffer for price fluctuations (20%)
  const buffer = l1GasCost.add(l2GasCost).mul(20).div(100);
  
  // Total gas cost includes L1 fee, L2 gas, and buffer
  const totalCost = l1GasCost.add(l2GasCost).add(buffer);
  
  return {
    totalCost,
    gasLimit: l2GasLimit,
    gasPrice: l2GasPrice
  };
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
    const provider = new ethers.providers.JsonRpcProvider(BASE_MAINNET_RPC);
    
    // Get gas info
    const gasInfo = await calculateEthGasCosts();
    
    // Check if amount is valid (the gas costs are already accounted for in handleMaxAmount)
    if (amount.gt(tokenBalance)) {
      return {
        success: false,
        hash: '',
        error: `Insufficient balance for transaction.`
      };
    }
    
    // Configure ETH transaction options
    const txOptions = {
      to: recipientAddress,
      value: amount,
      gasLimit: gasInfo.gasLimit,
      gasPrice: gasInfo.gasPrice
    };
    
    console.log('Sending ETH transaction with options:', {
      to: recipientAddress,
      value: ethers.utils.formatEther(amount) + ' ETH',
      gasLimit: txOptions.gasLimit.toString(),
      gasPrice: ethers.utils.formatUnits(gasInfo.gasPrice, 'gwei') + ' gwei',
      totalGasCost: ethers.utils.formatEther(gasInfo.totalCost) + ' ETH'
    });
    
    const tx = await pkpWallet.sendTransaction(txOptions);
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
    const provider = new ethers.providers.JsonRpcProvider(BASE_MAINNET_RPC);
    
    const gasPrice = await provider.getGasPrice();
    
    const tokenContract = new ethers.Contract(
      tokenDetails.address,
      ["function transfer(address to, uint256 amount) returns (bool)"],
      provider
    );
    
    let gasLimit;
    try {
      const tokenWithSigner = tokenContract.connect(pkpWallet as unknown as ethers.Signer);
      
      // Estimate gas for the transfe
      const estimatedGas = await tokenWithSigner.estimateGas.transfer(
        recipientAddress,
        amount
      );
      
      // Add 10% buffer to estimated gas for token transfers
      gasLimit = estimatedGas.mul(110).div(100);
      console.log('Estimated gas for token transfer:', gasLimit.toString());
    } catch (err) {
      console.warn('Failed to estimate gas for token transfer, using default:', err);
      return {
        success: false,
        hash: '',
        error: 'Failed to estimate gas for transaction'
      };
    }
    
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
    
    const ethBalance = await provider.getBalance(senderAddress);
    const gasCost = gasLimit.mul(gasPrice);
    
    if (ethBalance.lt(gasCost)) {
      return {
        success: false,
        hash: '',
        error: `Insufficient ETH for gas fees. Need ${ethers.utils.formatEther(gasCost)} ETH for gas.`
      };
    }
    
    const tx = await pkpWallet.sendTransaction(txOptions);
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