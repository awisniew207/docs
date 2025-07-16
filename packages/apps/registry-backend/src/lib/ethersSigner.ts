import { ethers, providers } from 'ethers';

const provider = new providers.JsonRpcProvider('https://yellowstone-rpc.litprotocol.com');
export const ethersSigner = ethers.Wallet.createRandom().connect(provider);
