import type { Signer } from 'ethers';

/**
 * Represents the decoded parameters for policies associated with a single tool
 * Keys are policy IPFS CIDs, values are policy parameters for the policy
 */
export interface ToolPolicyParameterData {
  [policyIpfsCid: string]:
    | {
        // TODO: Add stronger type that narrows to only explicitly CBOR2 serializable values?
        [paramName: string]: any;
      }
    | undefined;
}

/**
 * Represents a nested structure of tool and policy parameters
 * Keys are tool IPFS CIDs, values are ToolPolicyParameterData objects
 */
export interface PermissionData {
  [toolIpfsCid: string]: ToolPolicyParameterData;
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

export interface ValidateToolExecutionAndGetPoliciesParams {
  delegatee: string;
  pkpTokenId: string;
  toolIpfsCid: string;
}

export interface ValidateToolExecutionAndGetPoliciesOptions {
  signer: Signer;
  args: ValidateToolExecutionAndGetPoliciesParams;
}

export interface ValidateToolExecutionAndGetPoliciesResult {
  isPermitted: boolean;
  appId: string;
  appVersion: string;
  decodedPolicies: ToolPolicyParameterData;
}
