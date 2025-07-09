import { Signer } from 'ethers';

// ==================================================================================
// User Mutation Types
// ==================================================================================

export interface AppPermissionData {
  toolIpfsCids: string[];
  policyIpfsCids: string[][];
  policyParameterValues: string[][];
}

export interface PermitAppParams {
  pkpTokenId: string;
  appId: string;
  appVersion: string;
  permissionData: AppPermissionData;
}

export interface PermitAppOptions {
  signer: Signer;
  args: PermitAppParams;
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

// ==================================================================================
// Response Types
// ==================================================================================

export interface PolicyWithParameters {
  policyIpfsCid: string;
  policyParameterValues: string;
}

export interface ToolWithPolicies {
  toolIpfsCid: string;
  policies: PolicyWithParameters[];
}
