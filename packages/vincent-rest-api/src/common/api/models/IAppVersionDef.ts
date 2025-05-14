/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */

export type IAppVersionDef = {
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
