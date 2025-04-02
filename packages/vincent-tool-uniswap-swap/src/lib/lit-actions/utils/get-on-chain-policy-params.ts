/* eslint-disable */
import { type PolicyParameter } from '@lit-protocol/vincent-tool';
import { ethers } from 'ethers';

export const getOnChainPolicyParams = (parameters: PolicyParameter[]) => {
    let maxSpendingLimitInUsdCents: ethers.BigNumber | undefined;

    for (const parameter of parameters) {
        switch (parameter.name) {
            case 'maxSpendingLimitInUsdCents':
                // Parameter type 2 = UINT256
                if (parameter.paramType === 2) {
                    maxSpendingLimitInUsdCents = ethers.utils.defaultAbiCoder.decode(['uint256'], parameter.value)[0];
                } else {
                    throw new Error(`Unexpected parameter type for maxSpendingLimitInUsdCents: ${parameter.paramType}`);
                }
                break;
        }
    }

    return { maxSpendingLimitInUsdCents };
};