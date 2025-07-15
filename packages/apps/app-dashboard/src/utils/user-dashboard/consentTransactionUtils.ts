import { ethers } from 'ethers';
import { JsonRpcProvider as V6JsonRpcProvider } from 'ethers-v6';
import { estimateGasWithBuffer } from '@/services/contract/config';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { AUTH_METHOD_SCOPE, LIT_RPC } from '@lit-protocol/constants';
import { SELECTED_LIT_NETWORK } from './lit';
import { IPFS_POLICIES_THAT_NEED_SIGNING } from '@/config/policyConstants';
import { hexToBase58 } from './consentVerificationUtils';

/**
 * Handles sending a transaction with proper error handling
 * @param contract The contract to interact with
 * @param methodName The contract method to call
 * @param args The arguments to pass to the method
 * @param statusMessage Status message to display while sending the transaction
 * @param statusCallback Optional callback for status updates
 * @param errorCallback Optional callback for error handling
 * @returns The transaction response
 */
export const sendTransaction = async (
  contract: any,
  methodName: string,
  args: any[],
  statusMessage: string,
  statusCallback?: (message: string, type: 'info' | 'warning' | 'success' | 'error') => void,
) => {
  try {
    statusCallback?.('Estimating transaction gas fees...', 'info');
    const gasLimit = await estimateGasWithBuffer(contract, methodName, args);

    const provider = contract.provider;
    const gasEstimationProvider = new V6JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE);
    const feeData = await gasEstimationProvider.getFeeData();

    const txOptions: any = {
      gasLimit,
    };

    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      txOptions.type = 2;
      txOptions.maxFeePerGas = feeData.maxFeePerGas;
      txOptions.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    } else if (feeData.gasPrice) {
      txOptions.gasPrice = feeData.gasPrice;
    } else {
      const gasPrice = await provider.getGasPrice();
      txOptions.gasPrice = gasPrice;
    }

    statusCallback?.(statusMessage, 'info');
    const txResponse = await contract[methodName](...args, txOptions);

    statusCallback?.(`Transaction submitted! Hash: ${txResponse.hash.substring(0, 10)}...`, 'info');

    return txResponse;
  } catch (error) {
    console.error(`TRANSACTION FAILED (${methodName}):`, error);
    statusCallback?.('Transaction failed', 'error');
    throw error;
  }
};
