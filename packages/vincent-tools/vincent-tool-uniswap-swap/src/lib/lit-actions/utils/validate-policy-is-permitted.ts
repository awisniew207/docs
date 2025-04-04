import { getUserToolPolicies } from '@lit-protocol/vincent-tool';
import { ethers } from 'ethers';

export const validatePolicyIsPermitted = async (
    yellowstoneRpcProvider: ethers.providers.JsonRpcProvider,
) => {
    console.log(`Spending Limit Policy is being executed by parent Lit Action tool: ${parentToolIpfsCid}`);

    const delegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);
    const { isPermitted, appId, appVersion, policies } = await getUserToolPolicies(yellowstoneRpcProvider, delegateeAddress, userPkpInfo.tokenId, parentToolIpfsCid);

    console.log(`Retrieved Tool Policies for App ID: ${appId} App Version: ${appVersion} Delegatee: ${delegateeAddress} PKP: ${userPkpInfo.tokenId} from Vincent contract: ${JSON.stringify({ isPermitted, appId, appVersion, policies })}`);

    if (!isPermitted) {
        throw new Error(`Delegatee: ${delegateeAddress} is not permitted to execute App ID: ${appId} App Version: ${appVersion} for PKP: ${userPkpInfo.tokenId}`);
    }

    if (policies.length === 0) {
        throw new Error(
            `No policies found for App ID: ${appId} App Version: ${appVersion} tool ${parentToolIpfsCid} on PKP ${userPkpInfo.tokenId} for delegatee ${delegateeAddress}`
        );
    }

    const policyIpfsCid = LitAuth.actionIpfsIds[0];
    if (!policies.find(policy => policy.policyIpfsCid === policyIpfsCid)) {
        throw new Error(`Policy ${policyIpfsCid} not found for App ID: ${appId} App Version: ${appVersion} tool ${parentToolIpfsCid} on PKP ${userPkpInfo.tokenId} for delegatee ${delegateeAddress}`);
    } else {
        console.log(`Policy ${policyIpfsCid} found for App ID: ${appId} App Version: ${appVersion} tool ${parentToolIpfsCid} on PKP ${userPkpInfo.tokenId} for delegatee ${delegateeAddress}`);
    }
}