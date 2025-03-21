import { Account, createWalletClient, http, WalletClient } from 'viem';
import {
  vincentMainnetNetworkContext,
} from '../../datil-mainnet/vincentContext';

// @deprecated - use createVincentNetworkContext instead
export const vincentNetworkContext = vincentMainnetNetworkContext;
export type VincentNetworkContext = typeof vincentNetworkContext;

export const createVincentNetworkContext = ({
  account,
  network,
}: {
  account: Account;
  network: 'datil' | 'datil-test' | 'datil-dev';
}) => {

  let networkContext = {} as typeof vincentNetworkContext;

  if(network === 'datil') {
    networkContext = vincentMainnetNetworkContext;
  } else if(network === 'datil-test') {
    // networkContext = vincentTestnetNetworkContext;
    throw new Error('datil-test network not implemented');
  } else if(network === 'datil-dev') {
    // networkContext = vincentDevnetNetworkContext;
    throw new Error('datil-dev network not implemented');
  }

  const walletClient = createWalletClient({
    account,
    chain: networkContext.chainConfig.chain,
    transport: http(networkContext.rpcUrl),
  });

  networkContext.walletClient = walletClient;

  return networkContext
};