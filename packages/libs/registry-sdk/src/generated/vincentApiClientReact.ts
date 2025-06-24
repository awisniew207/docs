import { baseVincentRtkApiReact as api } from '../lib/internal/baseVincentRtkApiReact';
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    listApps: build.query<ListAppsApiResponse, ListAppsApiArg>({
      query: () => ({ url: `/apps` }),
    }),
    createApp: build.mutation<CreateAppApiResponse, CreateAppApiArg>({
      query: (queryArg) => ({ url: `/app`, method: 'POST', body: queryArg.appCreate }),
    }),
    getApp: build.query<GetAppApiResponse, GetAppApiArg>({
      query: (queryArg) => ({ url: `/app/${queryArg.appId}` }),
    }),
    editApp: build.mutation<EditAppApiResponse, EditAppApiArg>({
      query: (queryArg) => ({
        url: `/app/${queryArg.appId}`,
        method: 'PUT',
        body: queryArg.appEdit,
      }),
    }),
    deleteApp: build.mutation<DeleteAppApiResponse, DeleteAppApiArg>({
      query: (queryArg) => ({ url: `/app/${queryArg.appId}`, method: 'DELETE' }),
    }),
    getAppVersions: build.query<GetAppVersionsApiResponse, GetAppVersionsApiArg>({
      query: (queryArg) => ({ url: `/app/${queryArg.appId}/versions` }),
    }),
    createAppVersion: build.mutation<CreateAppVersionApiResponse, CreateAppVersionApiArg>({
      query: (queryArg) => ({
        url: `/app/${queryArg.appId}/version/${queryArg.version}`,
        method: 'POST',
        body: queryArg.appVersionCreate,
      }),
    }),
    getAppVersion: build.query<GetAppVersionApiResponse, GetAppVersionApiArg>({
      query: (queryArg) => ({ url: `/app/${queryArg.appId}/version/${queryArg.version}` }),
    }),
    editAppVersion: build.mutation<EditAppVersionApiResponse, EditAppVersionApiArg>({
      query: (queryArg) => ({
        url: `/app/${queryArg.appId}/version/${queryArg.version}`,
        method: 'PUT',
        body: queryArg.appVersionEdit,
      }),
    }),
    enableAppVersion: build.mutation<EnableAppVersionApiResponse, EnableAppVersionApiArg>({
      query: (queryArg) => ({
        url: `/app/${queryArg.appId}/version/${queryArg.version}/enable`,
        method: 'POST',
      }),
    }),
    disableAppVersion: build.mutation<DisableAppVersionApiResponse, DisableAppVersionApiArg>({
      query: (queryArg) => ({
        url: `/app/${queryArg.appId}/version/${queryArg.version}/disable`,
        method: 'POST',
      }),
    }),
    listAppVersionTools: build.query<ListAppVersionToolsApiResponse, ListAppVersionToolsApiArg>({
      query: (queryArg) => ({ url: `/app/${queryArg.appId}/version/${queryArg.appVersion}/tools` }),
    }),
    createAppVersionTool: build.mutation<
      CreateAppVersionToolApiResponse,
      CreateAppVersionToolApiArg
    >({
      query: (queryArg) => ({
        url: `/app/${queryArg.appId}/version/${queryArg.appVersion}/tool/${queryArg.toolPackageName}`,
        method: 'POST',
        body: queryArg.appVersionToolCreate,
      }),
    }),
    listAllTools: build.query<ListAllToolsApiResponse, ListAllToolsApiArg>({
      query: () => ({ url: `/tools` }),
    }),
    createTool: build.mutation<CreateToolApiResponse, CreateToolApiArg>({
      query: (queryArg) => ({ url: `/tool`, method: 'POST', body: queryArg.toolCreate }),
    }),
    getTool: build.query<GetToolApiResponse, GetToolApiArg>({
      query: (queryArg) => ({ url: `/tool/${queryArg.packageName}` }),
    }),
    editTool: build.mutation<EditToolApiResponse, EditToolApiArg>({
      query: (queryArg) => ({
        url: `/tool/${queryArg.packageName}`,
        method: 'PUT',
        body: queryArg.toolEdit,
      }),
    }),
    getToolVersions: build.query<GetToolVersionsApiResponse, GetToolVersionsApiArg>({
      query: (queryArg) => ({ url: `/tool/${queryArg.packageName}/versions` }),
    }),
    changeToolOwner: build.mutation<ChangeToolOwnerApiResponse, ChangeToolOwnerApiArg>({
      query: (queryArg) => ({
        url: `/tool/${queryArg.packageName}/owner`,
        method: 'PUT',
        body: queryArg.changeOwner,
      }),
    }),
    createToolVersion: build.mutation<CreateToolVersionApiResponse, CreateToolVersionApiArg>({
      query: (queryArg) => ({
        url: `/tool/${queryArg.packageName}/version/${queryArg.version}`,
        method: 'POST',
        body: queryArg.toolVersionCreate,
      }),
    }),
    getToolVersion: build.query<GetToolVersionApiResponse, GetToolVersionApiArg>({
      query: (queryArg) => ({ url: `/tool/${queryArg.packageName}/version/${queryArg.version}` }),
    }),
    editToolVersion: build.mutation<EditToolVersionApiResponse, EditToolVersionApiArg>({
      query: (queryArg) => ({
        url: `/tool/${queryArg.packageName}/version/${queryArg.version}`,
        method: 'PUT',
        body: queryArg.toolVersionEdit,
      }),
    }),
    listAllPolicies: build.query<ListAllPoliciesApiResponse, ListAllPoliciesApiArg>({
      query: () => ({ url: `/policies` }),
    }),
    createPolicy: build.mutation<CreatePolicyApiResponse, CreatePolicyApiArg>({
      query: (queryArg) => ({ url: `/policy`, method: 'POST', body: queryArg.policyCreate }),
    }),
    getPolicy: build.query<GetPolicyApiResponse, GetPolicyApiArg>({
      query: (queryArg) => ({ url: `/policy/${queryArg.packageName}` }),
    }),
    editPolicy: build.mutation<EditPolicyApiResponse, EditPolicyApiArg>({
      query: (queryArg) => ({
        url: `/policy/${queryArg.packageName}`,
        method: 'PUT',
        body: queryArg.policyEdit,
      }),
    }),
    createPolicyVersion: build.mutation<CreatePolicyVersionApiResponse, CreatePolicyVersionApiArg>({
      query: (queryArg) => ({
        url: `/policy/${queryArg.packageName}/version/${queryArg.version}`,
        method: 'POST',
        body: queryArg.policyVersionCreate,
      }),
    }),
    getPolicyVersion: build.query<GetPolicyVersionApiResponse, GetPolicyVersionApiArg>({
      query: (queryArg) => ({ url: `/policy/${queryArg.packageName}/version/${queryArg.version}` }),
    }),
    editPolicyVersion: build.mutation<EditPolicyVersionApiResponse, EditPolicyVersionApiArg>({
      query: (queryArg) => ({
        url: `/policy/${queryArg.packageName}/version/${queryArg.version}`,
        method: 'PUT',
        body: queryArg.policyVersionEdit,
      }),
    }),
    getPolicyVersions: build.query<GetPolicyVersionsApiResponse, GetPolicyVersionsApiArg>({
      query: (queryArg) => ({ url: `/policy/${queryArg.packageName}/versions` }),
    }),
    changePolicyOwner: build.mutation<ChangePolicyOwnerApiResponse, ChangePolicyOwnerApiArg>({
      query: (queryArg) => ({
        url: `/policy/${queryArg.packageName}/owner`,
        method: 'PUT',
        body: queryArg.changeOwner,
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as vincentApiClientReact };
export type ListAppsApiResponse = /** status 200 Successful operation */ AppListRead;
export type ListAppsApiArg = void;
export type CreateAppApiResponse = /** status 200 Successful operation */ AppRead;
export type CreateAppApiArg = {
  /** Developer-defined application information */
  appCreate: AppCreate;
};
export type GetAppApiResponse = /** status 200 Successful operation */ AppRead;
export type GetAppApiArg = {
  /** ID of the application to retrieve */
  appId: number;
};
export type EditAppApiResponse = /** status 200 Successful operation */ AppRead;
export type EditAppApiArg = {
  /** ID of the application to edit */
  appId: number;
  /** Developer-defined updated application details */
  appEdit: AppEdit;
};
export type DeleteAppApiResponse =
  /** status 200 OK - Resource successfully deleted */ DeleteResponse;
export type DeleteAppApiArg = {
  /** ID of the application to delete */
  appId: number;
};
export type GetAppVersionsApiResponse = /** status 200 Successful operation */ AppVersionListRead;
export type GetAppVersionsApiArg = {
  /** ID of the application whose versions will be fetched */
  appId: number;
};
export type CreateAppVersionApiResponse = /** status 200 Successful operation */ AppVersionRead;
export type CreateAppVersionApiArg = {
  /** ID of the application to create a new version for */
  appId: number;
  /** Version number to create */
  version: string;
  /** Developer-defined version details */
  appVersionCreate: AppVersionCreate;
};
export type GetAppVersionApiResponse = /** status 200 Successful operation */ AppVersionRead;
export type GetAppVersionApiArg = {
  /** ID of the application to retrieve a version for */
  appId: number;
  /** Version number to retrieve */
  version: number;
};
export type EditAppVersionApiResponse = /** status 200 Successful operation */ AppVersionRead;
export type EditAppVersionApiArg = {
  /** ID of the application to edit a version for */
  appId: number;
  /** Version number to edit */
  version: number;
  /** Update version changes field */
  appVersionEdit: AppVersionEdit;
};
export type EnableAppVersionApiResponse = /** status 200 Successful operation */ AppVersionRead;
export type EnableAppVersionApiArg = {
  /** ID of the application to enable a version for */
  appId: number;
  /** Version number to enable */
  version: number;
};
export type DisableAppVersionApiResponse = /** status 200 Successful operation */ AppVersionRead;
export type DisableAppVersionApiArg = {
  /** ID of the application to disable a version for */
  appId: number;
  /** Version number to enable */
  version: number;
};
export type ListAppVersionToolsApiResponse =
  /** status 200 Successful operation */ AppVersionToolListRead;
export type ListAppVersionToolsApiArg = {
  /** ID of the application */
  appId: number;
  /** Version number of the application */
  appVersion: number;
};
export type CreateAppVersionToolApiResponse =
  /** status 200 Successful operation */ AppVersionToolRead;
export type CreateAppVersionToolApiArg = {
  /** ID of the application */
  appId: number;
  /** Version number of the application */
  appVersion: number;
  /** Name of the tool package */
  toolPackageName: string;
  /** Tool configuration for the application version */
  appVersionToolCreate: AppVersionToolCreate;
};
export type ListAllToolsApiResponse = /** status 200 Successful operation */ ToolListRead;
export type ListAllToolsApiArg = void;
export type CreateToolApiResponse = /** status 200 Successful operation */ ToolReadRead;
export type CreateToolApiArg = {
  /** Developer-defined tool details */
  toolCreate: ToolCreate;
};
export type GetToolApiResponse = /** status 200 Successful operation */ ToolReadRead;
export type GetToolApiArg = {
  /** Package name of the tool to retrieve */
  packageName: string;
};
export type EditToolApiResponse = /** status 200 Successful operation */ ToolReadRead;
export type EditToolApiArg = {
  /** Package name of the tool to edit */
  packageName: string;
  /** Developer-defined updated tool details */
  toolEdit: ToolEdit;
};
export type GetToolVersionsApiResponse = /** status 200 Successful operation */ ToolVersionListRead;
export type GetToolVersionsApiArg = {
  /** Package name of the tool to fetch versions for */
  packageName: string;
};
export type ChangeToolOwnerApiResponse = /** status 200 Successful operation */ ToolReadRead;
export type ChangeToolOwnerApiArg = {
  /** Package name of the tool to change the owner of */
  packageName: string;
  /** Developer-defined updated tool details */
  changeOwner: ChangeOwner;
};
export type CreateToolVersionApiResponse =
  /** status 200 Successful operation */ ToolVersionReadRead;
export type CreateToolVersionApiArg = {
  /** Package name of the tool to create a new version for */
  packageName: string;
  /** Version number to create */
  version: string;
  /** Developer-defined version details */
  toolVersionCreate: ToolVersionCreate;
};
export type GetToolVersionApiResponse = /** status 200 Successful operation */ ToolVersionReadRead;
export type GetToolVersionApiArg = {
  /** Package name of the tool to retrieve a version for */
  packageName: string;
  /** Version number to retrieve */
  version: string;
};
export type EditToolVersionApiResponse = /** status 200 Successful operation */ ToolVersionReadRead;
export type EditToolVersionApiArg = {
  /** Package name of the tool to edit a version for */
  packageName: string;
  /** Version number to edit */
  version: string;
  /** Update version changes field */
  toolVersionEdit: ToolVersionEdit;
};
export type ListAllPoliciesApiResponse = /** status 200 Successful operation */ PolicyListRead;
export type ListAllPoliciesApiArg = void;
export type CreatePolicyApiResponse = /** status 200 Successful operation */ PolicyReadRead;
export type CreatePolicyApiArg = {
  /** Developer-defined policy details */
  policyCreate: PolicyCreate;
};
export type GetPolicyApiResponse = /** status 200 Successful operation */ PolicyReadRead;
export type GetPolicyApiArg = {
  /** Package name of the policy to retrieve */
  packageName: string;
};
export type EditPolicyApiResponse = /** status 200 Successful operation */ PolicyReadRead;
export type EditPolicyApiArg = {
  /** Package name of the policy to edit */
  packageName: string;
  /** Developer-defined updated policy details */
  policyEdit: PolicyEdit;
};
export type CreatePolicyVersionApiResponse =
  /** status 200 Successful operation */ PolicyVersionReadRead;
export type CreatePolicyVersionApiArg = {
  /** Package name of the policy to create a new version for */
  packageName: string;
  /** Version number to create */
  version: string;
  /** Developer-defined version details */
  policyVersionCreate: PolicyVersionCreate;
};
export type GetPolicyVersionApiResponse =
  /** status 200 Successful operation */ PolicyVersionReadRead;
export type GetPolicyVersionApiArg = {
  /** Package name of the policy to retrieve a version for */
  packageName: string;
  /** Version number to retrieve */
  version: string;
};
export type EditPolicyVersionApiResponse =
  /** status 200 Successful operation */ PolicyVersionReadRead;
export type EditPolicyVersionApiArg = {
  /** Package name of the policy to edit a version for */
  packageName: string;
  /** Version number to edit */
  version: string;
  /** Update version changes field */
  policyVersionEdit: PolicyVersionEdit;
};
export type GetPolicyVersionsApiResponse =
  /** status 200 Successful operation */ PolicyVersionListRead;
export type GetPolicyVersionsApiArg = {
  /** Package name of the policy to fetch versions for */
  packageName: string;
};
export type ChangePolicyOwnerApiResponse = /** status 200 Successful operation */ PolicyReadRead;
export type ChangePolicyOwnerApiArg = {
  /** Package name of the policy to change the owner of */
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
  /** The name of the application */
  name: string;
  /** Description of the application */
  description?: string;
};
export type AppEdit = {
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
  /** The name of the application */
  name: string;
  description: string;
};
export type AppEditRead = {
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
  /** Application ID */
  appId: number;
  /** The name of the application */
  name: string;
  description: string;
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
export type AppVersionCreateRead = {
  /** Describes what changed between this version and the previous version. */
  changes?: string;
  /** Application ID */
  appId: number;
  /** App Version number */
  version: number;
};
export type AppVersionEdit = {
  /** Describes what changed between this version and the previous version. */
  changes?: string;
  /** Whether this version is enabled or not */
  enabled?: boolean;
};
export type AppVersionEditRead = {
  /** Describes what changed between this version and the previous version. */
  changes?: string;
  /** Whether this version is enabled or not */
  enabled?: boolean;
  /** Application ID */
  appId: number;
  /** App Version number */
  version: number;
};
export type AppVersionTool = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Application version */
  appVersion: number;
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
  /** Application version */
  appVersion: number;
  /** Tool package name */
  toolPackageName: string;
  /** Tool version */
  toolVersion: string;
};
export type AppVersionToolCreateRead = {
  /** Policies that are supported by this tool, but are hidden from users of this app specifically */
  hiddenSupportedPolicies?: string[];
  /** Application ID */
  appId: number;
  /** Application version */
  appVersion: number;
  /** Tool package name */
  toolPackageName: string;
  /** Tool version */
  toolVersion: string;
};
export type ToolRead = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Tool NPM package name */
  packageName: string;
  /** Tool title - displayed to users in the dashboard/Vincent Explorer UI */
  title?: string;
  /** Tool description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
  /** Active version of the tool */
  activeVersion: string;
};
export type ToolReadRead = {
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
export type ToolList = ToolRead[];
export type ToolListRead = ToolReadRead[];
export type ToolCreate = {
  /** Tool NPM package name */
  packageName: string;
  /** Active version of the tool */
  activeVersion: string;
  /** Tool title - displayed to users in the dashboard/Vincent Explorer UI */
  title?: string;
  /** Tool description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
};
export type ToolEdit = {
  /** Active version of the tool */
  activeVersion?: string;
  /** Tool title - displayed to users in the dashboard/Vincent Explorer UI */
  title?: string;
  /** Tool description - displayed to users in the dashboard/Vincent Explorer UI */
  description?: string;
  /** Tool NPM package name */
  packageName: string;
};
export type ToolVersionRead = {
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
export type ToolVersionReadRead = {
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
export type ToolVersionList = ToolVersionRead[];
export type ToolVersionListRead = ToolVersionReadRead[];
export type ChangeOwner = {
  /** New owner address */
  authorWalletAddress: string;
};
export type ToolVersionCreate = {
  /** Changelog information for this version */
  changes: string;
  /** Tool NPM package name */
  packageName: string;
  /** Tool version - must be an exact semver. */
  version: string;
};
export type ToolVersionEdit = {
  /** Changelog information for this version */
  changes: string;
  /** Tool NPM package name */
  packageName: string;
  /** Tool version - must be an exact semver. */
  version: string;
};
export type PolicyRead = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Policy NPM package name */
  packageName: string;
  /** Policy description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
  /** Active version of the policy; must be an exact semver */
  activeVersion: string;
  /** Policy title for displaying to users in the dashboard/Vincent Explorer UI */
  title: string;
};
export type PolicyReadRead = {
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
export type PolicyList = PolicyRead[];
export type PolicyListRead = PolicyReadRead[];
export type PolicyCreate = {
  /** Policy NPM package name */
  packageName: string;
  /** Active version of the policy; must be an exact semver */
  activeVersion: string;
  /** Policy title for displaying to users in the dashboard/Vincent Explorer UI */
  title: string;
  /** Policy description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
};
export type PolicyEdit = {
  /** Active version of the policy; must be an exact semver */
  activeVersion?: string;
  /** Policy title for displaying to users in the dashboard/Vincent Explorer UI */
  title?: string;
  /** Policy description - displayed to users in the dashboard/Vincent Explorer UI */
  description?: string;
  /** Policy NPM package name */
  packageName: string;
};
export type PolicyVersionRead = {
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
export type PolicyVersionReadRead = {
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
  /** Policy NPM package name */
  packageName: string;
  /** Policy version - must be an exact semver */
  version: string;
};
export type PolicyVersionEdit = {
  /** Changelog information for this version */
  changes: string;
  /** Policy NPM package name */
  packageName: string;
  /** Policy version - must be an exact semver */
  version: string;
};
export type PolicyVersionList = PolicyVersionRead[];
export type PolicyVersionListRead = PolicyVersionReadRead[];
export const {
  useListAppsQuery,
  useLazyListAppsQuery,
  useCreateAppMutation,
  useGetAppQuery,
  useLazyGetAppQuery,
  useEditAppMutation,
  useDeleteAppMutation,
  useGetAppVersionsQuery,
  useLazyGetAppVersionsQuery,
  useCreateAppVersionMutation,
  useGetAppVersionQuery,
  useLazyGetAppVersionQuery,
  useEditAppVersionMutation,
  useEnableAppVersionMutation,
  useDisableAppVersionMutation,
  useListAppVersionToolsQuery,
  useLazyListAppVersionToolsQuery,
  useCreateAppVersionToolMutation,
  useListAllToolsQuery,
  useLazyListAllToolsQuery,
  useCreateToolMutation,
  useGetToolQuery,
  useLazyGetToolQuery,
  useEditToolMutation,
  useGetToolVersionsQuery,
  useLazyGetToolVersionsQuery,
  useChangeToolOwnerMutation,
  useCreateToolVersionMutation,
  useGetToolVersionQuery,
  useLazyGetToolVersionQuery,
  useEditToolVersionMutation,
  useListAllPoliciesQuery,
  useLazyListAllPoliciesQuery,
  useCreatePolicyMutation,
  useGetPolicyQuery,
  useLazyGetPolicyQuery,
  useEditPolicyMutation,
  useCreatePolicyVersionMutation,
  useGetPolicyVersionQuery,
  useLazyGetPolicyVersionQuery,
  useEditPolicyVersionMutation,
  useGetPolicyVersionsQuery,
  useLazyGetPolicyVersionsQuery,
  useChangePolicyOwnerMutation,
} = injectedRtkApi;
