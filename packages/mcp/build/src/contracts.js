'use strict';
/**
 * Contract interaction utilities for Vincent MCP
 *
 * This module provides utilities for interacting with the Vincent Diamond contract
 * on the Lit Network. It includes constants, contract ABIs, and functions for
 * fetching data from the contract.
 *
 * @module contracts
 * @category Vincent MCP
 */
const __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.FACET_ABIS = exports.VINCENT_DIAMOND_ADDRESS = exports.rpc = void 0;
exports.fetchDelegatedAgentPKPTokenIds = fetchDelegatedAgentPKPTokenIds;
const constants_1 = require('@lit-protocol/constants');
const ethers_1 = require('ethers');
const VincentAppViewFacet_abi_json_1 = __importDefault(
  require('./abis/VincentAppViewFacet.abi.json'),
);
const env_1 = require('./env');
/**
 * RPC endpoint for interacting with the Lit Network Contracts in Yellowstone
 */
exports.rpc = constants_1.LIT_RPC.CHRONICLE_YELLOWSTONE;
const { VINCENT_DATIL_CONTRACT } = env_1.env;
/**
 * Mapping of network to Vincent Diamond contract address
 * Used to interact with the correct contract based on the network
 */
exports.VINCENT_DIAMOND_ADDRESS = {
  datil: VINCENT_DATIL_CONTRACT,
};
/**
 * ABIs for different facets of the Vincent Diamond contract
 * Each facet provides specific functionality of the contract
 */
exports.FACET_ABIS = {
  AppView: VincentAppViewFacet_abi_json_1.default,
};
/**
 * Get a contract instance for a specific facet of the Vincent Diamond
 * @param network The network to connect to
 * @param facet The contract facet to use
 * @returns A contract instance for the specified facet
 */
function getContract(network, facet) {
  const abi = exports.FACET_ABIS[facet];
  const provider = new ethers_1.ethers.providers.JsonRpcProvider(exports.rpc);
  return new ethers_1.ethers.Contract(exports.VINCENT_DIAMOND_ADDRESS[network], abi, provider);
}
/**
 * Fetches the delegated agent PKP token IDs for a specific app version
 *
 * This function queries the Vincent AppView contract to get the PKP token IDs
 * that have delegated to a specific app version. These token IDs can be used
 * to identify the PKPs that are authorized to act as agents for the app.
 *
 * @param appId - The ID of the Vincent application
 * @param version - The version number of the application
 * @returns An array of BigNumber representing the delegated agent PKP token IDs
 *
 * @example
 * ```typescript
 * const tokenIds = await fetchDelegatedAgentPKPTokenIds(123, 1);
 * console.log(`App has ${tokenIds.length} delegated agent PKPs`);
 * ```
 */
async function fetchDelegatedAgentPKPTokenIds(appId, version) {
  const contract = getContract(constants_1.LIT_NETWORK.Datil, 'AppView');
  const appView = await contract.getAppVersion(appId, version);
  return appView.appVersion.delegatedAgentPkpTokenIds;
}
