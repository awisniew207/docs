import { emptySplitApi as api } from './emptyApi';
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    createApp: build.mutation<CreateAppApiResponse, CreateAppApiArg>({
      query: (queryArg) => ({ url: `/app`, method: 'POST', body: queryArg.iCreateAppDef }),
    }),
    getApp: build.query<GetAppApiResponse, GetAppApiArg>({
      query: (queryArg) => ({ url: `/app/${queryArg.identity}` }),
    }),
    editApp: build.mutation<EditAppApiResponse, EditAppApiArg>({
      query: (queryArg) => ({
        url: `/app/${queryArg.identity}`,
        method: 'PUT',
        body: queryArg.iCreateAppDef,
      }),
    }),
    deleteApp: build.mutation<DeleteAppApiResponse, DeleteAppApiArg>({
      query: (queryArg) => ({ url: `/app/${queryArg.identity}`, method: 'DELETE' }),
    }),
    getAppVersions: build.query<GetAppVersionsApiResponse, GetAppVersionsApiArg>({
      query: (queryArg) => ({ url: `/app/${queryArg.identity}/versions` }),
    }),
    createAppVersion: build.mutation<CreateAppVersionApiResponse, CreateAppVersionApiArg>({
      query: (queryArg) => ({
        url: `/app/version/${queryArg.identity}`,
        method: 'POST',
        body: queryArg.iCreateAppVersionDef,
      }),
    }),
    getAppVersion: build.query<GetAppVersionApiResponse, GetAppVersionApiArg>({
      query: (queryArg) => ({ url: `/app/version/${queryArg.identity}` }),
    }),
    editAppVersion: build.mutation<EditAppVersionApiResponse, EditAppVersionApiArg>({
      query: (queryArg) => ({
        url: `/app/version/${queryArg.identity}`,
        method: 'PUT',
        body: queryArg.versionChanges,
      }),
    }),
    toggleAppVersion: build.mutation<ToggleAppVersionApiResponse, ToggleAppVersionApiArg>({
      query: (queryArg) => ({ url: `/app/version/${queryArg.identity}/toggle`, method: 'POST' }),
    }),
    createTool: build.mutation<CreateToolApiResponse, CreateToolApiArg>({
      query: (queryArg) => ({ url: `/tool`, method: 'POST', body: queryArg.iCreateToolDef }),
    }),
    getTool: build.query<GetToolApiResponse, GetToolApiArg>({
      query: (queryArg) => ({ url: `/tool/${queryArg.identity}` }),
    }),
    editTool: build.mutation<EditToolApiResponse, EditToolApiArg>({
      query: (queryArg) => ({
        url: `/tool/${queryArg.identity}`,
        method: 'PUT',
        body: queryArg.iEditToolDef,
      }),
    }),
    deleteTool: build.mutation<DeleteToolApiResponse, DeleteToolApiArg>({
      query: (queryArg) => ({ url: `/tool/${queryArg.identity}`, method: 'DELETE' }),
    }),
    getToolVersions: build.query<GetToolVersionsApiResponse, GetToolVersionsApiArg>({
      query: (queryArg) => ({ url: `/tool/${queryArg.identity}/versions` }),
    }),
    changeToolOwner: build.mutation<ChangeToolOwnerApiResponse, ChangeToolOwnerApiArg>({
      query: (queryArg) => ({
        url: `/tool/${queryArg.identity}/owner`,
        method: 'PUT',
        body: queryArg.body,
      }),
    }),
    createToolVersion: build.mutation<CreateToolVersionApiResponse, CreateToolVersionApiArg>({
      query: (queryArg) => ({
        url: `/tool/version/${queryArg.identity}`,
        method: 'POST',
        body: queryArg.versionChanges,
      }),
    }),
    getToolVersion: build.query<GetToolVersionApiResponse, GetToolVersionApiArg>({
      query: (queryArg) => ({ url: `/tool/version/${queryArg.identity}` }),
    }),
    editToolVersion: build.mutation<EditToolVersionApiResponse, EditToolVersionApiArg>({
      query: (queryArg) => ({
        url: `/tool/version/${queryArg.identity}`,
        method: 'PUT',
        body: queryArg.versionChanges,
      }),
    }),
    createPolicy: build.mutation<CreatePolicyApiResponse, CreatePolicyApiArg>({
      query: (queryArg) => ({ url: `/policy`, method: 'POST', body: queryArg.iCreatePolicyDef }),
    }),
    getPolicy: build.query<GetPolicyApiResponse, GetPolicyApiArg>({
      query: (queryArg) => ({ url: `/policy/${queryArg.identity}` }),
    }),
    editPolicy: build.mutation<EditPolicyApiResponse, EditPolicyApiArg>({
      query: (queryArg) => ({
        url: `/policy/${queryArg.identity}`,
        method: 'PUT',
        body: queryArg.iEditPolicyDef,
      }),
    }),
    createPolicyVersion: build.mutation<CreatePolicyVersionApiResponse, CreatePolicyVersionApiArg>({
      query: (queryArg) => ({
        url: `/policy/version/${queryArg.identity}`,
        method: 'POST',
        body: queryArg.versionChanges,
      }),
    }),
    getPolicyVersion: build.query<GetPolicyVersionApiResponse, GetPolicyVersionApiArg>({
      query: (queryArg) => ({ url: `/policy/version/${queryArg.identity}` }),
    }),
    getPolicyVersions: build.query<GetPolicyVersionsApiResponse, GetPolicyVersionsApiArg>({
      query: (queryArg) => ({
        url: `/policy/versions`,
        params: {
          identity: queryArg.identity,
        },
      }),
    }),
    changePolicyOwner: build.mutation<ChangePolicyOwnerApiResponse, ChangePolicyOwnerApiArg>({
      query: (queryArg) => ({
        url: `/policy/${queryArg.identity}/owner`,
        method: 'PUT',
        body: queryArg.body,
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as vincentApi };
export type CreateAppApiResponse = /** status 200 Successful operation */ IAppDefRead;
export type CreateAppApiArg = {
  /** Developer-defined application information */
  iCreateAppDef: ICreateAppDef;
};
export type GetAppApiResponse = /** status 200 Successful operation */ IAppDefRead;
export type GetAppApiArg = {
  /** Identity of the application to retrieve */
  identity: string;
};
export type EditAppApiResponse = /** status 200 Successful operation */ IAppDefRead;
export type EditAppApiArg = {
  /** Identity of the application to edit */
  identity: string;
  /** Developer-defined updated application details */
  iCreateAppDef: ICreateAppDef;
};
export type DeleteAppApiResponse =
  /** status 200 OK - Resource successfully deleted */ DeleteResponse;
export type DeleteAppApiArg = {
  /** Identity of the application to delete */
  identity: string;
};
export type GetAppVersionsApiResponse = /** status 200 Successful operation */ AppVersionsArrayRead;
export type GetAppVersionsApiArg = {
  /** Identity of the application whose versions will be fetched */
  identity: string;
};
export type CreateAppVersionApiResponse = /** status 200 Successful operation */ IAppVersionDefRead;
export type CreateAppVersionApiArg = {
  /** Identity of the application to create a new version for */
  identity: string;
  /** Developer-defined version details */
  iCreateAppVersionDef: ICreateAppVersionDef;
};
export type GetAppVersionApiResponse =
  /** status 200 Successful operation */ IAppVersionWithToolsDefRead;
export type GetAppVersionApiArg = {
  /** Identity of the application version to retrieve */
  identity: string;
};
export type EditAppVersionApiResponse = /** status 200 Successful operation */ IAppVersionDefRead;
export type EditAppVersionApiArg = {
  /** Identity of the application version to edit */
  identity: string;
  /** Update version changes field */
  versionChanges: VersionChanges;
};
export type ToggleAppVersionApiResponse = /** status 200 Successful operation */ IAppVersionDefRead;
export type ToggleAppVersionApiArg = {
  /** Identity of the application version to toggle */
  identity: string;
};
export type CreateToolApiResponse = /** status 200 Successful operation */ IToolDef;
export type CreateToolApiArg = {
  /** Developer-defined tool details */
  iCreateToolDef: ICreateToolDef;
};
export type GetToolApiResponse = /** status 200 Successful operation */ IToolDef;
export type GetToolApiArg = {
  /** Identity of the tool to retrieve */
  identity: string;
};
export type EditToolApiResponse = /** status 200 Successful operation */ IToolDef;
export type EditToolApiArg = {
  /** Identity of the tool to edit */
  identity: string;
  /** Developer-defined updated tool details */
  iEditToolDef: IEditToolDef;
};
export type DeleteToolApiResponse = /** status 200 Successful operation */ DeleteResponse;
export type DeleteToolApiArg = {
  /** Identity of the tool to delete */
  identity: string;
};
export type GetToolVersionsApiResponse = /** status 200 Successful operation */ IToolVersionDef[];
export type GetToolVersionsApiArg = {
  /** Identity of the tool to fetch versions for */
  identity: string;
};
export type ChangeToolOwnerApiResponse = /** status 200 Successful operation */ IToolDef;
export type ChangeToolOwnerApiArg = {
  /** Identity of the tool to change the owner of */
  identity: string;
  /** Developer-defined updated tool details */
  body: {
    /** New author wallet address */
    authorWalletAddress: string;
  };
};
export type CreateToolVersionApiResponse = /** status 200 Successful operation */ IToolVersionDef;
export type CreateToolVersionApiArg = {
  /** Identity of the tool to create a new version for */
  identity: string;
  /** Developer-defined version details */
  versionChanges: VersionChanges;
};
export type GetToolVersionApiResponse = /** status 200 Successful operation */ IToolVersionDef;
export type GetToolVersionApiArg = {
  /** Identity of the tool version to retrieve */
  identity: string;
};
export type EditToolVersionApiResponse = /** status 200 Successful operation */ IToolVersionDef;
export type EditToolVersionApiArg = {
  /** Identity of the tool version to edit */
  identity: string;
  /** Update version changes field */
  versionChanges: VersionChanges;
};
export type CreatePolicyApiResponse = /** status 200 Successful operation */ IPolicyDef;
export type CreatePolicyApiArg = {
  /** Developer-defined policy details */
  iCreatePolicyDef: ICreatePolicyDef;
};
export type GetPolicyApiResponse = /** status 200 Successful operation */ IPolicyDef;
export type GetPolicyApiArg = {
  /** Identity of the policy to retrieve */
  identity: string;
};
export type EditPolicyApiResponse = /** status 200 Successful operation */ IPolicyDef;
export type EditPolicyApiArg = {
  /** Identity of the policy to edit */
  identity: string;
  /** Developer-defined updated policy details */
  iEditPolicyDef: IEditPolicyDef;
};
export type CreatePolicyVersionApiResponse =
  /** status 200 Successful operation */ IPolicyVersionDef;
export type CreatePolicyVersionApiArg = {
  /** Identity of the policy to create a new version for */
  identity: string;
  /** Developer-defined version details */
  versionChanges: VersionChanges;
};
export type GetPolicyVersionApiResponse = /** status 200 Successful operation */ IPolicyVersionDef;
export type GetPolicyVersionApiArg = {
  /** Identity of the policy version to retrieve */
  identity: string;
};
export type GetPolicyVersionsApiResponse =
  /** status 200 Successful operation */ PolicyVersionsArray;
export type GetPolicyVersionsApiArg = {
  /** Identity of the policy to fetch versions for */
  identity: string;
};
export type ChangePolicyOwnerApiResponse = /** status 200 Successful operation */ IPolicyDef;
export type ChangePolicyOwnerApiArg = {
  /** Identity of the policy to change the owner of */
  identity: string;
  /** Developer-defined updated policy details */
  body: {
    /** New author wallet address */
    authorWalletAddress: string;
  };
};
export type IAppDef = {
  /** The name of the application */
  name: string;
  /** Description of the application */
  description: string;
  /** Contact email for the application */
  contactEmail: string;
  /** URL of the application for users */
  appUserUrl: string;
  /** Base64 encoded logo image */
  logo: string;
  /** Redirect URIs for the application */
  redirectUris: string[];
  /** Deployment status of the application */
  deploymentStatus: 'dev' | 'test' | 'prod';
  /** Manager wallet address */
  managerAddress: string;
  /** Active version of the application */
  activeVersion: number;
};
export type IAppDefRead = {
  /** The name of the application */
  name: string;
  /** Description of the application */
  description: string;
  /** Contact email for the application */
  contactEmail: string;
  /** URL of the application for users */
  appUserUrl: string;
  /** Base64 encoded logo image */
  logo: string;
  /** Redirect URIs for the application */
  redirectUris: string[];
  /** Deployment status of the application */
  deploymentStatus: 'dev' | 'test' | 'prod';
  /** Manager wallet address */
  managerAddress: string;
  /** Active version of the application */
  activeVersion: number;
  /** Unique composite identifier in the format AppDef|<appId> */
  identity: string;
  /** Application ID */
  appId: number;
  /** Last updated timestamp */
  lastUpdated: string;
};
export type Error = {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
};
export type ICreateAppDef = {
  /** The name of the application */
  name: string;
  /** Description of the application */
  description: string;
  /** Contact email for the application */
  contactEmail: string;
  /** URL of the application for users */
  appUserUrl: string;
  /** Base64 encoded logo image */
  logo: string;
  /** Redirect URIs for the application */
  redirectUris: string[];
  /** Deployment status of the application */
  deploymentStatus: 'dev' | 'test' | 'prod';
  /** Manager wallet address */
  managerAddress: string;
  /** Active version of the application */
  activeVersion?: number;
};
export type DeleteResponse = {
  /** Success message */
  message: string;
};
export type AppVersionsArray = {
  /** Version number */
  versionNumber: number;
  /** Whether this version is enabled */
  enabled: boolean;
  /** Changelog information for this version */
  changes: string;
}[];
export type AppVersionsArrayRead = {
  /** Application ID */
  appId: number;
  /** Version number */
  versionNumber: number;
  /** Unique composite identifier in the format AppVersionDef|<appId>@<versionNumber> */
  identity: string;
  /** Whether this version is enabled */
  enabled: boolean;
  /** Changelog information for this version */
  changes: string;
}[];
export type IAppVersionDef = {
  /** Version number */
  versionNumber: number;
  /** Whether this version is enabled */
  enabled: boolean;
  /** Changelog information for this version */
  changes: string;
};
export type IAppVersionDefRead = {
  /** Application ID */
  appId: number;
  /** Version number */
  versionNumber: number;
  /** Unique composite identifier in the format AppVersionDef|<appId>@<versionNumber> */
  identity: string;
  /** Whether this version is enabled */
  enabled: boolean;
  /** Changelog information for this version */
  changes: string;
};
export type ICreateAppVersionDef = {
  /** List of tool identities to include in this version */
  tools: string[];
  /** Changelog information for this version */
  changes: string;
};
export type IAppVersionWithToolsDef = {};
export type IAppVersionWithToolsDefRead = {
  version: {
    /** Application ID */
    appId: number;
    /** Version number */
    versionNumber: number;
    /** Unique composite identifier in the format AppVersionDef|<appId>@<versionNumber> */
    identity: string;
    /** Whether this version is enabled */
    enabled: boolean;
    /** Changelog information for this version */
    changes: string;
  };
  tools: {
    /** Application ID */
    appId: number;
    /** Application version number */
    appVersionNumber: number;
    /** Tool package name */
    toolPackageName: string;
    /** Tool version */
    toolVersion: string;
    /** Tool identity */
    toolIdentity: string;
    /** Unique composite identifier */
    identity: string;
  }[];
};
export type VersionChanges = {
  /** Updated changelog information */
  changes: string;
};
export type IToolDef = {
  /** Tool package name */
  packageName: string;
  /** Tool title */
  toolTitle?: string;
  /** Unique composite identifier */
  identity: string;
  /** Author wallet address */
  authorWalletAddress: string;
  /** Tool description */
  description: string;
  /** Active version of the tool */
  activeVersion: string;
};
export type ICreateToolDef = {
  /** Tool package name */
  packageName: string;
  /** Tool title */
  toolTitle: string;
  /** Tool description */
  description: string;
};
export type IEditToolDef = {
  /** Tool title */
  toolTitle: string;
  /** Tool description */
  description: string;
  /** Active version of the tool */
  activeVersion: string;
};
export type IToolVersionDef = {
  /** Tool package name */
  packageName: string;
  /** Tool version */
  version: string;
  /** Unique composite identifier */
  identity: string;
  /** Changelog information for this version */
  changes: string;
  /** Repository URLs */
  repository: string[];
  /** Keywords for the tool */
  keywords: string[];
  /** Dependencies of the tool */
  dependencies: string[];
  /** Author information */
  author: {
    /** Name of the author */
    name: string;
    /** Email of the author */
    email: string;
    /** URL of the author's website */
    url?: string;
  };
  /** Contributors information */
  contributors: {
    /** Name of the contributor */
    name: string;
    /** Email of the contributor */
    email: string;
    /** URL of the contributor's website */
    url?: string;
  }[];
  /** Tool homepage */
  homepage?: string;
  /** Tool status */
  status: 'invalid' | 'validating' | 'valid' | 'error';
  /** Supported policies */
  supportedPolicies: string[];
  /** IPFS CID */
  ipfsCid: string;
};
export type IPolicyDef = {
  /** Policy package name */
  packageName: string;
  /** Unique composite identifier */
  identity: string;
  /** Author wallet address */
  authorWalletAddress: string;
  /** Policy description */
  description: string;
  /** Active version of the policy */
  activeVersion: string;
};
export type ICreatePolicyDef = {
  /** Policy package name */
  packageName: string;
  /** Policy title */
  policyTitle: string;
  /** Policy description */
  description: string;
};
export type IEditPolicyDef = {
  /** Policy title */
  policyTitle: string;
  /** Policy description */
  description: string;
  /** Active version of the policy */
  activeVersion: string;
};
export type IPolicyVersionDef = {
  /** Policy package name */
  packageName: string;
  /** Policy version */
  version: string;
  /** Unique composite identifier */
  identity: string;
  /** Changelog information for this version */
  changes: string;
  /** Repository URLs */
  repository: string[];
  /** Policy description */
  description: string;
  /** Keywords for the policy */
  keywords: string[];
  /** Dependencies of the policy */
  dependencies: string[];
  /** Author information */
  author: {
    /** Name of the author */
    name: string;
    /** Email of the author */
    email: string;
    /** URL of the author's website */
    url?: string;
  };
  /** Contributors information */
  contributors: {
    /** Name of the contributor */
    name: string;
    /** Email of the contributor */
    email: string;
    /** URL of the contributor's website */
    url?: string;
  }[];
  /** Policy homepage */
  homepage?: string;
  /** Policy status */
  status: 'invalid' | 'validating' | 'valid' | 'error';
  /** IPFS CID */
  ipfsCid: string;
  /** Schema parameters */
  parameters: {
    /** UI Schema for parameter display */
    uiSchema: string;
    /** JSON Schema for parameter validation */
    jsonSchema: string;
  };
};
export type PolicyVersionsArray = IPolicyVersionDef[];
export const {
  useCreateAppMutation,
  useGetAppQuery,
  useEditAppMutation,
  useDeleteAppMutation,
  useGetAppVersionsQuery,
  useCreateAppVersionMutation,
  useGetAppVersionQuery,
  useEditAppVersionMutation,
  useToggleAppVersionMutation,
  useCreateToolMutation,
  useGetToolQuery,
  useEditToolMutation,
  useDeleteToolMutation,
  useGetToolVersionsQuery,
  useChangeToolOwnerMutation,
  useCreateToolVersionMutation,
  useGetToolVersionQuery,
  useEditToolVersionMutation,
  useCreatePolicyMutation,
  useGetPolicyQuery,
  useEditPolicyMutation,
  useCreatePolicyVersionMutation,
  useGetPolicyVersionQuery,
  useGetPolicyVersionsQuery,
  useChangePolicyOwnerMutation,
} = injectedRtkApi;
