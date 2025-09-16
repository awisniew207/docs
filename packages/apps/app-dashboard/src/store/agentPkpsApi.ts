import { createApi } from '@reduxjs/toolkit/query/react';
import { getAgentPkps } from '@/utils/user-dashboard/getAgentPkps';
import type { AgentPkpsResult, AgentAppPermission } from '@/utils/user-dashboard/getAgentPkps';

// Cache to avoid redundant fetching
const agentPkpsCache = new Map<string, { data: AgentPkpsResult; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 seconds cache

const fetchAgentPkpsWithCache = async (userAddress: string): Promise<AgentPkpsResult> => {
  const cached = agentPkpsCache.get(userAddress);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const result = await getAgentPkps(userAddress);
  agentPkpsCache.set(userAddress, { data: result, timestamp: now });
  return result;
};

export const agentPkpsApi = createApi({
  reducerPath: 'agentPkpsApi',
  baseQuery: async () => ({ data: null }), // Dummy base query since we only use queryFn
  tagTypes: ['AgentPkps'],
  endpoints: (builder) => ({
    getAgentPkps: builder.query<AgentPkpsResult, string>({
      queryFn: async (userAddress) => {
        try {
          const result = await fetchAgentPkpsWithCache(userAddress);
          return { data: result };
        } catch (error) {
          return {
            error: {
              status: 'FETCH_ERROR',
              error: error instanceof Error ? error.message : 'Failed to fetch agent PKPs',
            },
          };
        }
      },
      providesTags: (_, __, userAddress) => [{ type: 'AgentPkps', id: userAddress }],
    }),
    getPermittedAgentApps: builder.query<AgentAppPermission[], string>({
      queryFn: async (userAddress) => {
        try {
          const result = await fetchAgentPkpsWithCache(userAddress);
          return { data: result.permitted };
        } catch (error) {
          return {
            error: {
              status: 'FETCH_ERROR',
              error:
                error instanceof Error ? error.message : 'Failed to fetch permitted agent apps',
            },
          };
        }
      },
      providesTags: (_, __, userAddress) => [{ type: 'AgentPkps', id: `${userAddress}-permitted` }],
    }),
    getUnpermittedAgentApps: builder.query<AgentAppPermission[], string>({
      queryFn: async (userAddress) => {
        try {
          const result = await fetchAgentPkpsWithCache(userAddress);
          return { data: result.unpermitted };
        } catch (error) {
          return {
            error: {
              status: 'FETCH_ERROR',
              error:
                error instanceof Error ? error.message : 'Failed to fetch unpermitted agent apps',
            },
          };
        }
      },
      providesTags: (_, __, userAddress) => [
        { type: 'AgentPkps', id: `${userAddress}-unpermitted` },
      ],
    }),
    clearAgentPkpsCache: builder.mutation<void, string | void>({
      queryFn: (userAddress) => {
        if (userAddress) {
          agentPkpsCache.delete(userAddress);
        } else {
          agentPkpsCache.clear();
        }
        return { data: undefined };
      },
      invalidatesTags: (_, __, userAddress) =>
        userAddress ? [{ type: 'AgentPkps', id: userAddress }] : [{ type: 'AgentPkps' }],
    }),
  }),
});

export const {
  useGetAgentPkpsQuery,
  useGetPermittedAgentAppsQuery,
  useGetUnpermittedAgentAppsQuery,
  useLazyGetAgentPkpsQuery,
  useLazyGetPermittedAgentAppsQuery,
  useLazyGetUnpermittedAgentAppsQuery,
  useClearAgentPkpsCacheMutation,
} = agentPkpsApi;
