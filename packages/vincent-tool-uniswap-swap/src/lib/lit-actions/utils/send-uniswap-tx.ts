// @ts-nocheck
import { ethers } from 'ethers';

import { getAddressesByChainId, getUniswapQuote, signTx } from '.';

const estimateGasForApproval = async (
    tokenInContract: ethers.Contract,
    uniswapV3RouterAddress: string,
    amountInSmallestUnit: ethers.BigNumber,
    pkpEthAddress: string,
) => {
    let estimatedGas = await tokenInContract.estimateGas.approve(
        uniswapV3RouterAddress,
        amountInSmallestUnit,
        { from: pkpEthAddress }
    );

    // Add 10% buffer to estimated gas
    estimatedGas = estimatedGas.mul(110).div(100);

    // Get current gas data
    const [block, gasPrice] = await Promise.all([
        tokenInContract.provider.getBlock('latest'),
        tokenInContract.provider.getGasPrice()
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
    // let { estimatedGas, maxFeePerGas, maxPriorityFeePerGas } = await estimateGasForApproval(
    //     tokenInContract,
    //     UNISWAP_V3_ROUTER!,
    //     amountInSmallestUnit,
    //     pkpEthAddress
    // );

    // console.log(`Encoding approval transaction data...`);
    // const approvalTxData = tokenInContract.interface.encodeFunctionData('approve', [
    //     UNISWAP_V3_ROUTER!,
    //     amountInSmallestUnit,
    // ]);

    // console.log(`Creating approval transaction object...`);
    // const approvalTx = {
    //     to: tokenInAddress,
    //     data: approvalTxData,
    //     value: ethers.BigNumber.from(0),
    //     gasLimit: estimatedGas,
    //     maxFeePerGas,
    //     maxPriorityFeePerGas,
    //     nonce: await userRpcProvider.getTransactionCount(pkpEthAddress),
    //     chainId: ethers.BigNumber.from(userChainId).toNumber(),
    //     type: 2,
    // };

    // console.log(`Signing approval transaction...`);
    // const signedSpendTx = await signTx(pkpPubKey, approvalTx, 'spendingLimitSig');

    // console.log(`Broadcasting approval transaction...`);
    // const approvalTxHash = Lit.Actions.runOnce(
    //     { waitForResponse: true, name: 'approvalTxSender' },
    //     async () => {
    //         const receipt = await userRpcProvider.sendTransaction(signedSpendTx);
    //         return receipt.hash;
    //     }
    // );

    // console.log(`Approval transaction hash: ${approvalTxHash}`);

    // console.log('Waiting for approval transaction confirmation...');
    // const approvalConfirmation = await userRpcProvider.waitForTransaction(
    //     approvalTxHash,
    //     1
    // );
    // if (approvalConfirmation.status === 0) {
    //     throw new Error('Approval transaction failed');
    // }

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
    const { estimatedGas, maxFeePerGas, maxPriorityFeePerGas } = await estimateGasForSwap(
        uniswapV3RouterContract,
        tokenInAddress,
        tokenOutAddress,
        bestFee,
        pkpEthAddress,
        amountInSmallestUnit,
        amountOutMin
    );

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

    console.log(`Creating swap transaction object...`);
    const swapTx = {
        to: UNISWAP_V3_ROUTER!,
        data: swapTxData,
        value: ethers.BigNumber.from(0),
        gasLimit: estimatedGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce: await userRpcProvider.getTransactionCount(pkpEthAddress),
        chainId: ethers.BigNumber.from(userChainId).toNumber(),
        type: 2,
    };

    console.log(`Signing swap transaction...`);
    const signedSwapTx = await signTx(pkpPubKey, swapTx, 'spendingLimitSig');

    console.log(`Broadcasting swap transaction...`);
    const swapTxHash = Lit.Actions.runOnce(
        { waitForResponse: true, name: 'swapTxSender' },
        async () => {
            const receipt = await userRpcProvider.sendTransaction(signedSwapTx);
            return receipt.hash;
        }
    );

    console.log(`Swap transaction hash: ${swapTxHash}`);

    return { approvalTxHash: '0x0', swapTxHash };
}