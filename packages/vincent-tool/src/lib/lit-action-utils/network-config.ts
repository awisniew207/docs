/**
 * Configuration mapping for PubkeyRouter contract addresses across different Lit networks.
 * This constant provides the correct contract addresses for each supported network environment.
 * 
 * @property datil - Production network configuration with PubkeyRouter address
 */
// Network to PubkeyRouter address mapping
export const NETWORK_CONFIG = {
  datil: {
    pubkeyRouterAddress: '0xF182d6bEf16Ba77e69372dD096D8B70Bc3d5B475',
    vincentAddress: '0x456DFB72AAe179E219FEbf3f339dF412dF30313D'
  },
} as const;