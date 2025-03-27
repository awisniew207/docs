import { ethers } from 'ethers';

import { getAddressesByChainId, signTx } from '.';

const estimateGas = async (
    spendingLimitContract: ethers.Contract,
    appId: string,
    amountInUsd: ethers.BigNumber,
    maxSpendingLimit: ethers.BigNumber,
    spendingLimitDuration: ethers.BigNumber,
    pkpEthAddress: string,
) => {
    console.log(`Making gas estimation call...`);
    let estimatedGas = await spendingLimitContract.estimateGas.spend(
        appId,
        amountInUsd,
        maxSpendingLimit,
        spendingLimitDuration,
        { from: pkpEthAddress }
    );
    // Add 10% buffer to estimated gas
    estimatedGas = estimatedGas.mul(110).div(100);

    console.log('Getting block and gas price...');
    const [block, gasPrice] = await Promise.all([
        spendingLimitContract.provider.getBlock('latest'),
        spendingLimitContract.provider.getGasPrice()
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

export const sendSpendTx = async (
    yellowstoneProvider: ethers.providers.JsonRpcProvider,
    appId: string,
    amountInUsd: ethers.BigNumber,
    maxSpendingLimit: ethers.BigNumber,
    spendingLimitDuration: ethers.BigNumber,
    pkpEthAddress: string,
    pkpPubKey: string,
) => {
    const { SPENDING_LIMIT_ADDRESS } = getAddressesByChainId('175188'); // Yellowstone
    const SPENDING_LIMIT_ABI = [
        `function checkLimit(address user, uint256 appId, uint256 amountToSpend, uint256 userMaxSpendLimit, uint256 duration) view returns (bool)`,
        `function spend(uint256 appId, uint256 amount, uint256 userMaxSpendLimit, uint256 duration)`,
        `error SpendLimitExceeded(address user, uint256 appId, uint256 amount, uint256 limit)`,
        `error ZeroAppIdNotAllowed(address user)`,
        `error ZeroDurationQuery(address user)`
    ];

    console.log(`Preparing transaction to send to Spending Limit Contract: ${SPENDING_LIMIT_ADDRESS}`);

    const spendingLimitContract = new ethers.Contract(
        SPENDING_LIMIT_ADDRESS!,
        SPENDING_LIMIT_ABI,
        yellowstoneProvider
    );

    console.log(`Estimating gas for spending limit transaction...`);
    const estimatedGasStringified = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'send spend tx gas estimation' },
        async () => {
            const { estimatedGas, maxFeePerGas, maxPriorityFeePerGas } = await estimateGas(
                spendingLimitContract,
                appId,
                amountInUsd,
                maxSpendingLimit,
                spendingLimitDuration,
                pkpEthAddress
            );

            return JSON.stringify({
                estimatedGas: estimatedGas.toString(),
                maxFeePerGas: maxFeePerGas.toString(),
                maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
            });
        }
    );

    const estimatedGasObject = JSON.parse(estimatedGasStringified);
    const estimatedGas = ethers.BigNumber.from(estimatedGasObject.estimatedGas);
    const maxFeePerGas = ethers.BigNumber.from(estimatedGasObject.maxFeePerGas);
    const maxPriorityFeePerGas = ethers.BigNumber.from(estimatedGasObject.maxPriorityFeePerGas);

    console.log(`Encoding transaction data...`);
    const txData = spendingLimitContract.interface.encodeFunctionData('spend', [
        appId,
        amountInUsd,
        maxSpendingLimit,
        spendingLimitDuration,
    ]);

    console.log(`Creating transaction object...`);
    const spendTx = {
        to: SPENDING_LIMIT_ADDRESS as string,
        data: txData,
        value: ethers.BigNumber.from(0),
        gasLimit: estimatedGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce: await yellowstoneProvider.getTransactionCount(pkpEthAddress),
        chainId: 175188, // Yellowstone
        type: 2,
    };

    console.log(`Unsigned spend transaction: ${JSON.stringify(spendTx)}`);

    console.log(`Signing spend transaction...`);
    const signedSpendTx = await signTx(pkpPubKey, spendTx, 'spendingLimitSig');

    const spendTxHash = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'spendTxSender' },
        async () => {
            console.log(`Broadcasting spend transaction...`);
            const receipt = await yellowstoneProvider.sendTransaction(signedSpendTx);
            return receipt.hash;
        }
    );

    return spendTxHash;
}