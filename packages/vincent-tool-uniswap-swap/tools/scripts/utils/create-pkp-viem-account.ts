import { ethers } from 'ethers';
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK, LIT_ABILITY } from "@lit-protocol/constants";
import { LitPKPResource } from "@lit-protocol/auth-helpers";
import { EthWalletProvider } from "@lit-protocol/lit-auth-client";
import { LitContracts } from "@lit-protocol/contracts-sdk";

import { type PKPInfo } from './mint-pkp';

const YELLOWSTONE_RPC_URL = 'https://yellowstone-rpc.litprotocol.com/';

export interface CreatePKPViemAccountOptions {
    pkpOwnerPrivateKey: string;
    pkpInfo: PKPInfo;
    litNetwork?: string;
    requestsPerKilosecond?: number;
    daysUntilUTCMidnightExpiration?: number;
    sessionDurationMinutes?: number;
    debug?: boolean;
}

/**
 * Creates a viem-compatible account object using a PKP for signing
 * @param options Configuration options
 * @returns An object with address and signing methods compatible with viem
 */
export const createPkpViemAccount = async (options: CreatePKPViemAccountOptions): Promise<{
    address: string;
    signMessage: (params: { message: string | Uint8Array }) => Promise<string>;
    signTransaction: (transaction: any) => Promise<{ r: string; s: string; v: bigint }>;
    signTypedData: (typedData: any) => Promise<string>;
}> => {
    const {
        pkpOwnerPrivateKey,
        pkpInfo,
        litNetwork = 'datil',
        requestsPerKilosecond = 80,
        daysUntilUTCMidnightExpiration = 1,
        sessionDurationMinutes = 10,
        debug = false
    } = options;

    if (!pkpInfo.publicKey || !pkpInfo.tokenId || !pkpInfo.ethAddress) {
        throw new Error('PKP info not available. Please provide valid PKP information.');
    }

    // Create ethers provider and owner wallet
    const provider = new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL);
    const pkpOwnerWallet = new ethers.Wallet(pkpOwnerPrivateKey as string, provider);

    // Create a viem Account with custom signing functions
    return {
        address: pkpInfo.ethAddress,
        async signMessage({ message }) {
            let litNodeClient = new LitNodeClient({
                litNetwork: LIT_NETWORK[litNetwork as keyof typeof LIT_NETWORK] || LIT_NETWORK.Datil,
                debug,
            });
            try {
                await litNodeClient.connect();

                const litContractClient = new LitContracts({
                    signer: pkpOwnerWallet,
                    network: LIT_NETWORK[litNetwork as keyof typeof LIT_NETWORK] || LIT_NETWORK.Datil,
                });
                await litContractClient.connect();

                const capacityCreditInfo = await litContractClient.mintCapacityCreditsNFT({
                    requestsPerKilosecond,
                    daysUntilUTCMidnightExpiration,
                });

                const { capacityDelegationAuthSig } =
                    await litNodeClient.createCapacityDelegationAuthSig({
                        dAppOwnerWallet: pkpOwnerWallet,
                        capacityTokenId: (capacityCreditInfo as any).tokenId,
                        delegateeAddresses: [pkpInfo.ethAddress],
                        uses: "1",
                        expiration: new Date(Date.now() + 1000 * 60 * sessionDurationMinutes).toISOString(),
                    });

                const authMethod = await EthWalletProvider.authenticate({
                    signer: pkpOwnerWallet,
                    litNodeClient,
                });

                const pkpSessionSigs = await litNodeClient.getPkpSessionSigs({
                    pkpPublicKey: pkpInfo.publicKey,
                    chain: "ethereum",
                    authMethods: [authMethod],
                    capabilityAuthSigs: [capacityDelegationAuthSig],
                    resourceAbilityRequests: [
                        {
                            resource: new LitPKPResource('*'),
                            ability: LIT_ABILITY.PKPSigning,
                        },
                    ],
                });

                // Convert message to bytes for signing if it's a string
                const messageToSign = typeof message === 'string'
                    ? ethers.utils.arrayify(ethers.utils.hashMessage(message))
                    : message;

                // Sign the message
                const result = await litNodeClient.pkpSign({
                    pubKey: pkpInfo.publicKey,
                    sessionSigs: pkpSessionSigs,
                    toSign: messageToSign,
                });

                // Prepare the signature components
                const { r, s, recid } = result;
                // Format the signature for viem (r + s + v)
                return `0x${r}${s}${recid.toString(16).padStart(2, '0')}`;
            } catch (error) {
                console.error("Error signing message with PKP:", error);
                throw error;
            } finally {
                litNodeClient?.disconnect();
            }
        },
        async signTransaction(transaction) {
            let litNodeClient = new LitNodeClient({
                litNetwork: LIT_NETWORK[litNetwork as keyof typeof LIT_NETWORK] || LIT_NETWORK.Datil,
                debug,
            });
            try {
                await litNodeClient.connect();

                const litContractClient = new LitContracts({
                    signer: pkpOwnerWallet,
                    network: LIT_NETWORK[litNetwork as keyof typeof LIT_NETWORK] || LIT_NETWORK.Datil,
                });
                await litContractClient.connect();

                const capacityCreditInfo = await litContractClient.mintCapacityCreditsNFT({
                    requestsPerKilosecond,
                    daysUntilUTCMidnightExpiration,
                });

                const { capacityDelegationAuthSig } =
                    await litNodeClient.createCapacityDelegationAuthSig({
                        dAppOwnerWallet: pkpOwnerWallet,
                        capacityTokenId: (capacityCreditInfo as any).tokenId,
                        delegateeAddresses: [pkpInfo.ethAddress],
                        uses: "1",
                        expiration: new Date(Date.now() + 1000 * 60 * sessionDurationMinutes).toISOString(),
                    });

                const authMethod = await EthWalletProvider.authenticate({
                    signer: pkpOwnerWallet,
                    litNodeClient,
                });

                const pkpSessionSigs = await litNodeClient.getPkpSessionSigs({
                    pkpPublicKey: pkpInfo.publicKey,
                    chain: "ethereum",
                    authMethods: [authMethod],
                    capabilityAuthSigs: [capacityDelegationAuthSig],
                    resourceAbilityRequests: [
                        {
                            resource: new LitPKPResource('*'),
                            ability: LIT_ABILITY.PKPSigning,
                        },
                    ],
                });

                // Serialize the transaction to get the hash
                // Since serializeTransaction is not available, create a hash from stringified transaction
                const txHash = ethers.utils.keccak256(
                    ethers.utils.toUtf8Bytes(JSON.stringify(transaction))
                );

                // Sign the transaction hash
                const result = await litNodeClient.pkpSign({
                    pubKey: pkpInfo.publicKey,
                    sessionSigs: pkpSessionSigs,
                    toSign: ethers.utils.arrayify(txHash),
                });

                // Prepare the signature components
                const { r, s, recid } = result;
                // The v value for viem
                const v = BigInt(recid) + 27n; // Base v value

                // Return the signature fields that viem expects
                return {
                    r: `0x${r}`,
                    s: `0x${s}`,
                    v
                };
            } catch (error) {
                console.error("Error signing transaction with PKP:", error);
                throw error;
            } finally {
                litNodeClient?.disconnect();
            }
        },
        // Implement signTypedData if needed for EIP-712 signatures
        async signTypedData(typedData) {
            throw new Error('signTypedData not implemented for PKP account');
        }
    };
};



// Example usage:
/*
import { createWalletClient, http } from 'viem';
import { createPkpViemAccount, mintNewPkp } from './create-pkp-viem-account';

const main = async () => {
  // Configuration
  const rpcUrl = 'https://yellowstone-rpc.litprotocol.com/';
  const pkpOwnerPrivateKey = process.env.PKP_OWNER_PRIVATE_KEY;
  
  // Either mint a new PKP
  const pkpInfo = await mintNewPkp(pkpOwnerPrivateKey, rpcUrl);
  console.log("New PKP minted:", pkpInfo);
  
  // Or use an existing PKP
  // const pkpInfo = {
  //   publicKey: '0x...',
  //   tokenId: '123456789',
  //   ethAddress: '0x...'
  // };
  
  // Create PKP viem account
  const pkpAccount = await createPkpViemAccount({
    pkpOwnerPrivateKey,
    pkpInfo,
    rpcUrl,
    litNetwork: 'datil',
  });
  
  // Create wallet client with the PKP account
  const pkpWalletClient = createWalletClient({
    account: pkpAccount,
    transport: http(rpcUrl)
  });
  
  // Now you can use pkpWalletClient for transactions
  // This will use the PKP for signing
};

main().catch(console.error);
*/