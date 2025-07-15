import { Signer } from 'ethers';

// ==================================================================================
// User Mutation Types
// ==================================================================================

/**
 * Represents a nested structure of tool and policy parameters
 * Keys are tool IPFS CIDs, values are objects where their keys are policy IPFS CIDs
 * and values are policy parameters for the policy (typically objects | `undefined`)
 */
export interface PermissionData {
  [toolIpfsCid: string]: {
    [policyIpfsCid: string]: {
      // TODO: Add stronger type that narrows to only explicitly CBOR2 serializable values?
      [paramName: string]: any;
    };
  };
}

export interface PermitAppParams {
  pkpTokenId: string;
  appId: string;
  appVersion: string;
  permissionData: PermissionData;
}

export interface PermitAppOptions {
  signer: Signer;
  args: PermitAppParams;
  overrides?: any;
}

export interface UnPermitAppParams {
  pkpTokenId: string;
  appId: string;
  appVersion: string;
}

export interface UnPermitAppOptions {
  signer: Signer;
  args: UnPermitAppParams;
  overrides?: any;
}

export interface SetToolPolicyParametersParams {
  pkpTokenId: string;
  appId: string;
  appVersion: string;
  policyParams: PermissionData;
}

export interface SetToolPolicyParametersOptions {
  signer: Signer;
  args: SetToolPolicyParametersParams;
  overrides?: any;
}

// ==================================================================================
// User View Types
// ==================================================================================

export interface GetAllRegisteredAgentPkpsParams {
  userAddress: string;
}

export interface GetAllRegisteredAgentPkpsOptions {
  signer: Signer;
  args: GetAllRegisteredAgentPkpsParams;
}

export interface GetPermittedAppVersionForPkpParams {
  pkpTokenId: string;
  appId: string;
}

export interface GetPermittedAppVersionForPkpOptions {
  signer: Signer;
  args: GetPermittedAppVersionForPkpParams;
}

export interface GetAllPermittedAppIdsForPkpParams {
  pkpTokenId: string;
}

export interface GetAllPermittedAppIdsForPkpOptions {
  signer: Signer;
  args: GetAllPermittedAppIdsForPkpParams;
}

export interface GetAllToolsAndPoliciesForAppParams {
  pkpTokenId: string;
  appId: string;
}

export interface GetAllToolsAndPoliciesForAppOptions {
  signer: Signer;
  args: GetAllToolsAndPoliciesForAppParams;
}
