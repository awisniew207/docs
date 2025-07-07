#!/usr/bin/env node
'use strict';
/**
 * Standard I/O server implementation for Vincent MCP
 *
 * This module provides a standard I/O (stdio) server implementation for the Model Context Protocol (MCP).
 * It creates a server that communicates through standard input and output streams, making it suitable
 * for integration with command-line tools, language models, and other processes that can communicate
 * via stdio.
 *
 * The server loads a Vincent application definition from a JSON file and creates
 * an MCP server with extended capabilities for that application. It then exposes
 * the server via stdio following the MCP protocol.
 *
 * @module stdio
 * @category Vincent MCP
 */
const __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
require('./bootstrap'); // Bootstrap console.log to a log file
const node_fs_1 = __importDefault(require('node:fs'));
const vincent_sdk_1 = require('@lit-protocol/vincent-sdk');
const stdio_js_1 = require('@modelcontextprotocol/sdk/server/stdio.js');
const env_1 = require('./env');
const server_1 = require('./server');
const { VINCENT_APP_JSON_DEFINITION } = env_1.env;
const { VincentAppDefSchema } = vincent_sdk_1.mcp;
/**
 * Main function to initialize and run the stdio MCP server
 *
 * This function performs the following steps:
 * 1. Creates a stdio transport for the MCP protocol
 * 2. Loads the Vincent application definition from a JSON file
 * 3. Creates an MCP server with extended capabilities for the application
 * 4. Connects the server to the stdio transport
 * 5. Logs a message to stderr indicating the server is running
 *
 * @internal
 */
async function main() {
  const stdioTransport = new stdio_js_1.StdioServerTransport();
  const vincentAppJson = node_fs_1.default.readFileSync(VINCENT_APP_JSON_DEFINITION, {
    encoding: 'utf8',
  });
  const vincentAppDef = VincentAppDefSchema.parse(JSON.parse(vincentAppJson));
  const server = (0, server_1.getServer)(vincentAppDef);
  await server.connect(stdioTransport);
  console.error('Vincent MCP Server running in stdio mode'); // console.log is used for messaging the parent process
}
main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
