import { ethers } from 'ethers';
import { getBestQuote } from './get-best-quote';
import { getEthPriceInUsd } from './get-eth-price-in-usd';
import { getUniswapQuoterRouter } from './get-uniswap-quoter-router';

export const calculateUsdValue = async (
    provider: ethers.providers.JsonRpcProvider,
    tokenIn: string,
    amountIn: ethers.BigNumber,
    chainId: string
): Promise<ethers.BigNumber> => {
    const { WETH_ADDRESS } = getUniswapQuoterRouter(chainId);

    // Get token price in WETH from Uniswap
    console.log(`Getting ${amountIn.toString()} ${tokenIn} price in WETH from Uniswap...`);
    const { bestQuote } = await getBestQuote(
        provider,
        chainId,
        tokenIn,
        WETH_ADDRESS,
        amountIn,
        18 // WETH decimals
    );
    const amountInWeth = bestQuote;
    console.log(`Amount in WETH: ${ethers.utils.formatUnits(amountInWeth, 18)}`);

    // Get ETH price in USD from Chainlink on Ethereum mainnet
    const ethUsdPrice = await getEthPriceInUsd();
    console.log(`ETH price in USD (8 decimals): ${ethUsdPrice.toString()}`);

    // Calculate USD value (8 decimals precision)
    const CHAINLINK_DECIMALS = 8;
    const TOKEN_DECIMALS = 18; // WETH decimals
    const amountInUsd = amountInWeth.mul(ethUsdPrice).div(ethers.BigNumber.from(10).pow(TOKEN_DECIMALS));
    console.log(`Token amount in USD (8 decimals): $${ethers.utils.formatUnits(amountInUsd, CHAINLINK_DECIMALS)}`);

    return amountInUsd;
}; 