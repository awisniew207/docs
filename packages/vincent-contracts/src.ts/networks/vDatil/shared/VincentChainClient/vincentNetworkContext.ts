import { Account, createWalletClient, http } from 'viem';
import { vincentMainnetNetworkContext } from '../../datil-mainnet/vincentContext';

// TODO: We need to add more networks here
export const vincentNetworkContext = vincentMainnetNetworkContext;
// vincentTestnetNetworkContext |
// vincentDevNetworkContext;

export type VincentNetworkContext = typeof vincentNetworkContext;

/**
 * Creates a Vincent network context for interacting with the Vincent blockchain
 *
 * @param {Object} params - The parameters for creating the network context
 * @param {Account} params.account - The account to use for transactions
 * @param {string} params.network - The network to connect to ('datil', 'datil-test', or 'datil-dev')
 * @returns {VincentNetworkContext} The configured network context with wallet client
 * @throws {Error} If an unsupported network is specified
 */
export const createVincentNetworkContext = ({
  account,
  network,
}: {
  account: Account;
  network: 'datil' | 'datil-test' | 'datil-dev';
}) => {
  let networkContext = {} as VincentNetworkContext;

  if (network === 'datil') {
    networkContext = vincentMainnetNetworkContext;
  } else if (network === 'datil-test') {
    // networkContext = vincentTestnetNetworkContext;
    throw new Error('datil-test network not implemented');
  } else if (network === 'datil-dev') {
    // networkContext = vincentDevnetNetworkContext;
    throw new Error('datil-dev network not implemented');
  }

  const walletClient = createWalletClient({
    account,
    chain: networkContext.chainConfig.chain,
    transport: http(networkContext.rpcUrl),
  });

  networkContext.walletClient = walletClient;

  return networkContext;
};
