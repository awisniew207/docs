import { ethers, providers } from 'ethers';

// Use local Hardhat node in tests, otherwise use the production RPC
const useLocalHardhat = process.env.USE_LOCAL_HARDHAT === 'true';
const hardhatUrl = process.env.HARDHAT_URL || 'http://localhost:8545';
const prodUrl = 'https://yellowstone-rpc.litprotocol.com';

const provider = new providers.JsonRpcProvider(useLocalHardhat ? hardhatUrl : prodUrl);

// In test environment with local Hardhat, use the first account which has funds
// Otherwise create a random wallet
let wallet: ethers.Wallet;
if (useLocalHardhat) {
  // This is one of the default accounts that Hardhat creates with funds
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  wallet = new ethers.Wallet(privateKey);
  console.log('Using local Hardhat node with test account');
} else {
  wallet = ethers.Wallet.createRandom();
}

export const ethersSigner = wallet.connect(provider);
