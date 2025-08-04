import { arrayify } from 'ethers/lib/utils';
import type {
  PermissionDataOnChain,
  PolicyWithParameters,
  AbilityWithPolicies,
} from '../internal/types/chain';
import type { PermissionData } from '../types';

/**
 * Converts a policy parameters object to the flattened array format required by the contract
 *
 * @param permissionData { PermissionData } - Object containing the nested policy parameters
 * @returns The flattened array structure with abilityIpfsCids, policyIpfsCids, and policyParameterValues
 */
export async function encodePermissionDataForChain(
  permissionData: PermissionData,
): Promise<PermissionDataOnChain> {
  const { encode } = await import('cbor2');

  const abilityIpfsCids: string[] = [];
  const policyIpfsCids: string[][] = [];
  const policyParameterValues: string[][] = [];

  Object.keys(permissionData).forEach((abilityIpfsCid) => {
    // Each ability needs matching-length arrays of policy IPFS CIDs and their parameter values
    // If the user hasn't enabled a policy, the ability object won't even have a property for that policy's CID

    // However, a policy may be enabled but have no parameters (headless policy)
    // In that case, we expect to encode `undefined` as the policy's value using CBOR2 (0xf7)

    abilityIpfsCids.push(abilityIpfsCid);

    const abilityPolicies = permissionData[abilityIpfsCid];
    const abilityPolicyIpfsCids: string[] = [];
    const abilityPolicyParameterValues: string[] = [];

    // Iterate through each policy for this ability
    Object.keys(abilityPolicies).forEach((policyIpfsCid) => {
      abilityPolicyIpfsCids.push(policyIpfsCid);

      // Encode the policy parameters using CBOR2
      const policyParams = abilityPolicies[policyIpfsCid];
      const encodedParams = encode(policyParams, { collapseBigInts: false });

      // Convert the encoded bytes to a hex string for the contract
      abilityPolicyParameterValues.push('0x' + Buffer.from(encodedParams).toString('hex'));
    });

    policyIpfsCids.push(abilityPolicyIpfsCids);
    policyParameterValues.push(abilityPolicyParameterValues);
  });

  return {
    abilityIpfsCids,
    policyIpfsCids,
    policyParameterValues,
  };
}

/**
 * Decodes policy parameters from a single policy's encoded parameters
 *
 * @param policy - PolicyWithParameters object containing policyIpfsCid and encoded policyParameterValues
 * @returns The decoded policy parameters object, or undefined if no parameters are provided
 */
export async function decodePolicyParametersFromChain(
  policy: PolicyWithParameters,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ [paramName: string]: any } | undefined> {
  const { decode } = await import('cbor2');

  const encodedParams = policy.policyParameterValues;

  // Handle empty or invalid parameters - return undefined to omit this policy
  if (!encodedParams || encodedParams === '0x') {
    return undefined;
  }

  try {
    const byteArray = arrayify(encodedParams);
    return decode(byteArray) as { [paramName: string]: any };
  } catch (error: unknown) {
    console.error('Error decoding policy parameters:', error);
    throw error;
  }
}

/**
 * Converts AbilityWithPolicies[] from the contract to a PermissionData object
 *
 * @param abilitiesWithPolicies - Array of AbilityWithPolicies objects
 * @returns The nested policy parameters object. PolicyParameters have been decoded using `CBOR2`.
 */
export async function decodePermissionDataFromChain(
  abilitiesWithPolicies: AbilityWithPolicies[],
): Promise<PermissionData> {
  const permissionData: PermissionData = {};

  for (const ability of abilitiesWithPolicies) {
    const { abilityIpfsCid } = ability;
    permissionData[abilityIpfsCid] = {};

    for (const policy of ability.policies) {
      const { policyIpfsCid } = policy;
      const decodedParams = await decodePolicyParametersFromChain(policy);

      // Only include policies that have valid parameters i.e. Policies set by the user
      if (decodedParams !== undefined) {
        permissionData[abilityIpfsCid][policyIpfsCid] = decodedParams;
      }
    }
  }

  return permissionData;
}
