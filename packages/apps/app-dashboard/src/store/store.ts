import { configureStore } from '@reduxjs/toolkit';
import { vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

export const store = configureStore({
  reducer: {
    // Add the generated reducer as a specific top-level slice
    [vincentApiClient.reducerPath]: vincentApiClient.reducer,
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(vincentApiClient.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
