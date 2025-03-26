/**
 * Gets the ETH/USD price from Chainlink on Ethereum mainnet.
 * @param {JsonRpcProvider} provider - The Ethereum mainnet provider.
 * @returns {Promise<ethers.BigNumber>} The ETH/USD price with 8 decimals precision.
 */
export const getEthPriceInUsd = async (): Promise<any> => {
    const provider = new ethers.providers.JsonRpcProvider(
        await Lit.Actions.getRpcUrl({ chain: 'ethereum' })
    );

    // ETH/USD Price Feed on Ethereum mainnet
    const ETH_USD_FEED = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';

    const CHAINLINK_AGGREGATOR_ABI = [
        'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
    ];

    const aggregator = new ethers.Contract(ETH_USD_FEED, CHAINLINK_AGGREGATOR_ABI, provider);
    const roundData = await aggregator.latestRoundData();
    const price = ethers.BigNumber.from(roundData.answer);

    return price;
}; 