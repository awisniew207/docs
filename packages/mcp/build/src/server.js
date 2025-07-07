'use strict';
/**
 * Server creation utilities for Vincent MCP
 *
 * This module provides functionality to create and configure an MCP server
 * for Vincent applications with extended capabilities. It uses the Vincent SDK
 * to create a base server and then extends it with additional functionality.
 *
 * @module server
 * @category Vincent MCP
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.getServer = getServer;
const constants_1 = require('@lit-protocol/constants');
const vincent_sdk_1 = require('@lit-protocol/vincent-sdk');
const ethers_1 = require('ethers');
const env_1 = require('./env');
const extensions_1 = require('./extensions');
const { VINCENT_DELEGATEE_PRIVATE_KEY } = env_1.env;
const { getVincentAppServer } = vincent_sdk_1.mcp;
/**
 * Creates an extended MCP server for a Vincent application
 *
 * This function creates an MCP server for a Vincent application and extends it
 * with additional functionality. It uses the delegatee private key from the
 * environment to create a signer that can execute Vincent tools on behalf of users.
 *
 * The server is created using the Vincent SDK's `getVincentAppServer` function
 * and then extended with additional capabilities using the `extendVincentServer` function.
 *
 * @param vincentAppDef - The Vincent application definition containing the tools to register
 * @returns A configured and extended MCP server instance
 *
 * @example
 * ```typescript
 * import { mcp } from '@lit-protocol/vincent-sdk';
 * import { getServer } from '@lit-protocol/vincent-mcp';
 * import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
 *
 * // Define your Vincent application
 * const appDef: mcp.VincentAppDef = {
 *   id: '8462368',
 *   name: 'My Vincent App',
 *   version: '1',
 *   tools: {
 *     // Your tools here
 *   }
 * };
 *
 * // Create the extended MCP server
 * const server = getServer(appDef);
 *
 * // Add transport to expose the server
 * const stdio = new StdioServerTransport();
 * await server.connect(stdio);
 * ```
 */
function getServer(vincentAppDef) {
  const delegateeSigner = new ethers_1.ethers.Wallet(
    VINCENT_DELEGATEE_PRIVATE_KEY,
    new ethers_1.ethers.providers.StaticJsonRpcProvider(
      constants_1.LIT_EVM_CHAINS.yellowstone.rpcUrls[0],
    ),
  );
  const server = getVincentAppServer(delegateeSigner, vincentAppDef);
  (0, extensions_1.extendVincentServer)(server, vincentAppDef, delegateeSigner);
  return server;
}
