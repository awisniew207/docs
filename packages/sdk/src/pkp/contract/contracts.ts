import { ethers } from 'ethers';

// Contract addresses
export const VINCENT_DIAMOND_ADDRESS = {
  'datil-dev': '0x9397B2fB3F5bb83382cEb2c17C798Bb3e655EEaf',
  'datil-test': '0x2C94F3975af4B7e13C29701EFB8E800b4b786E3a',
  datil: '0x523E2944795Ae3C8d9D292335389dc33E954e9Bc',
} as const;

export type Network = keyof typeof VINCENT_DIAMOND_ADDRESS;

// Import all ABIs - you'll need to import these from your files
import APP_VIEW_FACET_ABI from './abis/VincentAppViewFacet.abi.json';
import APP_FACET_ABI from './abis/VincentAppFacet.abi.json';
import TOOL_FACET_ABI from './abis/VincentToolFacet.abi.json';
import TOOL_VIEW_FACET_ABI from './abis/VincentToolViewFacet.abi.json';
import USER_FACET_ABI from './abis/VincentUserFacet.abi.json';
import USER_VIEW_FACET_ABI from './abis/VincentUserViewFacet.abi.json';

// Define contract types
export type ContractFacet = 
  | 'AppView' 
  | 'App' 
  | 'ToolView' 
  | 'Tool' 
  | 'UserView' 
  | 'User';

// Map contract types to their ABIs
export const FACET_ABIS = {
  AppView: APP_VIEW_FACET_ABI,
  App: APP_FACET_ABI,
  ToolView: TOOL_VIEW_FACET_ABI,
  Tool: TOOL_FACET_ABI,
  UserView: USER_VIEW_FACET_ABI,
  User: USER_FACET_ABI,
};

export const rpc = 'yellowstone-rpc.litprotocol.com';

/**
 * Get a contract instance for a specific facet of the Vincent Diamond
 * @param network The network to connect to
 * @param facet The contract facet to use
 * @param isSigner Whether to use a signer (for transactions) or provider (for read-only)
 * @returns A contract instance for the specified facet
 */
export async function getContract(network: Network, facet: ContractFacet, isSigner: boolean = false) {
  const abi = FACET_ABIS[facet];
  
  if (isSigner) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    return new ethers.Contract(VINCENT_DIAMOND_ADDRESS[network], abi, signer);
  } else {
    const provider = new ethers.providers.JsonRpcProvider(rpc);
    return new ethers.Contract(VINCENT_DIAMOND_ADDRESS[network], abi, provider);
  }
}

/**
 * Example usage:
 * 
 * // Get a read-only AppView facet contract
 * const appViewContract = await getContract('datil', 'AppView');
 * const appCount = await appViewContract.getTotalAppCount();
 * 
 * // Get a writable App facet contract for transactions
 * const appContract = await getContract('datil', 'App', true);
 * const tx = await appContract.registerApp('My App', 'Description');
 */