import * as ethers from 'ethers';

const BASE_RPC_URL = 'https://mainnet.base.org';
const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  rawBalance: ethers.BigNumber;
  decimals: number;
  logoUrl?: string;
}

interface AlchemyTokenBalance {
  contractAddress: string;
  tokenBalance: string;
  error?: string;
}

interface AlchemyTokenMetadata {
  decimals?: number;
  logo?: string;
  name?: string;
  symbol?: string;
}

const formatBalance = (balance: ethers.BigNumber, decimals: number): string => {
  return ethers.utils.formatUnits(balance, decimals);
};

export const fetchTokenBalances = async (ethAddress: string): Promise<TokenBalance[]> => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);

    // Check ETH balance without using Alchemy
    const ethBalance = await provider.getBalance(ethAddress);
    const tokenBalances: TokenBalance[] = [{
      address: 'ETH',
      symbol: 'ETH',
      name: 'Ethereum',
      balance: formatBalance(ethBalance, 18),
      rawBalance: ethBalance,
      decimals: 18
    }];

    // Get all token balances for the address - Specific to Base Mainnet
    const tokensResponse = await fetch(ALCHEMY_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getTokenBalances',
        params: [ethAddress]
      })
    });

    const tokensData = await tokensResponse.json();
    const tokenBalancesList = tokensData.result?.tokenBalances || [];

    const nonZeroBalances = tokenBalancesList.filter((token: AlchemyTokenBalance) => {
      if (token.error) return false;
      const balanceBN = ethers.BigNumber.from(token.tokenBalance);
      return !balanceBN.isZero();
    });

    // If we have any non-zero balances, we need to get the token metadata
    if (nonZeroBalances.length > 0) {
      const tokenDetailsPromises = nonZeroBalances.map(async (token: AlchemyTokenBalance) => {
        try {
          const metadataResponse = await fetch(ALCHEMY_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'alchemy_getTokenMetadata',
              params: [token.contractAddress]
            })
          });

          const metadataData = await metadataResponse.json();
          const metadata: AlchemyTokenMetadata = metadataData.result;

          if (!metadata || !metadata.decimals) {
            throw new Error('No metadata found for token');
          }

          const decimals = metadata.decimals;
          const rawBalance = ethers.BigNumber.from(token.tokenBalance);
          const balance = formatBalance(rawBalance, decimals);

          return {
            address: token.contractAddress,
            name: metadata.name,
            symbol: metadata.symbol,
            decimals: metadata.decimals,
            rawBalance,
            balance,
            logoUrl: metadata.logo
          };
        } catch (err) {
          console.error(`Error fetching details for token ${token.contractAddress}:`, err);
          return null;
        }
      });

      const tokenDetails = await Promise.all(tokenDetailsPromises);
      const allTokens = [...tokenBalances, ...tokenDetails];
      console.log("returning allTokens", allTokens);
      return allTokens;
    } else {
      return tokenBalances; // Just ETH balance
    }
  } catch (err: any) {
    console.error('Error fetching token balances:', err);
    throw err;
  }
};