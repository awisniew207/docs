/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type IToolVersionDef = {
  /**
   * Tool package name
   */
  packageName: string;
  /**
   * Tool version
   */
  version: string;
  /**
   * Unique composite identifier
   */
  identity: string;
  /**
   * Changelog information for this version
   */
  changes: string;
  /**
   * Repository URLs
   */
  repository: Array<string>;
  /**
   * Keywords for the tool
   */
  keywords: Array<string>;
  /**
   * Dependencies of the tool
   */
  dependencies: Array<string>;
  /**
   * Author information
   */
  author: {
    /**
     * Name of the author
     */
    name: string;
    /**
     * Email of the author
     */
    email: string;
    /**
     * URL of the author's website
     */
    url?: string;
  };
  /**
   * Contributors information
   */
  contributors: Array<{
    /**
     * Name of the contributor
     */
    name: string;
    /**
     * Email of the contributor
     */
    email: string;
    /**
     * URL of the contributor's website
     */
    url?: string;
  }>;
  /**
   * Tool homepage
   */
  homepage?: string;
  /**
   * Tool status
   */
  status: IToolVersionDef.status;
  /**
   * Supported policies
   */
  supportedPolicies: Array<string>;
  /**
   * IPFS CID
   */
  ipfsCid: string;
};
export namespace IToolVersionDef {
  /**
   * Tool status
   */
  export enum status {
    INVALID = 'invalid',
    VALIDATING = 'validating',
    VALID = 'valid',
    ERROR = 'error',
  }
}
