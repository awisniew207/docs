import { configureStore } from '@reduxjs/toolkit';
import { nodeClient } from '@lit-protocol/vincent-registry-sdk';
import { fetchBaseQuery, setupListeners } from '@reduxjs/toolkit/query';

const { vincentApiClientNode, setBaseQueryFn } = nodeClient;

// FIXME: Identify port from jest-process-manager
setBaseQueryFn(fetchBaseQuery({ baseUrl: `http://localhost:${process.env.PORT || 3000}` }));

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
