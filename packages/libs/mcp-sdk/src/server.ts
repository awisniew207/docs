/**
 * Server implementation for Vincent applications using the Model Context Protocol
 *
 * This module provides functionality to create and configure an MCP server for Vincent applications.
 *
 * @module mcp/server
 * @category Vincent MCP SDK
 */

import { LIT_NETWORK } from '@lit-protocol/constants';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { utils } from '@lit-protocol/vincent-app-sdk';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Signer } from 'ethers';

import {
  buildMcpToolName,
  buildMcpParamDefinitions,
  buildMcpToolCallback,
  VincentAppDef,
  VincentAppDefSchema,
} from './definitions';

const { getDelegatorsAgentPkpInfo } = utils;

export interface DelegationMcpServerConfig {
  delegateeSigner: Signer;
  delegatorPkpEthAddress: string | undefined;
}

/**
 * Creates an MCP server for a Vincent application
 *
 * This function configures an MCP server with the tools defined in the Vincent application definition.
 * Each tool is registered with the server and configured to use the provided delegatee signer for execution.
 *
 * Check (MCP Typescript SDK docs)[https://github.com/modelcontextprotocol/typescript-sdk] for more details on MCP server definition.
 *
 * @param vincentAppDefinition - The Vincent application definition containing the tools to register
 * @param {DelegationMcpServerConfig} config - The server configuration
 * @returns A configured MCP server instance
 *
 * @example
 * ```typescript
 * import { ethers } from 'ethers';
 * import { getVincentAppServer, VincentAppDef } from '@lit-protocol/vincent-mcp-sdk';
 * import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
 *
 * // Create a signer
 * const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
 * const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);
 *
 * // Define your Vincent application
 * const appDef: VincentAppDef = {
 *   id: '8462368',
 *   version: '1',
 *   name: 'My Vincent App',
 *   description: 'A Vincent application that executes tools for its delegators',
 *   tools: {
 *     'QmIpfsCid1': {
 *       name: 'myTool',
 *       description: 'A tool that does something',
 *       parameters: [
 *         {
 *           name: 'param1',
 *           type: 'string',
 *           description: 'A parameter that is used in the tool to do something'
 *         }
 *       ]
 *     }
 *   }
 * };
 *
 * // Create the MCP server
 * const server = await getVincentAppServer(wallet, appDef);
 *
 * // Add transport to expose the server
 * const stdio = new StdioServerTransport();
 * await server.connect(stdio);
 * ```
 */
export async function getVincentAppServer(
  vincentAppDefinition: VincentAppDef,
  config: DelegationMcpServerConfig
): Promise<McpServer> {
  const { delegateeSigner, delegatorPkpEthAddress } = config;
  const _vincentAppDefinition = VincentAppDefSchema.parse(vincentAppDefinition);

  const server = new McpServer({
    name: _vincentAppDefinition.name,
    version: _vincentAppDefinition.version,
  });

  const litNodeClient = new LitNodeClient({
    debug: true,
    litNetwork: LIT_NETWORK.Datil,
  });
  await litNodeClient.connect();

  // Tool to get the delegators info
  if (!delegatorPkpEthAddress) {
    server.tool(
      buildMcpToolName(_vincentAppDefinition, 'get-delegators-info'),
      `Tool to get the delegators info for the ${_vincentAppDefinition.name} Vincent App. Info includes the PKP token ID, ETH address, and public key for each delegator.`,
      async () => {
        const appId = parseInt(_vincentAppDefinition.id, 10);
        const appVersion = parseInt(_vincentAppDefinition.version, 10);

        const delegatorsPkpInfo = await getDelegatorsAgentPkpInfo(appId, appVersion);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(delegatorsPkpInfo),
            },
          ],
        };
      }
    );
  }

  Object.entries(_vincentAppDefinition.tools).forEach(([toolIpfsCid, tool]) => {
    server.tool(
      buildMcpToolName(_vincentAppDefinition, tool.name),
      tool.description,
      buildMcpParamDefinitions(tool.parameters, !delegatorPkpEthAddress),
      buildMcpToolCallback(litNodeClient, delegateeSigner, delegatorPkpEthAddress, {
        ipfsCid: toolIpfsCid,
        ...tool,
      })
    );
  });

  return server;
}
