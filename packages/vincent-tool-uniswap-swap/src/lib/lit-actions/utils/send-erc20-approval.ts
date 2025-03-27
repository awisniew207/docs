import { ethers } from 'ethers';

import { getAddressesByChainId, signTx } from '.';

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

export const sendErc20ApprovalTx = async (
    userRpcProvider: ethers.providers.JsonRpcProvider,
    userChainId: string,
    tokenInAddress: string,
    amountIn: string,
    tokenInDecimals: string,
    pkpEthAddress: string,
    pkpPubKey: string,
) => {
    const { UNISWAP_V3_ROUTER } = getAddressesByChainId(userChainId);

    const tokenInContract = new ethers.Contract(
        tokenInAddress,
        ['function approve(address,uint256) external returns (bool)'],
        userRpcProvider
    );

    // Convert amountIn to token's smallest unit using input token's decimals
    const amountInSmallestUnit = ethers.utils.parseUnits(amountIn, tokenInDecimals);

    console.log(`Estimating gas for approval transaction...`);
    const estimatedGasApprovalStringified = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'send approval tx gas estimation' },
        async () => {
            const { estimatedGas, maxFeePerGas, maxPriorityFeePerGas } = await estimateGasForApproval(
                tokenInContract,
                UNISWAP_V3_ROUTER!,
                amountInSmallestUnit,
                pkpEthAddress
            );

            return JSON.stringify({
                estimatedGas: estimatedGas.toString(),
                maxFeePerGas: maxFeePerGas.toString(),
                maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
            });
        }
    );

    const estimatedGasApprovalObject = JSON.parse(estimatedGasApprovalStringified);
    const estimatedGasApproval = ethers.BigNumber.from(estimatedGasApprovalObject.estimatedGas);
    const maxFeePerGasApproval = ethers.BigNumber.from(estimatedGasApprovalObject.maxFeePerGas);
    const maxPriorityFeePerGasApproval = ethers.BigNumber.from(estimatedGasApprovalObject.maxPriorityFeePerGas);

    console.log(`Encoding approval transaction data...`);
    const approvalTxData = tokenInContract.interface.encodeFunctionData('approve', [
        UNISWAP_V3_ROUTER!,
        amountInSmallestUnit,
    ]);

    console.log(`Getting nonce for approval transaction...`);
    const nonceForApprovalTxString = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'get nonce for approval tx' },
        async () => {
            return (await userRpcProvider.getTransactionCount(pkpEthAddress)).toString();
        }
    );
    const nonceForApprovalTx = ethers.BigNumber.from(nonceForApprovalTxString);

    console.log(`Creating approval transaction object...`);
    const approvalTx = {
        to: tokenInAddress,
        data: approvalTxData,
        value: ethers.BigNumber.from(0),
        gasLimit: estimatedGasApproval,
        maxFeePerGas: maxFeePerGasApproval,
        maxPriorityFeePerGas: maxPriorityFeePerGasApproval,
        nonce: nonceForApprovalTx.toNumber(),
        chainId: ethers.BigNumber.from(userChainId).toNumber(),
        type: 2,
    };

    console.log(`Signing approval transaction...`);
    const signedSpendTx = await signTx(pkpPubKey, approvalTx, 'spendingLimitSig');

    console.log(`Broadcasting approval transaction...`);
    const approvalTxHash = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'approvalTxSender' },
        async () => {
            const receipt = await userRpcProvider.sendTransaction(signedSpendTx);
            return receipt.hash;
        }
    );

    console.log(`Approval transaction hash: ${approvalTxHash}`);

    return approvalTxHash;
}