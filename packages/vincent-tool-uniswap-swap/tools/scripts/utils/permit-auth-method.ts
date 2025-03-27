import { ethers } from 'ethers';
import { LIT_NETWORK, AUTH_METHOD_SCOPE } from "@lit-protocol/constants";
import { LitContracts } from "@lit-protocol/contracts-sdk";

const YELLOWSTONE_RPC_URL = 'https://yellowstone-rpc.litprotocol.com/';

export const permitAuthMethod = async (
    pkpOwnerPrivateKey: string,
    pkpTokenId: string,
    vincentToolIpfsCid: string,
    vincentPolicyIpfsCid: string,
    litNetwork: string = 'datil'
) => {
    const provider = new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL);
    const pkpOwnerWallet = new ethers.Wallet(pkpOwnerPrivateKey as string, provider);

    const litContractClient = new LitContracts({
        signer: pkpOwnerWallet,
        network: LIT_NETWORK[litNetwork as keyof typeof LIT_NETWORK] || LIT_NETWORK.Datil,
    });
    await litContractClient.connect();

    console.log(`Adding permitted auth method for tool: ${vincentToolIpfsCid}`);
    await litContractClient.addPermittedAction({
        pkpTokenId,
        ipfsId: vincentToolIpfsCid,
        authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
    });

    console.log(`Adding permitted auth method for policy: ${vincentPolicyIpfsCid}`);
    await litContractClient.addPermittedAction({
        pkpTokenId,
        ipfsId: vincentPolicyIpfsCid,
        authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
    })
}