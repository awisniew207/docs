import { type ethers } from 'ethers';

import { getUserToolPolicies } from './get-user-tool-policies';

export const validateUserToolPolicies = async (
    yellowstoneProvider: ethers.providers.JsonRpcProvider,
    userRpcUrl: string,
    delegateeAddress: string,
    userPkpInfo: { tokenId: string, ethAddress: string, publicKey: string },
    toolIpfsCid: string,
    toolParams: Record<string, unknown>,
) => {
    const { isPermitted, appId, appVersion, policies } = await getUserToolPolicies(yellowstoneProvider, delegateeAddress, userPkpInfo.tokenId, toolIpfsCid);

    console.log(`Retrieved Tool Policies for App ID: ${appId} Delegatee: ${delegateeAddress} PKP: ${userPkpInfo.tokenId} from Vincent contract: ${JSON.stringify({ isPermitted, appId, appVersion, policies })}`);

    if (!isPermitted) {
        throw new Error(`Delegatee: ${delegateeAddress} is not permitted to execute App ID: ${appId} for PKP: ${userPkpInfo.tokenId}`);
    }

    if (policies.length === 0) {
        console.log(
            `No policy found for tool ${toolIpfsCid} on PKP ${userPkpInfo.tokenId} for delegatee ${delegateeAddress}`
        );
        return;
    }

    for (const policy of policies) {
        console.log(`Executing Policy child Lit Action: ${policy.policyIpfsCid} with parameters: ${JSON.stringify(policy.parameters, null, 2)}`);

        await Lit.Actions.call({
            ipfsId: policy.policyIpfsCid,
            params: {
                userRpcUrl,
                vincentAppId: appId.toString(),
                vincentAppVersion: appVersion.toString(),
                userPkpInfo,
                toolParams,
                policy,
            },
        });
    }
};