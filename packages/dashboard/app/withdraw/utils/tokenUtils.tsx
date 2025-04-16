import * as ethers from 'ethers';

const BASE_RPC_URL = 'https://mainnet.base.org';
const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  rawBalance: ethers.BigNumber;
  decimals: number;
  logoUrl?: string;
}

export interface TokenBalanceResult {
  success: boolean;
  balances: TokenBalance[];
  error?: string;
  errorDetails?: string;
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

export const fetchEthBalance = async (ethAddress: string): Promise<TokenBalanceResult> => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);

    const ethBalance = await provider.getBalance(ethAddress);
    const tokenBalance: TokenBalance = {
      address: 'ETH',
      symbol: 'ETH',
      name: 'Ethereum',
      balance: formatBalance(ethBalance, 18),
      rawBalance: ethBalance,
      decimals: 18
    };

    return {
      success: true,
      balances: [tokenBalance]
    };
  } catch (err: any) {
    console.error('Error fetching ETH balance:', err);
    return {
      success: false,
      balances: [],
    };
  }
};

export const fetchERC20TokenBalances = async (ethAddress: string): Promise<TokenBalanceResult> => {
  try {
    const tokenBalances: TokenBalance[] = [];

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

    if (!tokensResponse.ok) {
      return {
        success: false,
        balances: tokenBalances, // Return ETH balance at least
        error: 'Failed to fetch token balances from Alchemy',
        errorDetails: `Status: ${tokensResponse.status}, StatusText: ${tokensResponse.statusText}`
      };
    }

    const tokensData = await tokensResponse.json();

    if (tokensData.error) {
      return {
        success: false,
        balances: tokenBalances, // Return ETH balance at least
        error: 'Alchemy API returned an error',
        errorDetails: JSON.stringify(tokensData.error)
      };
    }

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

          if (!metadataResponse.ok) {
            console.warn(`HTTP error for token ${token.contractAddress}: ${metadataResponse.status}`);
            return null;
          }

          const metadataData = await metadataResponse.json();

          if (metadataData.error) {
            console.warn(`API error for token ${token.contractAddress}: ${JSON.stringify(metadataData.error)}`);
            return null;
          }

          const metadata: AlchemyTokenMetadata = metadataData.result;

          if (!metadata || !metadata.decimals) {
            console.warn("No metadata found for token", token.contractAddress);
            return null;
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
      const validTokenDetails = tokenDetails.filter(detail => detail !== null) as TokenBalance[];

      const allBalances = [...tokenBalances, ...validTokenDetails];

      return {
        success: true,
        balances: allBalances
      };
    } else {
      return {
        success: true,
        balances: tokenBalances // Just ETH balance
      };
    }
  } catch (err: any) {
    console.error('Error fetching token balances:', err);
    return {
      success: false,
      balances: [], // Return empty array on critical errors
      error: 'Failed to fetch token balances',
      errorDetails: err.message || String(err)
    };
  }
};