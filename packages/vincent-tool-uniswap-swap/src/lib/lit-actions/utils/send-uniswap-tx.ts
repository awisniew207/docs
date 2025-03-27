import { ethers } from 'ethers';

import { getAddressesByChainId, getUniswapQuote, signTx } from '.';

const estimateGasForSwap = async (
    uniswapV3RouterContract: ethers.Contract,
    tokenInAddress: string,
    tokenOutAddress: string,
    uniswapV3PoolFee: number,
    pkpEthAddress: string,
    amountInSmallestUnit: ethers.BigNumber,
    amountOutMin: ethers.BigNumber
) => {
    let estimatedGas = await uniswapV3RouterContract.estimateGas.exactInputSingle(
        [
            tokenInAddress,
            tokenOutAddress,
            uniswapV3PoolFee,
            pkpEthAddress,
            amountInSmallestUnit,
            amountOutMin,
            0
        ],
        { from: pkpEthAddress }
    );

    // Add 10% buffer to estimated gas
    estimatedGas = estimatedGas.mul(110).div(100);

    // Get current gas data
    const [block, gasPrice] = await Promise.all([
        uniswapV3RouterContract.provider.getBlock('latest'),
        uniswapV3RouterContract.provider.getGasPrice()
    ]);

    // Use a more conservative max fee per gas calculation
    const baseFeePerGas = block.baseFeePerGas || gasPrice;
    const maxFeePerGas = baseFeePerGas.mul(150).div(100); // 1.5x base fee
    const maxPriorityFeePerGas = gasPrice.div(10); // 0.1x gas price

    return {
        estimatedGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
    };
}

export const sendUniswapTx = async (
    userRpcProvider: ethers.providers.JsonRpcProvider,
    userChainId: string,
    tokenInAddress: string,
    tokenOutAddress: string,
    amountIn: string,
    tokenInDecimals: string,
    tokenOutDecimals: string,
    pkpEthAddress: string,
    pkpPubKey: string,
) => {
    const { UNISWAP_V3_ROUTER } = getAddressesByChainId(userChainId);

    // Convert amountIn to token's smallest unit using input token's decimals
    const amountInSmallestUnit = ethers.utils.parseUnits(amountIn, tokenInDecimals);

    const uniswapV3RouterContract = new ethers.Contract(
        UNISWAP_V3_ROUTER!,
        ['function exactInputSingle((address,address,uint24,address,uint256,uint256,uint160)) external payable returns (uint256)'],
        userRpcProvider
    );

    console.log('Getting Uniswap quote for swap...');
    const { bestFee, amountOutMin } = await getUniswapQuote(
        userRpcProvider,
        userChainId,
        tokenInAddress,
        tokenOutAddress,
        amountIn,
        tokenInDecimals,
        tokenOutDecimals
    );

    console.log('Estimating gas for Swap transaction...');
    const estimatedGasSwapStringified = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'send swap tx gas estimation' },
        async () => {
            const { estimatedGas, maxFeePerGas, maxPriorityFeePerGas } = await estimateGasForSwap(
                uniswapV3RouterContract,
                tokenInAddress,
                tokenOutAddress,
                bestFee,
                pkpEthAddress,
                amountInSmallestUnit,
                amountOutMin
            );

            return JSON.stringify({
                estimatedGas: estimatedGas.toString(),
                maxFeePerGas: maxFeePerGas.toString(),
                maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
            });
        }
    );

    const estimatedGasSwapObject = JSON.parse(estimatedGasSwapStringified);
    const estimatedGasSwap = ethers.BigNumber.from(estimatedGasSwapObject.estimatedGas);
    const maxFeePerGasSwap = ethers.BigNumber.from(estimatedGasSwapObject.maxFeePerGas);
    const maxPriorityFeePerGasSwap = ethers.BigNumber.from(estimatedGasSwapObject.maxPriorityFeePerGas);

    console.log(`Encoding swap transaction data...`);
    const swapTxData = uniswapV3RouterContract.interface.encodeFunctionData('exactInputSingle', [
        [
            tokenInAddress,
            tokenOutAddress,
            bestFee,
            pkpEthAddress,
            amountInSmallestUnit,
            amountOutMin,
            0,
        ],
    ]);

    console.log(`Getting nonce for swap transaction...`);
    const nonceForSwapTxString = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'get nonce for swap tx' },
        async () => {
            return (await userRpcProvider.getTransactionCount(pkpEthAddress)).toString();
        }
    );
    const nonceForSwapTx = ethers.BigNumber.from(nonceForSwapTxString);

    console.log(`Creating swap transaction object...`);
    const swapTx = {
        to: UNISWAP_V3_ROUTER!,
        data: swapTxData,
        value: ethers.BigNumber.from(0),
        gasLimit: estimatedGasSwap,
        maxFeePerGas: maxFeePerGasSwap,
        maxPriorityFeePerGas: maxPriorityFeePerGasSwap,
        nonce: nonceForSwapTx.toNumber(),
        chainId: ethers.BigNumber.from(userChainId).toNumber(),
        type: 2,
    };

    console.log(`Signing swap transaction...`);
    const signedSwapTx = await signTx(pkpPubKey, swapTx, 'spendingLimitSig');

    console.log(`Broadcasting swap transaction...`);
    const swapTxHash = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'swapTxSender' },
        async () => {
            const receipt = await userRpcProvider.sendTransaction(signedSwapTx);
            return receipt.hash;
        }
    );

    console.log(`Swap transaction hash: ${swapTxHash}`);

    return swapTxHash;
}