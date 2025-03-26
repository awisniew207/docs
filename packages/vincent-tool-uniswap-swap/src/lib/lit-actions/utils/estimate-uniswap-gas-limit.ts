import { ethers } from 'ethers';

export const estimateUniswapGasLimit = async (
    provider: ethers.providers.JsonRpcProvider,
    pkpEthAddress: string,
    uniswapV3Router: string,
    tokenInContract: ethers.Contract,
    amount: ethers.BigNumber,
    isApproval: boolean,
    swaptoolParams?: {
        fee: number;
        amountOutMin: ethers.BigNumber;
        tokenOut: string;
    }
): Promise<{
    estimatedGas: ethers.BigNumber;
    maxFeePerGas: ethers.BigNumber;
    maxPriorityFeePerGas: ethers.BigNumber;
    nonce: number;
}> => {
    console.log(`Estimating gas limit for ${isApproval ? 'approval' : 'swap'} transaction...`);

    let estimatedGas;
    if (isApproval) {
        estimatedGas = await tokenInContract.estimateGas.approve(
            uniswapV3Router,
            amount,
            { from: pkpEthAddress }
        );
    } else if (swaptoolParams) {
        const routerInterface = new ethers.utils.Interface([
            'function exactInputSingle((address,address,uint24,address,uint256,uint256,uint160)) external payable returns (uint256)',
        ]);

        const routerContract = new ethers.Contract(
            uniswapV3Router,
            routerInterface,
            provider
        );

        estimatedGas = await routerContract.estimateGas.exactInputSingle(
            [
                tokenInContract.address,
                swaptoolParams.tokenOut,
                swaptoolParams.fee,
                pkpEthAddress,
                amount,
                swaptoolParams.amountOutMin,
                0
            ],
            { from: pkpEthAddress }
        );
    } else {
        throw new Error('Missing swap parameters for gas estimation');
    }

    // Add 10% buffer to estimated gas
    estimatedGas = estimatedGas.mul(110).div(100);

    // Get current gas data
    const [block, gasPrice] = await Promise.all([
        provider.getBlock('latest'),
        provider.getGasPrice()
    ]);

    // Use a more conservative max fee per gas calculation
    const baseFeePerGas = block.baseFeePerGas || gasPrice;
    const maxFeePerGas = baseFeePerGas.mul(150).div(100); // 1.5x base fee
    const maxPriorityFeePerGas = gasPrice.div(10); // 0.1x gas price

    const nonce = await provider.getTransactionCount(pkpEthAddress);

    return {
        estimatedGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce
    };
}; 