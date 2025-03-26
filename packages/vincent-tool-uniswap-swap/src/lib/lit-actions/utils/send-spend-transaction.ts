import { getSpendingLimitContract, estimateSpendGasLimit, signTx, broadcastTransaction } from '.';

export const sendSpendTransaction = async (
    spendingLimitAddress: string,
    pkpEthAddress: string,
    pkpPubKey: string,
    appId: string,
    // @ts-expect-error ethers is not defined in the global scope
    amountInUsd: ethers.BigNumber,
    // @ts-expect-error ethers is not defined in the global scope
    maxSpendingLimit: ethers.BigNumber,
    // @ts-expect-error ethers is not defined in the global scope
    spendingLimitDuration: ethers.BigNumber,
): Promise<string> => {
    const spendingLimitContract = await getSpendingLimitContract(spendingLimitAddress);

    const gasData = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'send spend tx gas estimation' },
        async () => {
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
            return JSON.stringify({
                estimatedGas: estimatedGas.toString(),
                maxFeePerGas: maxFeePerGas.toString(),
                maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
                nonce
            });
        }
    );

    const parsedData = JSON.parse(gasData);
    const estimatedGas = ethers.BigNumber.from(parsedData.estimatedGas);
    const maxFeePerGas = ethers.BigNumber.from(parsedData.maxFeePerGas);
    const maxPriorityFeePerGas = ethers.BigNumber.from(parsedData.maxPriorityFeePerGas);
    const nonce = parsedData.nonce;

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

    console.log(`Unsigned spend transaction: ${JSON.stringify(spendTx)}`);

    const signedSpendTx = await signTx(pkpPubKey, spendTx, 'spendingLimitSig');
    const spendHash = await broadcastTransaction(new ethers.providers.JsonRpcProvider(
        await Lit.Actions.getRpcUrl({
            chain: 'yellowstone',
        })
    ), signedSpendTx);

    return spendHash;
}; 