#!/usr/bin/env node
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

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import { VincentAppDefSchema } from '@lit-protocol/vincent-mcp-sdk';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import cors from 'cors';
import { ethers } from 'ethers';
import express, { Request, Response } from 'express';

import {
  authenticateWithSiwe,
  getSiweMessageToAuthenticate,
  authenticateWithJwt,
} from './authentication';
import { env } from './env';
import { getServer } from './server';
import { transportManager } from './transportManager';

const { PORT, VINCENT_APP_JSON_DEFINITION, VINCENT_DELEGATEE_PRIVATE_KEY } = env;

const YELLOWSTONE = LIT_EVM_CHAINS.yellowstone;

const vincentAppJson = fs.readFileSync(VINCENT_APP_JSON_DEFINITION, { encoding: 'utf8' });
const vincentAppDef = VincentAppDefSchema.parse(JSON.parse(vincentAppJson));

const delegateeSigner = new ethers.Wallet(
  VINCENT_DELEGATEE_PRIVATE_KEY,
  new ethers.providers.StaticJsonRpcProvider(YELLOWSTONE.rpcUrls[0]),
);

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

function returnWithError(res: Response, httpStatus: number, message: string): void {
  res.status(httpStatus).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message,
    },
    id: null,
  });
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/appDef', (req, res) => {
  res.sendFile(VINCENT_APP_JSON_DEFINITION);
});

app.get('/siwe', async (req: Request, res: Response) => {
  try {
    const { address } = req.query;
    if (!address || typeof address !== 'string') {
      res.status(422).json({ error: 'Address is a required query parameters.' });
      return;
    }

    res.status(200).send({ msgToSign: getSiweMessageToAuthenticate(address) });
  } catch (error) {
    console.error('Error generating message:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/mcp', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    // Get the corresponding transport (from sessionId or create a new one if asked)
    if (sessionId && transportManager.getTransport(sessionId)) {
      // Reuse existing transport
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      transport = transportManager.getTransport(sessionId)!;
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          transportManager.addTransport(sessionId, transport);
        },
      });

      // Get all the possible authentications (Headers or Query params. Body is used for json rpc methods)
      const jwt = (req.headers['authorization']?.split(' ')[1] ||
        req.headers['x-vincent-jwt'] ||
        req.query.jwt ||
        '') as string;
      const siweSignature = (req.headers['x-siwe-signature'] ||
        req.query.signature ||
        '') as string;
      const siweB64Message = (req.headers['x-siwe-b64message'] ||
        req.query.b64message ||
        '') as string;
      const siweMessage = siweB64Message ? Buffer.from(siweB64Message, 'base64').toString() : '';

      const usingSiwe = !!`${siweMessage}${siweSignature}`;
      if (usingSiwe && jwt) {
        return returnWithError(
          res,
          401,
          'Authentication failed. Found both JWT and SIWE values. Choose one',
        );
      } else if (!usingSiwe && !jwt) {
        return returnWithError(
          res,
          401,
          'Authentication failed. Could not find JWT nor SIWE values. Choose one',
        );
      }

      // Authenticate the user
      let authenticatedAddress;
      try {
        authenticatedAddress = usingSiwe
          ? await authenticateWithSiwe(siweMessage, siweSignature)
          : authenticateWithJwt(jwt, vincentAppDef.id, vincentAppDef.version);
      } catch (e) {
        console.error(`Client authentication failed: ${(e as Error).message}`);
        return returnWithError(
          res,
          401,
          `Authentication failed. Check passed ${usingSiwe ? 'SIWE message and signature' : 'jwt'}`,
        );
      }

      // Create the MCP server and connect its transport
      try {
        const delegatorPkpEthAddress =
          authenticatedAddress !== delegateeSigner.address ? authenticatedAddress : undefined;

        const server = await getServer(vincentAppDef, {
          delegateeSigner,
          delegatorPkpEthAddress,
        });
        await server.connect(transport);
      } catch (e) {
        console.error(`Client authentication failed: ${(e as Error).message}`);
        return returnWithError(res, 500, 'Could not generate MCP Server');
      }
    } else {
      // Invalid request
      return returnWithError(res, 400, 'Bad Request: No valid session ID provided');
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    return returnWithError(res, 500, 'Internal Server Error');
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
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transportManager.getTransport(sessionId)) {
    return returnWithError(res, 400, 'Invalid or missing session ID');
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const transport = transportManager.getTransport(sessionId)!;
  await transport.handleRequest(req, res);
};
app.get('/mcp', handleSessionRequest);

// Clients are not allowed to delete their transport/session. Some never destroy it (Anthropic) and some try to use it after calling DELETE (OpenAI)
// We take their ownership in transportManager
app.delete('/mcp', async (req: Request, res: Response) => {
  return returnWithError(res, 405, 'Method not allowed');
});

app.listen(PORT, () => {
  console.log(`MCP Stateless Streamable HTTP Server listening on port ${PORT}`);
});
