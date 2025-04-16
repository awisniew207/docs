import * as ethers from 'ethers';
import Moralis from 'moralis';

const BASE_RPC_URL = 'https://mainnet.base.org';
const BASE_CHAIN_ID = '0x2105';

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
    await Moralis.start({
      apiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY
    });

    const response = await Moralis.EvmApi.token.getWalletTokenBalances({
      chain: BASE_CHAIN_ID,
      address: ethAddress
    });

    if (!response || !response.raw) {
      return {
        success: false,
        balances: [],
        error: 'Failed to fetch token balances from Moralis',
        errorDetails: 'No response data'
      };
    }

    const validTokenBalances = response.raw.map(token => {
      try {
        const rawBalance = ethers.BigNumber.from(token.balance);
        const decimals = token.decimals || 0;
        const formattedBalance = formatBalance(rawBalance, decimals);
        
        return {
          address: token.token_address,
          symbol: token.symbol || 'Unknown',
          name: token.name || 'Unknown Token',
          balance: formattedBalance,
          rawBalance: rawBalance,
          decimals: decimals,
          logoUrl: token.logo || undefined
        };
      } catch (err) {
        console.warn(`Error processing token ${token.token_address}:`, err);
        return null;
      }
    }).filter(token => token !== null) as TokenBalance[];

    return {
      success: true,
      balances: validTokenBalances
    };
  } catch (err: any) {
    console.error('Error fetching token balances:', err);
    return {
      success: false,
      balances: [],
      error: 'Failed to fetch token balances',
      errorDetails: err.message || String(err)
    };
  }
};