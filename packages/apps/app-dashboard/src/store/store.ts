import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { reactClient } from '@lit-protocol/vincent-registry-sdk';

const { vincentApiClientReact, setBaseQueryFn }: any = reactClient;

// Configure the base query function
setBaseQueryFn(fetchBaseQuery({ baseUrl: `https://staging.registry.heyvincent.ai` }));

export const store = configureStore({
  reducer: {
    vincentApi: (vincentApiClientReact as any).reducer,
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat((vincentApiClientReact as any).middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
