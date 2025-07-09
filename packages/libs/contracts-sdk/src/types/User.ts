import { Signer } from 'ethers';

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
