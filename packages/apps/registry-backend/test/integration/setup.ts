import { configureStore } from '@reduxjs/toolkit';
import { nodeClient } from '@lit-protocol/vincent-registry-sdk';
import { fetchBaseQuery, setupListeners } from '@reduxjs/toolkit/query';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { SiweMessage } from 'siwe';
import { Wallet } from 'ethers';

const { vincentApiClientNode, setBaseQueryFn } = nodeClient;

// Generate a secure random nonce
const generateNonce = () => {
  const array = new Uint8Array(16);
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

// Create a wrapper function that adds authentication headers to mutation requests
const withSiweAuth = (baseQuery: BaseQueryFn): BaseQueryFn => {
  return async (args, api, extraOptions) => {
    // Check if this is a mutation request (has a method other than GET or undefined)
    const isMutation =
      args && typeof args === 'object' && 'method' in args && args.method && args.method !== 'GET';

    // If it's a mutation, add the SIWE authentication header
    if (isMutation) {
      // Create a test wallet for signing
      // In a real application, this would be the user's wallet
      const wallet = new Wallet(
        '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      );

      // Create a SIWE message
      const domain = 'localhost';
      const statement = 'Sign in with Ethereum to authenticate with Vincent Registry API';
      const nonce = generateNonce();
      const siweMessage = new SiweMessage({
        domain,
        address: wallet.address,
        statement,
        uri: `http://localhost:${process.env.PORT || 3000}`,
        version: '1',
        chainId: 1,
        nonce,
        issuedAt: new Date().toISOString(),
      });

      // Prepare the message for signing
      const message = siweMessage.prepareMessage();

      // Sign the message
      const signature = await wallet.signMessage(message);

      // Format the Authorization header value - Base64 encode the payload
      const payload = JSON.stringify({ message, signature });
      const base64Payload = Buffer.from(payload).toString('base64');
      const authHeader = `SIWE ${base64Payload}`;

      // Add the authorization header to the request
      args = {
        ...args,
        headers: {
          ...args.headers,
          authorization: authHeader,
        },
      };
    }

    // Pass the request to the original fetchBaseQuery function
    return baseQuery(args, api, extraOptions);
  };
};

// FIXME: Identify port from jest-process-manager
setBaseQueryFn(
  withSiweAuth(fetchBaseQuery({ baseUrl: `http://localhost:${process.env.PORT || 3000}` })),
);

export { vincentApiClientNode };
export const api = vincentApiClientNode;

// Create a store with the API reducer
export const store = configureStore({
  reducer: {
    [vincentApiClientNode.reducerPath]: vincentApiClientNode.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(vincentApiClientNode.middleware),
});

setupListeners(store.dispatch);
