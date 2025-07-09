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
