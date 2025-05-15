/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
export type AppVersionsArray = Array<{
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
}>;
