import { ethers } from 'ethers';
import { estimateUniswapGasLimit } from './estimate-uniswap-gas-limit';

/**
 * Creates a transaction for approval or swap.
 * @param {ethers.providers.JsonRpcProvider} provider - The Ethereum provider.
 * @param {string} pkpEthAddress - The PKP's Ethereum address.
 * @param {string} uniswapV3Router - The Uniswap V3 router address.
 * @param {ethers.Contract} tokenInContract - The input token contract.
 * @param {ethers.BigNumber} amount - The amount of tokens to swap.
 * @param {string} chainId - The chain ID.
 * @param {boolean} isApproval - Whether the transaction is an approval or a swap.
 * @param {Object} [swaptoolParams] - Swap parameters (fee and amountOutMin).
 */
export const createUniswapSwapTx = async (
  provider: ethers.providers.JsonRpcProvider,
  pkpEthAddress: string,
  uniswapV3Router: string,
  tokenInContract: ethers.Contract,
  amount: ethers.BigNumber,
  chainId: string,
  isApproval: boolean,
  swaptoolParams?: {
    fee: number;
    amountOutMin: ethers.BigNumber;
    tokenOut: string;
  }
) => {
  console.log(`Creating ${isApproval ? 'approval' : 'swap'} transaction...`);

  const gasData = await Lit.Actions.runOnce(
    { waitForResponse: true, name: `uniswap ${isApproval ? 'approval' : 'swap'} tx gas estimation` },
    async () => {
      const { estimatedGas, maxFeePerGas, maxPriorityFeePerGas, nonce } = await estimateUniswapGasLimit(
        provider,
        pkpEthAddress,
        uniswapV3Router,
        tokenInContract,
        amount,
        isApproval,
        swaptoolParams
      );

      console.log('gas estimation output', {
        estimatedGas: estimatedGas,
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        nonce
      });

      return JSON.stringify({
        estimatedGas: estimatedGas.toString(),
        maxFeePerGas: maxFeePerGas.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
        nonce
      });
    }
  );

  console.log(`Gas estimation data: ${gasData}`);

  const parsedData = JSON.parse(gasData);
  const estimatedGas = ethers.BigNumber.from(parsedData.estimatedGas);
  const maxFeePerGas = ethers.BigNumber.from(parsedData.maxFeePerGas);
  const maxPriorityFeePerGas = ethers.BigNumber.from(parsedData.maxPriorityFeePerGas);
  const nonce = parsedData.nonce;

  let txData;
  if (isApproval) {
    const tokenInterface = new ethers.utils.Interface([
      'function approve(address spender, uint256 amount) external returns (bool)',
    ]);
    txData = tokenInterface.encodeFunctionData('approve', [
      uniswapV3Router,
      amount,
    ]);
  } else if (swaptoolParams) {
    const routerInterface = new ethers.utils.Interface([
      'function exactInputSingle((address,address,uint24,address,uint256,uint256,uint160)) external payable returns (uint256)',
    ]);
    txData = routerInterface.encodeFunctionData('exactInputSingle', [
      [
        tokenInContract.address,
        swaptoolParams.tokenOut,
        swaptoolParams.fee,
        pkpEthAddress,
        amount,
        swaptoolParams.amountOutMin,
        0,
      ],
    ]);
  } else {
    throw new Error('Missing swap parameters for transaction creation');
  }

  return {
    to: isApproval ? tokenInContract.address : uniswapV3Router,
    data: txData,
    value: '0x0',
    gasLimit: estimatedGas.toHexString(),
    maxFeePerGas: maxFeePerGas.toHexString(),
    maxPriorityFeePerGas: maxPriorityFeePerGas.toHexString(),
    nonce,
    chainId,
    type: 2,
  };
};