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

interface SendTransactionWithRetryParams {
  pkpWallet: PKPEthersWallet;
  txOptions: ethers.providers.TransactionRequest;
  provider: ethers.providers.JsonRpcProvider;
  initialGasPrice: ethers.BigNumber;
}

interface SendEthTransactionParams {
  pkpWallet: PKPEthersWallet;
  amount: ethers.BigNumber;
  recipientAddress: string;
  tokenBalance: ethers.BigNumber;
}

interface SendTokenTransactionParams {
  pkpWallet: PKPEthersWallet;
  tokenDetails: TokenDetails;
  amount: ethers.BigNumber;
  recipientAddress: string;
  senderAddress: string;
}

/**
 * Helper function to send a transaction with automatic retry on "replacement fee too low" error
 */
async function sendTransactionWithRetry({
  pkpWallet,
  txOptions,
  provider,
  initialGasPrice
}: SendTransactionWithRetryParams): Promise<TransactionResult> {
  try {
    const tx = await pkpWallet.sendTransaction(txOptions);
    const receipt = await provider.waitForTransaction(tx.hash, 1);

    return {
      success: receipt.status === 1,
      hash: tx.hash,
      receipt
    };
  } catch (error: any) {
    if (error.message && error.message.includes('replacement fee too low')) {
      console.log('Encountered replacement fee too low error. Retrying with 2x gas price...');

      // Double gas for retry
      txOptions.gasPrice = initialGasPrice.mul(2);

      console.log('Retrying with increased gas price:', ethers.utils.formatUnits(txOptions.gasPrice, 'gwei') + ' gwei');

      const retryTx = await pkpWallet.sendTransaction(txOptions);
      const retryReceipt = await provider.waitForTransaction(retryTx.hash, 1);

      return {
        success: retryReceipt.status === 1,
        hash: retryTx.hash,
        receipt: retryReceipt
      };
    } else if (error.message && error.message.includes('insufficient funds for intrinsic transaction cost')) {
      return {
        success: false,
        hash: '',
        error: 'Insufficient funds for transaction. Please add more ETH to your wallet.'
      };
    }

    return {
      success: false,
      hash: '',
      error: error.message || 'Failed to send transaction'
    };
  }
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
  const buffer = l1GasCost.add(l2GasCost).mul(50).div(100);
  
  // Total gas cost includes L1 fee, L2 gas, and buffer
  const totalCost = l1GasCost.add(l2GasCost).add(buffer);
  
  const fixedBuffer = ethers.utils.parseEther('0.000001'); // 0.000001 ETH additional buffer
  const finalCost = totalCost.add(fixedBuffer);
  
  return {
    totalCost: finalCost,
    gasLimit: l2GasLimit,
    gasPrice: l2GasPrice
  };
}

/**
 * Sends an ETH transfer transaction
 */
export async function sendEthTransaction({
  pkpWallet,
  amount,
  recipientAddress,
  tokenBalance
}: SendEthTransactionParams): Promise<TransactionResult> {
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

    if (amount.lt(gasInfo.totalCost)) {
      return {
        success: false,
        hash: '',
        error: `Insufficient balance for gas fees.`
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

    return await sendTransactionWithRetry({
      pkpWallet,
      txOptions,
      provider,
      initialGasPrice: gasInfo.gasPrice
    });
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
export async function sendTokenTransaction({
  pkpWallet,
  tokenDetails,
  amount,
  recipientAddress,
  senderAddress
}: SendTokenTransactionParams): Promise<TransactionResult> {
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

    return await sendTransactionWithRetry({
      pkpWallet,
      txOptions,
      provider,
      initialGasPrice: gasPrice
    });
  } catch (error: any) {
    console.error('Error sending token transaction:', error);
    return {
      success: false,
      hash: '',
      error: error.message || 'Failed to send token'
    };
  }
}