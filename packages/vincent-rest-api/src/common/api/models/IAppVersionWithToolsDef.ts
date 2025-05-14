/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Application version with its tools
 */
export type IAppVersionWithToolsDef = {
  version: {
    /**
     * Application ID
     */
    readonly appId: number;
    /**
     * Version number
     */
    versionNumber: number;
    /**
     * Unique composite identifier in the format AppVersionDef|<appId>@<versionNumber>
     */
    readonly identity: string;
    /**
     * Whether this version is enabled
     */
    enabled: boolean;
    /**
     * Changelog information for this version
     */
    changes: string;
  };
  tools: Array<{
    /**
     * Application ID
     */
    readonly appId: number;
    /**
     * Application version number
     */
    appVersionNumber: number;
    /**
     * Tool package name
     */
    toolPackageName: string;
    /**
     * Tool version
     */
    toolVersion: string;
    /**
     * Tool identity
     */
    toolIdentity: string;
    /**
     * Unique composite identifier
     */
    identity: string;
  }>;
};
