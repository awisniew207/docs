import * as ethers from 'ethers';
import { LIT_NETWORKS_KEYS } from '@lit-protocol/types';
import { datil } from '@lit-protocol/contracts';
import { env } from '@/config/env';

const { VITE_VINCENT_YELLOWSTONE_RPC } = env;

function getContractFromJsSdk(
  network: string,
  contractName: string,
  provider: ethers.providers.JsonRpcProvider,
) {
  let contractsDataRes;
  switch (network) {
    case 'datil':
      contractsDataRes = datil;
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }

  const contractList = contractsDataRes.data as any;
  const contractData = contractList.find((contract: any) => contract.name === contractName);

  if (!contractData) {
    throw new Error(`No contract found with name ${contractName}`);
  }

  const contract = contractData.contracts[0];
  return new ethers.Contract(contract.address_hash, contract.ABI, provider);
}

export function getPkpNftContract(network: LIT_NETWORKS_KEYS) {
  const provider = new ethers.providers.JsonRpcProvider(VITE_VINCENT_YELLOWSTONE_RPC);
  return getContractFromJsSdk(network, 'PKPNFT', provider);
}
