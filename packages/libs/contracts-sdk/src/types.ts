import { Signer } from 'ethers';

export interface AppVersionTools {
  toolIpfsCids: string[];
  toolPolicies: string[][];
}

export interface AppPermissionData {
  toolIpfsCids: string[];
  policyIpfsCids: string[][];
  policyParameterValues: string[][];
}

export interface RegisterAppParams {
  appId: string;
  delegatees: string[];
  versionTools: AppVersionTools;
}

export interface RegisterNextVersionParams {
  appId: string;
  versionTools: AppVersionTools;
}

export interface PermitAppParams {
  pkpTokenId: string;
  appId: string;
  appVersion: string;
  permissionData: AppPermissionData;
}

export interface RegisterAppOptions {
  signer: Signer;
  args: RegisterAppParams;
  overrides?: any;
}

export interface RegisterNextVersionOptions {
  signer: Signer;
  args: RegisterNextVersionParams;
  overrides?: any;
}

export interface PermitAppOptions {
  signer: Signer;
  args: PermitAppParams;
  overrides?: any;
}

export interface EnableAppVersionParams {
  appId: string;
  appVersion: string;
  enabled: boolean;
}

export interface AddDelegateeParams {
  appId: string;
  delegatee: string;
}

export interface RemoveDelegateeParams {
  appId: string;
  delegatee: string;
}

export interface DeleteAppParams {
  appId: string;
}

export interface UndeleteAppParams {
  appId: string;
}

export interface EnableAppVersionOptions {
  signer: Signer;
  args: EnableAppVersionParams;
  overrides?: any;
}

export interface AddDelegateeOptions {
  signer: Signer;
  args: AddDelegateeParams;
  overrides?: any;
}

export interface RemoveDelegateeOptions {
  signer: Signer;
  args: RemoveDelegateeParams;
  overrides?: any;
}

export interface DeleteAppOptions {
  signer: Signer;
  args: DeleteAppParams;
  overrides?: any;
}

export interface UndeleteAppOptions {
  signer: Signer;
  args: UndeleteAppParams;
  overrides?: any;
}
