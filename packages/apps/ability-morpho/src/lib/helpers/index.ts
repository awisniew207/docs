import { laUtils } from '@lit-protocol/vincent-scaffold-sdk';
import { ethers } from 'ethers';

import { MorphoOperation } from '../schemas';

interface PKPInfo {
  tokenId: string;
  ethAddress: string;
  publicKey: string;
}

/**
 * Supported chain IDs and their names
 */
export const SUPPORTED_CHAINS = {
  1: 'ethereum',
  8453: 'base',
  42161: 'arbitrum',
  10: 'optimism',
  137: 'polygon',
} as const;

/**
 * Chain names to IDs mapping for backwards compatibility
 */
export const CHAIN_IDS = {
  ethereum: 1,
  base: 8453,
  arbitrum: 42161,
  optimism: 10,
  polygon: 137,
} as const;

/**
 * ERC20 Token ABI - Essential methods only
 */
export const ERC20_ABI: any[] = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
];

/**
 * ERC4626 Vault ABI - Essential methods for Morpho vaults
 */
export const ERC4626_VAULT_ABI: any[] = [
  // ERC4626 is an extension of ERC20, the token represents vault shares
  ...ERC20_ABI,

  {
    inputs: [
      { internalType: 'uint256', name: 'assets', type: 'uint256' },
      { internalType: 'address', name: 'receiver', type: 'address' },
    ],
    name: 'deposit',
    outputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'shares', type: 'uint256' },
      { internalType: 'address', name: 'receiver', type: 'address' },
      { internalType: 'address', name: 'owner', type: 'address' },
    ],
    name: 'redeem',
    outputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'asset',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
    name: 'convertToShares',
    outputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
    name: 'convertToAssets',
    outputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalAssets',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

/**
 * Validate operation-specific requirements for Morpho vaults
 */
export async function validateOperationRequirements(
  operation: MorphoOperation,
  userBalance: ethers.BigNumber,
  allowance: ethers.BigNumber,
  vaultShares: ethers.BigNumber,
  amount: ethers.BigNumber,
): Promise<{ valid: boolean; error?: string }> {
  const debugParams = {
    operation,
    userBalance: userBalance.toString(),
    allowance: allowance.toString(),
    vaultShares: vaultShares.toString(),
    amount: amount.toString(),
  };

  switch (operation) {
    case MorphoOperation.APPROVE:
      // No need to check anything, the user can always approve token spending even when not having enough of them
      break;
    case MorphoOperation.DEPOSIT:
      // Check if the user has enough tokens to deposit
      if (userBalance.lt(amount)) {
        return {
          valid: false,
          error: `Insufficient balance for deposit operation. ${debugParams}`,
        };
      }
      // Check if the user has approved vault to take his tokens
      if (allowance.lt(amount)) {
        return {
          valid: false,
          error: `Insufficient allowance for deposit operation. Please approve vault to take your tokens first. ${debugParams}`,
        };
      }
      break;

    case MorphoOperation.REDEEM:
      // Check if the user can take enough vault shares
      if (vaultShares.lt(amount)) {
        return {
          valid: false,
          error: `Insufficient vault shares for redeem operation. ${debugParams}`,
        };
      }
      break;

    default:
      return { valid: false, error: `Unsupported operation: ${operation}` };
  }

  return { valid: true };
}

/**
 * Comprehensive Morpho Vault Information
 *
 * Contains all vault details including address, asset info, chain data,
 * performance metrics, and status information.
 *
 * @example
 * ```typescript
 * const vaults = await getVaults({ limit: 1 });
 * const vault = vaults[0];
 *
 * console.log(`Vault: ${vault.name}`);
 * console.log(`Asset: ${vault.asset.symbol}`);
 * console.log(`Chain: ${vault.chain.network}`);
 * console.log(`Net APY: ${vault.metrics.netApy}%`);
 * console.log(`TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`);
 * ```
 */
export interface MorphoVaultInfo {
  /** Vault contract address (0x format) */
  address: string;
  /** Human-readable vault name */
  name: string;
  /** Vault token symbol */
  symbol: string;
  /** Underlying asset information */
  asset: {
    /** Asset contract address */
    address: string;
    /** Asset symbol (e.g., "USDC", "WETH") */
    symbol: string;
    /** Full asset name */
    name: string;
    /** Token decimals */
    decimals: number;
  };
  /** Blockchain information */
  chain: {
    /** Chain ID (1=Ethereum, 8453=Base, etc.) */
    id: number;
    /** Chain name ("ethereum", "base", etc.) */
    network: string;
  };
  /** Performance and financial metrics */
  metrics: {
    /** Gross APY percentage (before fees) */
    apy: number;
    /** Net APY percentage (after fees) - most accurate for users */
    netApy: number;
    /** Total assets in vault (in token units as string) */
    totalAssets: string;
    /** Total Value Locked in USD */
    totalAssetsUsd: number;
    /** Vault fee percentage */
    fee: number;
    /** Additional reward tokens and APRs */
    rewards?: Array<{
      /** Reward token address */
      asset: string;
      /** Supply APR for this reward */
      supplyApr: number;
      /** Yearly supply tokens amount */
      yearlySupplyTokens: string;
    }>;
  };
  /** Whether vault is whitelisted by Morpho */
  whitelisted: boolean;
  /** Vault creation timestamp */
  creationTimestamp: number;
}

