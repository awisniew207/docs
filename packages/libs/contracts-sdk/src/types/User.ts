import type { Overrides, Signer } from 'ethers';

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
  pkpEthAddress: string;
  appId: number;
  appVersion: number;
  permissionData: PermissionData;
}

export interface PermitAppOptions {
  signer: Signer;
  args: PermitAppParams;
  overrides?: Overrides;
}

export interface UnPermitAppParams {
  pkpEthAddress: string;
  appId: number;
  appVersion: number;
}

export interface UnPermitAppOptions {
  signer: Signer;
  args: UnPermitAppParams;
  overrides?: Overrides;
}

export interface SetToolPolicyParametersParams {
  pkpEthAddress: string;
  appId: number;
  appVersion: number;
  policyParams: PermissionData;
}

export interface SetToolPolicyParametersOptions {
  signer: Signer;
  args: SetToolPolicyParametersParams;
  overrides?: Overrides;
}

// ==================================================================================
// User View Types
// ==================================================================================

export interface GetAllRegisteredAgentPkpsParams {
  userPkpAddress: string;
}

export interface GetAllRegisteredAgentPkpsOptions {
  signer: Signer;
  args: GetAllRegisteredAgentPkpsParams;
}

export interface GetPermittedAppVersionForPkpParams {
  pkpEthAddress: string;
  appId: number;
}

export interface GetPermittedAppVersionForPkpOptions {
  signer: Signer;
  args: GetPermittedAppVersionForPkpParams;
}

export interface GetAllPermittedAppIdsForPkpParams {
  pkpEthAddress: string;
}

export interface GetAllPermittedAppIdsForPkpOptions {
  signer: Signer;
  args: GetAllPermittedAppIdsForPkpParams;
}

export interface GetAllToolsAndPoliciesForAppParams {
  pkpEthAddress: string;
  appId: number;
}

export interface GetAllToolsAndPoliciesForAppOptions {
  signer: Signer;
  args: GetAllToolsAndPoliciesForAppParams;
}

export interface ValidateToolExecutionAndGetPoliciesParams {
  delegateeAddress: string;
  pkpEthAddress: string;
  toolIpfsCid: string;
}

export interface ValidateToolExecutionAndGetPoliciesOptions {
  signer: Signer;
  args: ValidateToolExecutionAndGetPoliciesParams;
}

export interface ValidateToolExecutionAndGetPoliciesResult {
  isPermitted: boolean;
  appId: number;
  appVersion: number;
  decodedPolicies: ToolPolicyParameterData;
}
