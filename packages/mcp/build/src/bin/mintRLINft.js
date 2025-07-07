'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.mintCapacityCredit = mintCapacityCredit;
const ethers_1 = require('ethers');
const constants_1 = require('@lit-protocol/constants');
const contracts_sdk_1 = require('@lit-protocol/contracts-sdk');
const env_1 = require('../env');
const { VINCENT_DELEGATEE_PRIVATE_KEY } = env_1.env;
const ethersSigner = new ethers_1.ethers.Wallet(
  VINCENT_DELEGATEE_PRIVATE_KEY,
  new ethers_1.ethers.providers.StaticJsonRpcProvider(constants_1.LIT_RPC.CHRONICLE_YELLOWSTONE),
);
const litContractClient = new contracts_sdk_1.LitContracts({
  network: constants_1.LIT_NETWORK.Datil,
  signer: ethersSigner,
});
/** Mint a new capacity credit NFT */
async function mintCapacityCredit({
  daysUntilUTCMidnightExpiration = 30,
  requestsPerKilosecond = 100,
} = {}) {
  if (!litContractClient.connected) {
    await litContractClient.connect();
  }
  // Calculate expiration timestamp at UTC midnight
  const now = new Date();
  const expirationDate = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysUntilUTCMidnightExpiration,
      0,
      0,
      0,
      0,
    ),
  );
  const expiresAt = Math.floor(expirationDate.getTime() / 1000); // Convert to Unix timestamp
  const mintCost = await litContractClient.rateLimitNftContract.read.calculateCost(
    requestsPerKilosecond,
    expiresAt,
  );
  if (mintCost.gt(await litContractClient.signer.getBalance())) {
    throw new Error(
      `${await litContractClient.signer.getAddress()} has insufficient balance to mint capacity credit: ${ethers_1.ethers.utils.formatEther(await litContractClient.signer.getBalance())} < ${ethers_1.ethers.utils.formatEther(mintCost)}`,
    );
  }
  const capacityCreditInfo = await litContractClient.mintCapacityCreditsNFT({
    daysUntilUTCMidnightExpiration,
    requestsPerKilosecond,
  });
  return {
    daysUntilUTCMidnightExpiration,
    requestsPerKilosecond,
    capacityTokenId: capacityCreditInfo.capacityTokenId,
    capacityTokenIdStr: capacityCreditInfo.capacityTokenIdStr,
    mintedAtUtc: new Date().toISOString(),
  };
}
mintCapacityCredit();