async function fetchVaultData<T = any>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  try {
    const response = await fetch('https://blue-api.morpho.org/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP error! status: ${response.status} and body: ${body}`);
    }

    const data: any = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL error: ${data.errors.map((e: any) => e.message).join(', ')}`);
    }

    return data.data as T;
  } catch (error) {
    console.error('Failed to fetch vault data:', error);
    throw error;
  }
}

function mapVaultData(vault: any): MorphoVaultInfo {
  return {
    address: vault.address,
    name: vault.name,
    symbol: vault.symbol,
    asset: {
      address: vault.asset.address,
      symbol: vault.asset.symbol,
      name: vault.asset.name,
      decimals: vault.asset.decimals,
    },
    chain: {
      id: vault.chain.id,
      network: vault.chain.network,
    },
    metrics: {
      apy: vault.state.apy || 0,
      netApy: vault.state.netApy || 0,
      totalAssets: vault.state.totalAssets || '0',
      totalAssetsUsd: vault.state.totalAssetsUsd || 0,
      fee: vault.state.fee || 0,
      rewards:
        vault.state.rewards?.map((reward: any) => ({
          asset: reward.asset.address,
          supplyApr: reward.supplyApr,
          yearlySupplyTokens: reward.yearlySupplyTokens,
        })) || [],
    },
    whitelisted: vault.whitelisted,
    creationTimestamp: vault.creationTimestamp,
  };
}

/**
 * Get Morpho vault details using their graphql api
 */
export async function getMorphoVaultByAddress(
  address: string,
  chainId: number,
): Promise<MorphoVaultInfo | null> {
  const query = `
      query GetVaultByAddress($address: String!, $chainId: Int!) {
        vaultByAddress(address: $address, chainId: $chainId) {
          address
          name
          symbol
          whitelisted
          creationTimestamp
          asset {
            address
            symbol
            name
            decimals
          }
          chain {
            id
            network
          }
          state {
            apy
            netApy
            totalAssets
            totalAssetsUsd
            fee
            rewards {
              asset {
                address
                symbol
              }
              supplyApr
              yearlySupplyTokens
            }
          }
        }
      }
    `;

  const variables = { address, chainId };
  const data = await fetchVaultData(query, variables);

  return data.vaultByAddress ? mapVaultData(data.vaultByAddress) : null;
}

/**
 * Generic function to execute any Morpho operation, with optional gas sponsorship
 */
export async function executeMorphoOperation({
  abi,
  args,
  alchemyGasSponsor = false,
  alchemyGasSponsorApiKey,
  alchemyGasSponsorPolicyId,
  contractAddress,
  chainId,
  functionName,
  provider,
  pkpInfo,
}: {
  abi: any[];
  alchemyGasSponsor?: boolean;
  alchemyGasSponsorApiKey?: string;
  alchemyGasSponsorPolicyId?: string;
  args: unknown[];
  chainId: number;
  contractAddress: string;
  functionName: string;
  pkpInfo: PKPInfo;
  provider?: ethers.providers.JsonRpcProvider;
}): Promise<string> {
  console.log(
    `[@lit-protocol/vincent-ability-morpho/executeMorphoOperation] Starting ${functionName} operation`,
    { sponsored: !!alchemyGasSponsor },
  );

  // Use gas sponsorship if enabled and all required parameters are provided
  if (alchemyGasSponsor && alchemyGasSponsorApiKey && alchemyGasSponsorPolicyId) {
    console.log(
      `[@lit-protocol/vincent-ability-morpho/executeMorphoOperation] Using EIP-7702 gas sponsorship`,
      { contractAddress, functionName, args, policyId: alchemyGasSponsorPolicyId },
    );

    return await laUtils.transaction.handler.sponsoredGasContractCall({
      abi,
      args,
      contractAddress,
      chainId,
      functionName,
      eip7702AlchemyApiKey: alchemyGasSponsorApiKey,
      eip7702AlchemyPolicyId: alchemyGasSponsorPolicyId,
      pkpPublicKey: pkpInfo.publicKey,
    });
  } else {
    // Use regular transaction without gas sponsorship
    console.log(
      `[@lit-protocol/vincent-ability-morpho/executeMorphoOperation] Using regular transaction`,
    );

    if (!provider) {
      throw new Error('Provider is required for non-sponsored transactions');
    }

    return await laUtils.transaction.handler.contractCall({
      abi,
      args,
      chainId,
      contractAddress,
      functionName,
      provider,
      callerAddress: pkpInfo.ethAddress,
      pkpPublicKey: pkpInfo.publicKey,
    });
  }
}
