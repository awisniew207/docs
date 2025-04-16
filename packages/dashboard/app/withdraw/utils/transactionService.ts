import { ethers } from 'ethers';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

const BASE_MAINNET_RPC = process.env.NEXT_PUBLIC_BASE_MAINNET_RPC;

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
    const provider = new ethers.providers.JsonRpcProvider(BASE_MAINNET_RPC);
    
    const gasPrice = await provider.getGasPrice();
    
    let gasLimit;
    try {
      const estimateTransaction = {
        from: await pkpWallet.getAddress(),
        to: recipientAddress,
        value: amount
      };
      
      // 10% buffer
      const estimatedGas = await provider.estimateGas(estimateTransaction);
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
    
    const gasCost = gasLimit.mul(gasPrice);
    const totalCost = amount.add(gasCost);
    
    if (totalCost.gt(tokenBalance)) {
      const maxPossible = tokenBalance.sub(gasCost);
      const humanReadable = ethers.utils.formatEther(maxPossible);
      
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