#!/usr/bin/env node
'use strict';
/**
 * HTTP server implementation for Vincent MCP
 *
 * This module provides an HTTP server implementation for the Model Context Protocol (MCP)
 * using Express. It creates a streamable HTTP server that can handle MCP requests
 * and maintain session state across multiple requests.
 *
 * The server loads a Vincent application definition from a JSON file and creates
 * an MCP server with extended capabilities for that application. It then exposes
 * the server via HTTP endpoints that follow the MCP protocol.
 *
 * @module http
 * @category Vincent MCP
 */
const __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const node_fs_1 = __importDefault(require('node:fs'));
const node_crypto_1 = require('node:crypto');
const vincent_sdk_1 = require('@lit-protocol/vincent-sdk');
const streamableHttp_js_1 = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const types_js_1 = require('@modelcontextprotocol/sdk/types.js');
const express_1 = __importDefault(require('express'));
const env_1 = require('./env');
const server_1 = require('./server');
const { HTTP_PORT, VINCENT_APP_JSON_DEFINITION } = env_1.env;
const { VincentAppDefSchema } = vincent_sdk_1.mcp;
const vincentAppJson = node_fs_1.default.readFileSync(VINCENT_APP_JSON_DEFINITION, {
  encoding: 'utf8',
});
const vincentAppDef = VincentAppDefSchema.parse(JSON.parse(vincentAppJson));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// In-memory store for transports
const transports = {};
app.post('/mcp', async (req, res) => {
  try {
    const sessionId = req.headers['mcp-session-id'];
    let transport;
    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else if (!sessionId && (0, types_js_1.isInitializeRequest)(req.body)) {
      // New initialization request
      transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
        sessionIdGenerator: () => (0, node_crypto_1.randomUUID)(),
        onsessioninitialized: (sessionId) => {
          transports[sessionId] = transport;
        },
      });
      // Cleanup transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
        }
      };
      const server = (0, server_1.getServer)(vincentAppDef);
      await server.connect(transport);
    } else {
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }
    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Internal Server Error',
      },
      id: null,
    });
  }
});
/**
 * Handles GET and DELETE requests for MCP sessions
 *
 * This function processes requests that require an existing session,
 * such as GET requests for streaming responses or DELETE requests to
 * terminate a session. It validates the session ID and delegates the
 * request handling to the appropriate transport.
 *
 * @param req - The Express request object
 * @param res - The Express response object
 * @internal
 */
const handleSessionRequest = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};
app.get('/mcp', handleSessionRequest);
app.delete('/mcp', handleSessionRequest);
app.listen(HTTP_PORT, () => {
  console.log(`MCP Stateless Streamable HTTP Server listening on port ${HTTP_PORT}`);
});
