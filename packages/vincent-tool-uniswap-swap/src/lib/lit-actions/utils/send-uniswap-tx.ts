import { ethers } from 'ethers';

import { getAddressesByChainId, signTx } from '.';

const estimateGas = async (
    tokenInContract: ethers.Contract,
    uniswapV3RouterAddress: string,
    amountIn: string,
    pkpEthAddress: string,
) => {
    let estimatedGas = await tokenInContract.estimateGas.approve(
        uniswapV3RouterAddress,
        amountIn,
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

    // const { bestFee, amountOutMin } = await getUniswapQuote(
    //     userRpcProvider,
    //     userChainId,
    //     tokenInAddress,
    //     tokenOutAddress,
    //     amountIn,
    //     tokenInDecimals,
    //     tokenOutDecimals
    // );

    const tokenInContract = new ethers.Contract(
        tokenInAddress,
        ['function approve(address,uint256) external returns (bool)'],
        userRpcProvider
    );

    console.log(`Estimating gas for Approval transaction...`);
    const { estimatedGas, maxFeePerGas, maxPriorityFeePerGas } = await estimateGas(
        tokenInContract,
        UNISWAP_V3_ROUTER!,
        amountIn,
        pkpEthAddress
    );

    console.log(`Encoding Approval transaction data...`);
    const txData = tokenInContract.interface.encodeFunctionData('approve', [
        UNISWAP_V3_ROUTER!,
        amountIn,
    ]);

    console.log(`Creating Approval transaction object...`);
    const approvalTx = {
        to: tokenInAddress,
        data: txData,
        value: ethers.BigNumber.from(0),
        gasLimit: estimatedGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce: await userRpcProvider.getTransactionCount(pkpEthAddress),
        chainId: ethers.BigNumber.from(userChainId).toNumber(),
        type: 2,
    };

    console.log(`Signing Approval transaction...`);
    const signedSpendTx = await signTx(pkpPubKey, approvalTx, 'spendingLimitSig');

    const approvalTxHash = Lit.Actions.runOnce(
        { waitForResponse: true, name: 'approvalTxSender' },
        async () => {
            console.log(`Broadcasting Approval transaction...`);
            const receipt = await userRpcProvider.sendTransaction(signedSpendTx);
            return receipt.hash;
        }
    );

    return { approvalTxHash };
}