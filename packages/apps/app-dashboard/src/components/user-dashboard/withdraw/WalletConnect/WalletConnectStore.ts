import { create } from 'zustand';
import { IWalletKit } from '@reown/walletkit';

/**
 * State and actions to track WalletConnect client and sessions
 */
interface WalletConnectState {
  ready: boolean;
  client: IWalletKit | undefined;
  sessions: any[];
  currentWalletAddress: string | null;
  accountSessions: Record<string, any[]>;
  actions: {
    setClient: (client: IWalletKit) => void;
    refreshSessions: () => void;
    setCurrentWalletAddress: (address: string | null) => void;
    clearSessionsForAddress: (address: string | null) => Promise<void>;
  };
}

const useWalletConnectStore = create<WalletConnectState>()((set, get) => ({
  ready: false,
  client: undefined,
  sessions: [],
  currentWalletAddress: null,
  accountSessions: {},
  actions: {
    setClient: (client: IWalletKit) =>
      set((state) => {
        const allSessions = Object.values(client.getActiveSessions() || {});
        const { currentWalletAddress, accountSessions } = state;

        const updatedAccountSessions = { ...accountSessions };
        if (currentWalletAddress) {
          updatedAccountSessions[currentWalletAddress] = allSessions;
        }

        return {
          client,
          ready: true,
          sessions: currentWalletAddress
            ? updatedAccountSessions[currentWalletAddress] || []
            : allSessions,
          accountSessions: updatedAccountSessions,
        };
      }),
    refreshSessions: () =>
      set((state) => {
        if (!state.client) return { sessions: [] };

        // Always use client as single source of truth
        const allSessions = Object.values(state.client.getActiveSessions() || {});

        return {
          sessions: allSessions,
          // Clear account sessions - use client as single source of truth
          accountSessions: {},
        };
      }),
    setCurrentWalletAddress: (address: string | null) =>
      set((state) => {
        if (!state.client) return { currentWalletAddress: address, sessions: [] };

        // Always use client as single source of truth
        const allSessions = Object.values(state.client.getActiveSessions() || {});

        return {
          currentWalletAddress: address,
          sessions: allSessions,
          // Clear account sessions - use client as single source of truth
          accountSessions: {},
        };
      }),
    clearSessionsForAddress: async (address: string | null) => {
      if (!address) return;

      const state = get();
      if (!state.client) return;

      // Disconnect all active sessions since we no longer store per-address
      const allSessions = Object.values(state.client.getActiveSessions() || {});
      console.log(`Clearing ${allSessions.length} active sessions for address change`);

      for (const session of allSessions) {
        if (session && session.topic) {
          try {
            console.log(`Disconnecting session ${session.topic} for address change`);
            await state.client.disconnectSession({
              topic: session.topic,
              reason: {
                code: 6000,
                message: 'Wallet changed',
              },
            });
          } catch (error) {
            console.error(`Failed to disconnect session ${session.topic}:`, error);
          }
        }
      }

      // Refresh sessions from client
      get().actions.refreshSessions();
    },
  },
}));

export const getWalletConnectSessions = (): any[] => {
  return useWalletConnectStore.getState().sessions;
};

export const getWalletConnectActions = () => {
  return useWalletConnectStore.getState().actions;
};

export const getCurrentWalletAddress = (): string | null => {
  return useWalletConnectStore.getState().currentWalletAddress;
};

export const useWalletConnectClient = () => useWalletConnectStore((state) => state.client);
export const useWalletConnectSessions = () => useWalletConnectStore((state) => state.sessions);
export const useWalletConnectStoreActions = () => useWalletConnectStore((state) => state.actions);
export const useCurrentWalletAddress = () =>
  useWalletConnectStore((state) => state.currentWalletAddress);

export default useWalletConnectStore;
