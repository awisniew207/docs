import { ethers } from 'ethers';

import { signTx } from './sign-tx';
import { getGasParams } from './get-gas-params';

declare const Lit: {
  Actions: {
    runOnce: (
      params: {
        waitForResponse: boolean;
        name: string;
      },
      callback: () => Promise<string>,
    ) => Promise<string>;
  };
};

interface PartialSwapTx {
  to: string;
  data: string;
  nonce: number;
  gasLimit: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

interface BaseUnsignedSwapTx {
  to: string;
  data: string;
  value: ethers.BigNumber;
  gasLimit: ethers.BigNumber;
  chainId: number;
  nonce: number;
}

interface Eip1559UnsignedSwapTx extends BaseUnsignedSwapTx {
  type: 2;
  maxFeePerGas: ethers.BigNumber;
  maxPriorityFeePerGas: ethers.BigNumber;
}

interface LegacyUnsignedSwapTx extends BaseUnsignedSwapTx {
  gasPrice: ethers.BigNumber;
}

type UnsignedSwapTx = Eip1559UnsignedSwapTx | LegacyUnsignedSwapTx;

export const sendUniswapTx = async ({
  rpcUrl,
  chainId,
  pkpEthAddress,
  pkpPublicKey,
  uniswapTxData,
  transactionOptions,
}: {
  rpcUrl: string;
  chainId: number;
  pkpEthAddress: string;
  pkpPublicKey: string;
  transactionOptions?: {
    gasLimitBuffer?: number;
    headroomMultiplier?: number;
  };
  uniswapTxData: {
    to: string;
    calldata: string;
    estimatedGasUsed: string;
  };
}): Promise<string> => {
  console.log('Estimating gas for Swap transaction using pre-computed route (sendUniswapTx)');

  const uniswapRpcProvider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);

  const partialSwapTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'Uniswap swap tx gas estimation with pre-computed route' },
    async () => {
      try {
        console.log('Using pre-computed Uniswap route for swap (sendUniswapTx)');

        // Use getGasParams helper which handles block/feeData fetching and applies 50% buffer
        const gasParams = await getGasParams({
          rpcUrl,
          estimatedGas: uniswapTxData.estimatedGasUsed,
          gasLimitBuffer: transactionOptions?.gasLimitBuffer,
          headroomMultiplier: transactionOptions?.headroomMultiplier,
        });

        const partialSwapTx: PartialSwapTx = {
          to: uniswapTxData.to,
          data: uniswapTxData.calldata,
          nonce: await uniswapRpcProvider.getTransactionCount(pkpEthAddress),
          gasLimit: gasParams.estimatedGas,
        };

        if ('gasPrice' in gasParams) {
          partialSwapTx.gasPrice = gasParams.gasPrice;

          console.log('[sendUniswapTx] partialSwapTx with legacy gas price:', {
            ...partialSwapTx,
            gasPrice: `${ethers.utils.formatUnits(gasParams.gasPrice, 'gwei')} gwei`,
          });
        } else {
          partialSwapTx.maxFeePerGas = gasParams.maxFeePerGas;
          partialSwapTx.maxPriorityFeePerGas = gasParams.maxPriorityFeePerGas;

          console.log('[sendUniswapTx] partialSwapTx with EIP-1559 gas params:', {
            ...partialSwapTx,
            maxFeePerGas: `${ethers.utils.formatUnits(gasParams.maxFeePerGas, 'gwei')} gwei`,
            maxPriorityFeePerGas: `${ethers.utils.formatUnits(gasParams.maxPriorityFeePerGas, 'gwei')} gwei`,
          });
        }

        return JSON.stringify({
          status: 'success',
          partialSwapTx,
        });
      } catch (error) {
        return JSON.stringify({
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  const parsedPartialSwapTxResponse = JSON.parse(partialSwapTxResponse);
  if (parsedPartialSwapTxResponse.status === 'error') {
    throw new Error(
      `Error getting transaction data for swap: ${parsedPartialSwapTxResponse.error} (sendUniswapTx)`,
    );
  }
  const { partialSwapTx }: { partialSwapTx: PartialSwapTx } = parsedPartialSwapTxResponse;

  const baseUnsignedSwapTx: BaseUnsignedSwapTx = {
    to: partialSwapTx.to,
    data: partialSwapTx.data,
    value: ethers.BigNumber.from(0),
    gasLimit: ethers.BigNumber.from(partialSwapTx.gasLimit),
    nonce: partialSwapTx.nonce,
    chainId,
  };

  let unsignedSwapTx: UnsignedSwapTx;
  if ('gasPrice' in partialSwapTx) {
    unsignedSwapTx = {
      ...baseUnsignedSwapTx,
      gasPrice: ethers.BigNumber.from(partialSwapTx.gasPrice),
    };
    console.log('[sendUniswapTx] unsignedSwapTx with legacy gas price:', {
      ...unsignedSwapTx,
      gasPrice: `${ethers.utils.formatUnits(unsignedSwapTx.gasPrice, 'gwei')} gwei`,
    });
  } else {
    unsignedSwapTx = {
      ...baseUnsignedSwapTx,
      type: 2,
      maxFeePerGas: ethers.BigNumber.from(partialSwapTx.maxFeePerGas),
      maxPriorityFeePerGas: ethers.BigNumber.from(partialSwapTx.maxPriorityFeePerGas),
    };
    console.log('[sendUniswapTx] unsignedSwapTx with EIP-1559 gas params:', {
      ...unsignedSwapTx,
      maxFeePerGas: `${ethers.utils.formatUnits(unsignedSwapTx.maxFeePerGas, 'gwei')} gwei`,
      maxPriorityFeePerGas: `${ethers.utils.formatUnits(unsignedSwapTx.maxPriorityFeePerGas, 'gwei')} gwei`,
    });
  }

  const signedSwapTx = await signTx(pkpPublicKey, unsignedSwapTx, 'uniswapSwapSig');

  console.log(`Broadcasting swap transaction with pre-computed route (sendUniswapTx)`);
  const swapTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'swapTxSender' },
    async () => {
      try {
        const receipt = await uniswapRpcProvider.sendTransaction(signedSwapTx);
        return JSON.stringify({
          status: 'success',
          txHash: receipt.hash,
        });
      } catch (error) {
        return JSON.stringify({
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  const parsedSwapTxResponse = JSON.parse(swapTxResponse);
  if (parsedSwapTxResponse.status === 'error') {
    throw new Error(
      `Error broadcasting swap transaction: ${parsedSwapTxResponse.error} (sendUniswapTx)`,
    );
  }
  const { txHash } = parsedSwapTxResponse;
  console.log(`Swap transaction broadcasted with pre-computed route (sendUniswapTx): ${txHash}`);

  return txHash;
};
