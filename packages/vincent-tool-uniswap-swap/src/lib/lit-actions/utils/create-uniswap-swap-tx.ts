/**
 * Creates a transaction for approval or swap.
 * @param {any} gasLimit - The gas limit for the transaction.
 * @param {any} amount - The amount of tokens to swap.
 * @param {any} gasData - Gas data (maxFeePerGas, maxPriorityFeePerGas, nonce).
 * @param {boolean} isApproval - Whether the transaction is an approval or a swap.
 * @param {Object} [swaptoolParams] - Swap parameters (fee and amountOutMin).
 * @returns {any} The transaction object.
 */
export const createUniswapSwapTx = async (
  uniswapV3Router: any,
  pkpEthAddress: string,
  gasLimit: any,
  amount: any,
  gasData: any,
  isApproval: boolean,
  swaptoolParams?: {
    fee: number;
    amountOutMin: any;
  }
) => {
  console.log(`Creating transaction...`);

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
        toolParams.tokenIn,
        toolParams.tokenOut,
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
    to: isApproval ? toolParams.tokenIn : uniswapV3Router,
    data: txData,
    value: '0x0',
    gasLimit: gasLimit.toHexString(),
    maxFeePerGas: gasData.maxFeePerGas,
    maxPriorityFeePerGas: gasData.maxPriorityFeePerGas,
    nonce: gasData.nonce,
    chainId: toolParams.chainId,
    type: 2,
  };
};