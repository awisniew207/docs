import { ethers } from 'ethers';

import { getSpendingLimitContract, estimateSpendGasLimit, signTx, broadcastTransaction } from '.';

export const sendSpendTransaction = async (
    spendingLimitAddress: string,
    pkpEthAddress: string,
    pkpPubKey: string,
    appId: string,
    amountInUsd: ethers.BigNumber,
    maxSpendingLimit: ethers.BigNumber,
    spendingLimitDuration: ethers.BigNumber,
): Promise<string> => {
    const spendingLimitContract = await getSpendingLimitContract(spendingLimitAddress);

    const { estimatedGas, maxFeePerGas, maxPriorityFeePerGas, nonce } = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'gasEstimation' },
        async () => {
            console.log('GAS ESTIMATION INPUTS', spendingLimitAddress,
                pkpEthAddress,
                appId,
                amountInUsd,
                maxSpendingLimit,
                spendingLimitDuration)

            const { estimatedGas, maxFeePerGas, maxPriorityFeePerGas, nonce } = await estimateSpendGasLimit(
                spendingLimitAddress,
                pkpEthAddress,
                appId,
                amountInUsd,
                maxSpendingLimit,
                spendingLimitDuration,
                new ethers.providers.JsonRpcProvider(
                    await Lit.Actions.getRpcUrl({
                        chain: 'yellowstone',
                    })
                )
            )
            return { estimatedGas, maxFeePerGas, maxPriorityFeePerGas, nonce }
        }
    );

    console.log(`Estimated gas: ${estimatedGas.toString()}`);
    console.log(`Max fee per gas: ${maxFeePerGas.toString()}`);
    console.log(`Max priority fee per gas: ${maxPriorityFeePerGas.toString()}`);
    console.log(`Nonce: ${nonce.toString()}`);

    const txData = spendingLimitContract.interface.encodeFunctionData('spend', [
        appId,
        amountInUsd,
        maxSpendingLimit,
        spendingLimitDuration,
    ]);

    const spendTx = {
        to: spendingLimitAddress,
        data: txData,
        value: '0x0',
        gasLimit: estimatedGas.toHexString(),
        maxFeePerGas: maxFeePerGas.toHexString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas.toHexString(),
        nonce,
        chainId: 175188, // Yellowstone
        type: 2,
    };

    console.log(`Unsigned spend transaction: ${spendTx}`);

    const signedSpendTx = await signTx(pkpPubKey, spendTx, 'spendingLimitSig');
    const spendHash = await broadcastTransaction(new ethers.providers.JsonRpcProvider(
        await Lit.Actions.getRpcUrl({
            chain: 'yellowstone',
        })
    ), signedSpendTx);
    console.log('Spend transaction hash:', spendHash);

    return spendHash;
}; 