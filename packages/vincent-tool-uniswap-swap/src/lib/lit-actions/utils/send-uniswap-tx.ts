import { ethers } from 'ethers';

import { getAddressesByChainId, getUniswapQuote, signTx } from '.';

// const estimateGasForApproval = async (
//     tokenInContract: ethers.Contract,
//     uniswapV3RouterAddress: string,
//     amountInSmallestUnit: ethers.BigNumber,
//     pkpEthAddress: string,
// ) => {
//     let estimatedGas = await tokenInContract.estimateGas.approve(
//         uniswapV3RouterAddress,
//         amountInSmallestUnit,
//         { from: pkpEthAddress }
//     );

//     // Add 10% buffer to estimated gas
//     estimatedGas = estimatedGas.mul(110).div(100);

//     // Get current gas data
//     const [block, gasPrice] = await Promise.all([
//         tokenInContract.provider.getBlock('latest'),
//         tokenInContract.provider.getGasPrice()
//     ]);

//     // Use a more conservative max fee per gas calculation
//     const baseFeePerGas = block.baseFeePerGas || gasPrice;
//     const maxFeePerGas = baseFeePerGas.mul(150).div(100); // 1.5x base fee
//     const maxPriorityFeePerGas = gasPrice.div(10); // 0.1x gas price

//     return {
//         estimatedGas,
//         maxFeePerGas,
//         maxPriorityFeePerGas,
//     };
// }

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

    // const tokenInContract = new ethers.Contract(
    //     tokenInAddress,
    //     ['function approve(address,uint256) external returns (bool)'],
    //     userRpcProvider
    // );

    // Convert amountIn to token's smallest unit using input token's decimals
    const amountInSmallestUnit = ethers.utils.parseUnits(amountIn, tokenInDecimals);

    // console.log(`Estimating gas for approval transaction...`);
    // const estimatedGasApprovalStringified = await Lit.Actions.runOnce(
    //     { waitForResponse: true, name: 'send approval tx gas estimation' },
    //     async () => {
    //         const { estimatedGas, maxFeePerGas, maxPriorityFeePerGas } = await estimateGasForApproval(
    //             tokenInContract,
    //             UNISWAP_V3_ROUTER!,
    //             amountInSmallestUnit,
    //             pkpEthAddress
    //         );

    //         return JSON.stringify({
    //             estimatedGas: estimatedGas.toString(),
    //             maxFeePerGas: maxFeePerGas.toString(),
    //             maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    //         });
    //     }
    // );

    // const estimatedGasApprovalObject = JSON.parse(estimatedGasApprovalStringified);
    // const estimatedGasApproval = ethers.BigNumber.from(estimatedGasApprovalObject.estimatedGas);
    // const maxFeePerGasApproval = ethers.BigNumber.from(estimatedGasApprovalObject.maxFeePerGas);
    // const maxPriorityFeePerGasApproval = ethers.BigNumber.from(estimatedGasApprovalObject.maxPriorityFeePerGas);

    // console.log(`Encoding approval transaction data...`);
    // const approvalTxData = tokenInContract.interface.encodeFunctionData('approve', [
    //     UNISWAP_V3_ROUTER!,
    //     amountInSmallestUnit,
    // ]);

    // console.log(`Getting nonce for approval transaction...`);
    // const nonceForApprovalTxString = await Lit.Actions.runOnce(
    //     { waitForResponse: true, name: 'get nonce for approval tx' },
    //     async () => {
    //         return (await userRpcProvider.getTransactionCount(pkpEthAddress)).toString();
    //     }
    // );
    // const nonceForApprovalTx = ethers.BigNumber.from(nonceForApprovalTxString);

    // console.log(`Creating approval transaction object...`);
    // const approvalTx = {
    //     to: tokenInAddress,
    //     data: approvalTxData,
    //     value: ethers.BigNumber.from(0),
    //     gasLimit: estimatedGasApproval,
    //     maxFeePerGas: maxFeePerGasApproval,
    //     maxPriorityFeePerGas: maxPriorityFeePerGasApproval,
    //     nonce: nonceForApprovalTx,
    //     chainId: ethers.BigNumber.from(userChainId).toNumber(),
    //     type: 2,
    // };

    // console.log(`Signing approval transaction...`);
    // const signedSpendTx = await signTx(pkpPubKey, approvalTx, 'spendingLimitSig');

    // console.log(`Broadcasting approval transaction...`);
    // const approvalTxHash = await Lit.Actions.runOnce(
    //     { waitForResponse: true, name: 'approvalTxSender' },
    //     async () => {
    //         const receipt = await userRpcProvider.sendTransaction(signedSpendTx);
    //         return receipt.hash;
    //     }
    // );

    // console.log(`Approval transaction hash: ${approvalTxHash}`);

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