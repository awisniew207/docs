/* eslint-disable */
import { getOnChainPolicyParams, validateTokenAreAllowed } from './utils';

(async () => {
    const { allowedTokens } = getOnChainPolicyParams(policy.parameters);

    console.log(`Retrieved allowedTokens: ${allowedTokens}`);

    if (allowedTokens && allowedTokens.length > 0) {
        validateTokenAreAllowed([toolParams.tokenIn], allowedTokens);
    }

    console.log(`Policy ${policy.policyIpfsCid} executed successfully`);
})();