import { ethers } from "ethers";

import { getAddressesByChainId, getEthUsdPrice, getUniswapQuote } from ".";

export const getTokenAmountInUsd = async (
    userRpcProvider: ethers.providers.JsonRpcProvider,
    userChainId: string,
    amountIn: string,
    tokenInAddress: string,
    tokenInDecimals: string,
) => {
    const { WETH_ADDRESS } = getAddressesByChainId(userChainId);

    console.log(`Getting ${amountIn.toString()} ${tokenInAddress} price in WETH from Uniswap...`);
    const { bestQuote } = await getUniswapQuote(
        userRpcProvider,
        userChainId,
        tokenInAddress,
        WETH_ADDRESS!,
        amountIn,
        tokenInDecimals,
        '18' // WETH decimals
    );
    const amountInWeth = bestQuote;
    console.log(`Amount in WETH: ${ethers.utils.formatUnits(amountInWeth, 18)}`);

    // Get ETH price in USD from Chainlink on Ethereum mainnet
    const ethUsdPrice = await getEthUsdPrice();
    console.log(`ETH price in USD (8 decimals): ${ethUsdPrice.toString()}`);

    // Calculate USD value (8 decimals precision)
    const CHAINLINK_DECIMALS = 8;
    const WETH_DECIMALS = 18; // WETH decimals
    const amountInUsd = amountInWeth.mul(ethUsdPrice).div(ethers.BigNumber.from(10).pow(WETH_DECIMALS));
    console.log(`Token amount in USD (8 decimals): $${ethers.utils.formatUnits(amountInUsd, CHAINLINK_DECIMALS)}`);

    return amountInUsd;
};