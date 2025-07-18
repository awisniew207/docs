import type { Signer, Overrides } from 'ethers';

// ==================================================================================
// App Mutation Types
// ==================================================================================

export interface AppVersionTools {
  toolIpfsCids: string[];
  toolPolicies: string[][];
}

export interface RegisterAppParams {
  appId: number;
  delegateeAddresses: string[];
  versionTools: AppVersionTools;
}

export interface RegisterNextVersionParams {
  appId: number;
  versionTools: AppVersionTools;
}

export interface RegisterAppOptions {
  signer: Signer;
  args: RegisterAppParams;
  overrides?: Overrides;
}

export interface RegisterNextVersionOptions {
  signer: Signer;
  args: RegisterNextVersionParams;
  overrides?: Overrides;
}
export interface EnableAppVersionParams {
  appId: number;
  appVersion: number;
  enabled: boolean;
}

export interface AddDelegateeParams {
  appId: number;
  delegateeAddress: string;
}

export interface RemoveDelegateeParams {
  appId: number;
  delegateeAddress: string;
}

export interface DeleteAppParams {
  appId: number;
}

export interface UndeleteAppParams {
  appId: number;
}

export interface EnableAppVersionOptions {
  signer: Signer;
  args: EnableAppVersionParams;
  overrides?: Overrides;
}

export interface AddDelegateeOptions {
  signer: Signer;
  args: AddDelegateeParams;
  overrides?: Overrides;
}

export interface RemoveDelegateeOptions {
  signer: Signer;
  args: RemoveDelegateeParams;
  overrides?: Overrides;
}

export interface DeleteAppOptions {
  signer: Signer;
  args: DeleteAppParams;
  overrides?: Overrides;
}

export interface UndeleteAppOptions {
  signer: Signer;
  args: UndeleteAppParams;
  overrides?: Overrides;
}

// ==================================================================================
// App View Types
// ==================================================================================

export interface GetAppByIdParams {
  appId: number;
}

export interface GetAppByIdOptions {
  signer: Signer;
  args: GetAppByIdParams;
}

export interface App {
  id: number;
  isDeleted: boolean;
  manager: string;
  latestVersion: number;
  delegateeAddresses: string[];
}

export interface GetAppVersionParams {
  appId: number;
  version: number;
}

export interface GetAppVersionOptions {
  signer: Signer;
  args: GetAppVersionParams;
}

export interface Tool {
  toolIpfsCid: string;
  policyIpfsCids: string[];
}

export interface AppVersion {
  version: number;
  enabled: boolean;
  tools: Tool[];
}

export interface GetAppsByManagerParams {
  managerAddress: string;
}

export interface GetAppsByManagerOptions {
  signer: Signer;
  args: GetAppsByManagerParams;
}

export interface AppWithVersions {
  app: App;
  versions: AppVersion[];
}

export interface GetAppByDelegateeParams {
  delegateeAddress: string;
}

export interface GetAppByDelegateeOptions {
  signer: Signer;
  args: GetAppByDelegateeParams;
}

export interface GetDelegatedPkpEthAddressesParams {
  appId: number;
  version: number;
  pageOpts?: {
    offset?: number;
    limit?: number;
  };
}

export interface GetDelegatedPkpEthAddressesOptions {
  signer: Signer;
  args: GetDelegatedPkpEthAddressesParams;
}
