import { baseVincentRtkApiNode as api } from '../lib/internal/baseVincentRtkApiNode';
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    listApps: build.query<ListAppsApiResponse, ListAppsApiArg>({
      query: () => ({ url: `/apps` }),
    }),
    createApp: build.mutation<CreateAppApiResponse, CreateAppApiArg>({
      query: (queryArg) => ({ url: `/app`, method: 'POST', body: queryArg.appCreate }),
    }),
    getApp: build.query<GetAppApiResponse, GetAppApiArg>({
      query: (queryArg) => ({ url: `/app/${encodeURIComponent(String(queryArg.appId))}` }),
    }),
    editApp: build.mutation<EditAppApiResponse, EditAppApiArg>({
      query: (queryArg) => ({
        url: `/app/${encodeURIComponent(String(queryArg.appId))}`,
        method: 'PUT',
        body: queryArg.appEdit,
      }),
    }),
    deleteApp: build.mutation<DeleteAppApiResponse, DeleteAppApiArg>({
      query: (queryArg) => ({
        url: `/app/${encodeURIComponent(String(queryArg.appId))}`,
        method: 'DELETE',
      }),
    }),
    getAppVersions: build.query<GetAppVersionsApiResponse, GetAppVersionsApiArg>({
      query: (queryArg) => ({ url: `/app/${encodeURIComponent(String(queryArg.appId))}/versions` }),
    }),
    createAppVersion: build.mutation<CreateAppVersionApiResponse, CreateAppVersionApiArg>({
      query: (queryArg) => ({
        url: `/app/${encodeURIComponent(String(queryArg.appId))}/version`,
        method: 'POST',
        body: queryArg.appVersionCreate,
      }),
    }),
    getAppVersion: build.query<GetAppVersionApiResponse, GetAppVersionApiArg>({
      query: (queryArg) => ({
        url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.version))}`,
      }),
    }),
    editAppVersion: build.mutation<EditAppVersionApiResponse, EditAppVersionApiArg>({
      query: (queryArg) => ({
        url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.version))}`,
        method: 'PUT',
        body: queryArg.appVersionEdit,
      }),
    }),
    enableAppVersion: build.mutation<EnableAppVersionApiResponse, EnableAppVersionApiArg>({
      query: (queryArg) => ({
        url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.version))}/enable`,
        method: 'POST',
      }),
    }),
    disableAppVersion: build.mutation<DisableAppVersionApiResponse, DisableAppVersionApiArg>({
      query: (queryArg) => ({
        url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.version))}/disable`,
        method: 'POST',
      }),
    }),
    listAppVersionTools: build.query<ListAppVersionToolsApiResponse, ListAppVersionToolsApiArg>({
      query: (queryArg) => ({
        url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.version))}/tools`,
      }),
    }),
    createAppVersionTool: build.mutation<
      CreateAppVersionToolApiResponse,
      CreateAppVersionToolApiArg
    >({
      query: (queryArg) => ({
        url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.appVersion))}/tool/${encodeURIComponent(String(queryArg.toolPackageName))}`,
        method: 'POST',
        body: queryArg.appVersionToolCreate,
      }),
    }),
    editAppVersionTool: build.mutation<EditAppVersionToolApiResponse, EditAppVersionToolApiArg>({
      query: (queryArg) => ({
        url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.appVersion))}/tool/${encodeURIComponent(String(queryArg.toolPackageName))}`,
        method: 'PUT',
        body: queryArg.appVersionToolEdit,
      }),
    }),
    listAllTools: build.query<ListAllToolsApiResponse, ListAllToolsApiArg>({
      query: () => ({ url: `/tools` }),
    }),
    createTool: build.mutation<CreateToolApiResponse, CreateToolApiArg>({
      query: (queryArg) => ({
        url: `/tool/${encodeURIComponent(String(queryArg.packageName))}`,
        method: 'POST',
        body: queryArg.toolCreate,
      }),
    }),
    getTool: build.query<GetToolApiResponse, GetToolApiArg>({
      query: (queryArg) => ({ url: `/tool/${encodeURIComponent(String(queryArg.packageName))}` }),
    }),
    editTool: build.mutation<EditToolApiResponse, EditToolApiArg>({
      query: (queryArg) => ({
        url: `/tool/${encodeURIComponent(String(queryArg.packageName))}`,
        method: 'PUT',
        body: queryArg.toolEdit,
      }),
    }),
    deleteTool: build.mutation<DeleteToolApiResponse, DeleteToolApiArg>({
      query: (queryArg) => ({
        url: `/tool/${encodeURIComponent(String(queryArg.packageName))}`,
        method: 'DELETE',
      }),
    }),
    getToolVersions: build.query<GetToolVersionsApiResponse, GetToolVersionsApiArg>({
      query: (queryArg) => ({
        url: `/tool/${encodeURIComponent(String(queryArg.packageName))}/versions`,
      }),
    }),
    changeToolOwner: build.mutation<ChangeToolOwnerApiResponse, ChangeToolOwnerApiArg>({
      query: (queryArg) => ({
        url: `/tool/${encodeURIComponent(String(queryArg.packageName))}/owner`,
        method: 'PUT',
        body: queryArg.changeOwner,
      }),
    }),
    createToolVersion: build.mutation<CreateToolVersionApiResponse, CreateToolVersionApiArg>({
      query: (queryArg) => ({
        url: `/tool/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
        method: 'POST',
        body: queryArg.toolVersionCreate,
      }),
    }),
    getToolVersion: build.query<GetToolVersionApiResponse, GetToolVersionApiArg>({
      query: (queryArg) => ({
        url: `/tool/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
      }),
    }),
    editToolVersion: build.mutation<EditToolVersionApiResponse, EditToolVersionApiArg>({
      query: (queryArg) => ({
        url: `/tool/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
        method: 'PUT',
        body: queryArg.toolVersionEdit,
      }),
    }),
    listAllPolicies: build.query<ListAllPoliciesApiResponse, ListAllPoliciesApiArg>({
      query: () => ({ url: `/policies` }),
    }),
    createPolicy: build.mutation<CreatePolicyApiResponse, CreatePolicyApiArg>({
      query: (queryArg) => ({
        url: `/policy/${encodeURIComponent(String(queryArg.packageName))}`,
        method: 'POST',
        body: queryArg.policyCreate,
      }),
    }),
    getPolicy: build.query<GetPolicyApiResponse, GetPolicyApiArg>({
      query: (queryArg) => ({ url: `/policy/${encodeURIComponent(String(queryArg.packageName))}` }),
    }),
    editPolicy: build.mutation<EditPolicyApiResponse, EditPolicyApiArg>({
      query: (queryArg) => ({
        url: `/policy/${encodeURIComponent(String(queryArg.packageName))}`,
        method: 'PUT',
        body: queryArg.policyEdit,
      }),
    }),
    deletePolicy: build.mutation<DeletePolicyApiResponse, DeletePolicyApiArg>({
      query: (queryArg) => ({
        url: `/policy/${encodeURIComponent(String(queryArg.packageName))}`,
        method: 'DELETE',
      }),
    }),
    createPolicyVersion: build.mutation<CreatePolicyVersionApiResponse, CreatePolicyVersionApiArg>({
      query: (queryArg) => ({
        url: `/policy/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
        method: 'POST',
        body: queryArg.policyVersionCreate,
      }),
    }),
    getPolicyVersion: build.query<GetPolicyVersionApiResponse, GetPolicyVersionApiArg>({
      query: (queryArg) => ({
        url: `/policy/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
      }),
    }),
    editPolicyVersion: build.mutation<EditPolicyVersionApiResponse, EditPolicyVersionApiArg>({
      query: (queryArg) => ({
        url: `/policy/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
        method: 'PUT',
        body: queryArg.policyVersionEdit,
      }),
    }),
    getPolicyVersions: build.query<GetPolicyVersionsApiResponse, GetPolicyVersionsApiArg>({
      query: (queryArg) => ({
        url: `/policy/${encodeURIComponent(String(queryArg.packageName))}/versions`,
      }),
    }),
    changePolicyOwner: build.mutation<ChangePolicyOwnerApiResponse, ChangePolicyOwnerApiArg>({
      query: (queryArg) => ({
        url: `/policy/${encodeURIComponent(String(queryArg.packageName))}/owner`,
        method: 'PUT',
        body: queryArg.changeOwner,
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as vincentApiClientNode };
export type ListAppsApiResponse = /** status 200 Successful operation */ AppListRead;
export type ListAppsApiArg = void;
export type CreateAppApiResponse = /** status 200 Successful operation */ AppRead;
export type CreateAppApiArg = {
  /** Developer-defined application information */
  appCreate: AppCreate;
};
export type GetAppApiResponse = /** status 200 Successful operation */ AppRead;
export type GetAppApiArg = {
  /** ID of the target application */
  appId: number;
};
export type EditAppApiResponse = /** status 200 Successful operation */ AppRead;
export type EditAppApiArg = {
  /** ID of the target application */
  appId: number;
  /** Developer-defined updated application details */
  appEdit: AppEdit;
};
export type DeleteAppApiResponse =
  /** status 200 OK - Resource successfully deleted */ DeleteResponse;
export type DeleteAppApiArg = {
  /** ID of the target application */
  appId: number;
};
export type GetAppVersionsApiResponse = /** status 200 Successful operation */ AppVersionListRead;
export type GetAppVersionsApiArg = {
  /** ID of the target application */
  appId: number;
};
export type CreateAppVersionApiResponse = /** status 200 Successful operation */ AppVersionRead;
export type CreateAppVersionApiArg = {
  /** ID of the target application */
  appId: number;
  /** Developer-defined version details */
  appVersionCreate: AppVersionCreate;
};
export type GetAppVersionApiResponse = /** status 200 Successful operation */ AppVersionRead;
export type GetAppVersionApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  version: number;
};
export type EditAppVersionApiResponse = /** status 200 Successful operation */ AppVersionRead;
export type EditAppVersionApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  version: number;
  /** Update version changes field */
  appVersionEdit: AppVersionEdit;
};
export type EnableAppVersionApiResponse = /** status 200 Successful operation */ AppVersionRead;
export type EnableAppVersionApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  version: number;
};
export type DisableAppVersionApiResponse = /** status 200 Successful operation */ AppVersionRead;
export type DisableAppVersionApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  version: number;
};
export type ListAppVersionToolsApiResponse =
  /** status 200 Successful operation */ AppVersionToolListRead;
export type ListAppVersionToolsApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  version: number;
};
export type CreateAppVersionToolApiResponse =
  /** status 200 Successful operation */ AppVersionToolRead;
export type CreateAppVersionToolApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  appVersion: number;
  /** The NPM package name */
  toolPackageName: string;
  /** Tool configuration for the application version */
  appVersionToolCreate: AppVersionToolCreate;
};
export type EditAppVersionToolApiResponse =
  /** status 200 Successful operation */ AppVersionToolRead;
export type EditAppVersionToolApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  appVersion: number;
  /** The NPM package name */
  toolPackageName: string;
  /** Updated tool configuration for the application version */
  appVersionToolEdit: AppVersionToolEdit;
};
export type ListAllToolsApiResponse = /** status 200 Successful operation */ ToolListRead;
export type ListAllToolsApiArg = void;
export type CreateToolApiResponse = /** status 200 Successful operation */ ToolRead;
export type CreateToolApiArg = {
  /** The NPM package name */
  packageName: string;
  /** Developer-defined tool details */
  toolCreate: ToolCreate;
};
export type GetToolApiResponse = /** status 200 Successful operation */ ToolRead;
export type GetToolApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type EditToolApiResponse = /** status 200 Successful operation */ ToolRead;
export type EditToolApiArg = {
  /** The NPM package name */
  packageName: string;
  /** Developer-defined updated tool details */
  toolEdit: ToolEdit;
};
export type DeleteToolApiResponse = /** status 200 Successful operation */ DeleteResponse;
export type DeleteToolApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type GetToolVersionsApiResponse = /** status 200 Successful operation */ ToolVersionListRead;
export type GetToolVersionsApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type ChangeToolOwnerApiResponse = /** status 200 Successful operation */ ToolRead;
export type ChangeToolOwnerApiArg = {
  /** The NPM package name */
  packageName: string;
  /** Developer-defined updated tool details */
  changeOwner: ChangeOwner;
};
export type CreateToolVersionApiResponse = /** status 200 Successful operation */ ToolVersionRead;
export type CreateToolVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target tool version */
  version: string;
  /** Developer-defined version details */
  toolVersionCreate: ToolVersionCreate;
};
export type GetToolVersionApiResponse = /** status 200 Successful operation */ ToolVersionRead;
export type GetToolVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target tool version */
  version: string;
};
export type EditToolVersionApiResponse = /** status 200 Successful operation */ ToolVersionRead;
export type EditToolVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target tool version */
  version: string;
  /** Update version changes field */
  toolVersionEdit: ToolVersionEdit;
};
export type ListAllPoliciesApiResponse = /** status 200 Successful operation */ PolicyListRead;
export type ListAllPoliciesApiArg = void;
export type CreatePolicyApiResponse = /** status 200 Successful operation */ PolicyRead;
export type CreatePolicyApiArg = {
  /** The NPM package name */
  packageName: string;
  /** Developer-defined policy details */
  policyCreate: PolicyCreate;
};
export type GetPolicyApiResponse = /** status 200 Successful operation */ PolicyRead;
export type GetPolicyApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type EditPolicyApiResponse = /** status 200 Successful operation */ PolicyRead;
export type EditPolicyApiArg = {
  /** The NPM package name */
  packageName: string;
  /** Developer-defined updated policy details */
  policyEdit: PolicyEdit;
};
export type DeletePolicyApiResponse = /** status 200 Successful operation */ DeleteResponse;
export type DeletePolicyApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type CreatePolicyVersionApiResponse =
  /** status 200 Successful operation */ PolicyVersionRead;
export type CreatePolicyVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target policy version */
  version: string;
  /** Developer-defined version details */
  policyVersionCreate: PolicyVersionCreate;
};
export type GetPolicyVersionApiResponse = /** status 200 Successful operation */ PolicyVersionRead;
export type GetPolicyVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target policy version */
  version: string;
};
export type EditPolicyVersionApiResponse = /** status 200 Successful operation */ PolicyVersionRead;
export type EditPolicyVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target policy version */
  version: string;
  /** Update version changes field */
  policyVersionEdit: PolicyVersionEdit;
};
export type GetPolicyVersionsApiResponse =
  /** status 200 Successful operation */ PolicyVersionListRead;
export type GetPolicyVersionsApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type ChangePolicyOwnerApiResponse = /** status 200 Successful operation */ PolicyRead;
export type ChangePolicyOwnerApiArg = {
  /** The NPM package name */
  packageName: string;
  /** Developer-defined updated policy details */
  changeOwner: ChangeOwner;
};
export type App = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Active version of the application */
  activeVersion?: number;
  /** The name of the application */
  name: string;
  /** Description of the application */
  description?: string;
  /** Contact email for the application manager */
  contactEmail?: string;
  /** This should be a landing page for the app. */
  appUserUrl?: string;
  /** Base64 encoded logo image */
  logo?: string;
  /** Redirect URIs users can be sent to after signing up for your application (with their JWT token). */
  redirectUris?: string[];
  /** Identifies if an application is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** App manager's wallet address. Derived from the authorization signature provided by the creator. */
  managerAddress: string;
};
export type AppRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Application ID */
  appId: number;
  /** Active version of the application */
  activeVersion?: number;
  /** The name of the application */
  name: string;
  /** Description of the application */
  description?: string;
  /** Contact email for the application manager */
  contactEmail?: string;
  /** This should be a landing page for the app. */
  appUserUrl?: string;
  /** Base64 encoded logo image */
  logo?: string;
  /** Redirect URIs users can be sent to after signing up for your application (with their JWT token). */
  redirectUris?: string[];
  /** Identifies if an application is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** App manager's wallet address. Derived from the authorization signature provided by the creator. */
  managerAddress: string;
};
export type AppList = App[];
export type AppListRead = AppRead[];
export type Error = {
  /** Error code */
  code?: string;
  /** Error message */
  message: string;
};
export type AppCreate = {
  /** Identifies if an application is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** Contact email for the application manager */
  contactEmail?: string;
  /** This should be a landing page for the app. */
  appUserUrl?: string;
  /** Base64 encoded logo image */
  logo?: string;
  /** Redirect URIs users can be sent to after signing up for your application (with their JWT token). */
  redirectUris?: string[];
  /** App manager's wallet address. Derived from the authorization signature provided by the creator. */
  managerAddress?: string;
  /** The name of the application */
  name: string;
  /** Description of the application */
  description?: string;
};
export type AppEdit = {
  /** The name of the application */
  name?: string;
  /** Description of the application */
  description?: string;
  /** Contact email for the application manager */
  contactEmail?: string;
  /** This should be a landing page for the app. */
  appUserUrl?: string;
  /** Base64 encoded logo image */
  logo?: string;
  /** Redirect URIs users can be sent to after signing up for your application (with their JWT token). */
  redirectUris?: string[];
  /** Identifies if an application is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** Active version of the application */
  activeVersion?: number;
};
export type DeleteResponse = {
  /** Success message */
  message: string;
};
export type AppVersion = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Whether this version is enabled or not */
  enabled: boolean;
  /** Describes what changed between this version and the previous version. */
  changes?: string;
};
export type AppVersionRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Application ID */
  appId: number;
  /** App Version number */
  version: number;
  /** Whether this version is enabled or not */
  enabled: boolean;
  /** Describes what changed between this version and the previous version. */
  changes?: string;
};
export type AppVersionList = AppVersion[];
export type AppVersionListRead = AppVersionRead[];
export type AppVersionCreate = {
  /** Describes what changed between this version and the previous version. */
  changes?: string;
};
export type AppVersionEdit = {
  /** Describes what changed between this version and the previous version. */
  changes?: string;
};
export type AppVersionTool = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Tool package name */
  toolPackageName: string;
  /** Tool version */
  toolVersion: string;
  /** Policies that are supported by this tool, but are hidden from users of this app specifically */
  hiddenSupportedPolicies?: string[];
};
export type AppVersionToolRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Application ID */
  appId: number;
  /** Application version */
  appVersion: number;
  /** Tool package name */
  toolPackageName: string;
  /** Tool version */
  toolVersion: string;
  /** Policies that are supported by this tool, but are hidden from users of this app specifically */
  hiddenSupportedPolicies?: string[];
};
export type AppVersionToolList = AppVersionTool[];
export type AppVersionToolListRead = AppVersionToolRead[];
export type AppVersionToolCreate = {
  /** Policies that are supported by this tool, but are hidden from users of this app specifically */
  hiddenSupportedPolicies?: string[];
  /** Tool version */
  toolVersion: string;
};
export type AppVersionToolEdit = {
  /** Policies that are supported by this tool, but are hidden from users of this app specifically */
  hiddenSupportedPolicies?: string[];
};
export type Tool = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Tool NPM package name */
  packageName: string;
  /** Tool title - displayed to users in the dashboard/Vincent Explorer UI */
  title?: string;
  /** Author wallet address. Derived from the authorization signature provided by the creator. */
  authorWalletAddress: string;
  /** Tool description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
  /** Active version of the tool */
  activeVersion: string;
};
export type ToolRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Tool NPM package name */
  packageName: string;
  /** Tool title - displayed to users in the dashboard/Vincent Explorer UI */
  title?: string;
  /** Author wallet address. Derived from the authorization signature provided by the creator. */
  authorWalletAddress: string;
  /** Tool description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
  /** Active version of the tool */
  activeVersion: string;
};
export type ToolList = Tool[];
export type ToolListRead = ToolRead[];
export type ToolCreate = {
  /** Active version of the tool */
  activeVersion: string;
  /** Tool title - displayed to users in the dashboard/Vincent Explorer UI */
  title?: string;
  /** Tool description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
  /** Author wallet address. Derived from the authorization signature provided by the creator. */
  authorWalletAddress: string;
};
export type ToolEdit = {
  /** Active version of the tool */
  activeVersion?: string;
  /** Tool title - displayed to users in the dashboard/Vincent Explorer UI */
  title?: string;
  /** Tool description - displayed to users in the dashboard/Vincent Explorer UI */
  description?: string;
};
export type ToolVersion = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Tool NPM package name */
  packageName: string;
  /** Tool version - must be an exact semver. */
  version: string;
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
};
export type ToolVersionRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Tool NPM package name */
  packageName: string;
  /** Tool version - must be an exact semver. */
  version: string;
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
  /** Supported policies. These are detected from 'dependencies' in the tool's package.json. */
  supportedPolicies: string[];
  /** IPFS CID of the code that implements this tool. */
  ipfsCid: string;
};
export type ToolVersionList = ToolVersion[];
export type ToolVersionListRead = ToolVersionRead[];
export type ChangeOwner = {
  /** New owner address */
  authorWalletAddress: string;
};
export type ToolVersionCreate = {
  /** Changelog information for this version */
  changes: string;
};
export type ToolVersionEdit = {
  /** Changelog information for this version */
  changes: string;
};
export type Policy = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Policy NPM package name */
  packageName: string;
  /** Author wallet address. Derived from the authorization signature provided by the creator. */
  authorWalletAddress: string;
  /** Policy description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
  /** Active version of the policy; must be an exact semver */
  activeVersion: string;
  /** Policy title for displaying to users in the dashboard/Vincent Explorer UI */
  title: string;
};
export type PolicyRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Policy NPM package name */
  packageName: string;
  /** Author wallet address. Derived from the authorization signature provided by the creator. */
  authorWalletAddress: string;
  /** Policy description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
  /** Active version of the policy; must be an exact semver */
  activeVersion: string;
  /** Policy title for displaying to users in the dashboard/Vincent Explorer UI */
  title: string;
};
export type PolicyList = Policy[];
export type PolicyListRead = PolicyRead[];
export type PolicyCreate = {
  /** Active version of the policy; must be an exact semver */
  activeVersion: string;
  /** Policy title for displaying to users in the dashboard/Vincent Explorer UI */
  title: string;
  /** Policy description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
  /** Author wallet address. Derived from the authorization signature provided by the creator. */
  authorWalletAddress: string;
};
export type PolicyEdit = {
  /** Active version of the policy; must be an exact semver */
  activeVersion?: string;
  /** Policy title for displaying to users in the dashboard/Vincent Explorer UI */
  title?: string;
  /** Policy description - displayed to users in the dashboard/Vincent Explorer UI */
  description?: string;
};
export type PolicyVersion = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Policy NPM package name */
  packageName: string;
  /** Policy version - must be an exact semver */
  version: string;
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
};
export type PolicyVersionRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Policy NPM package name */
  packageName: string;
  /** Policy version - must be an exact semver */
  version: string;
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
  /** IPFS CID of the code that implements this policy. */
  ipfsCid: string;
  /** Schema parameters */
  parameters?: {
    /** UI Schema for parameter display */
    uiSchema: string;
    /** JSON Schema for parameter validation */
    jsonSchema: string;
  };
};
export type PolicyVersionCreate = {
  /** Changelog information for this version */
  changes: string;
};
export type PolicyVersionEdit = {
  /** Changelog information for this version */
  changes: string;
};
export type PolicyVersionList = PolicyVersion[];
export type PolicyVersionListRead = PolicyVersionRead[];
