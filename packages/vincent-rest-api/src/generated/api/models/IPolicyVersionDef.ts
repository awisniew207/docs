/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type IPolicyVersionDef = {
  /**
   * Policy package name
   */
  packageName: string;
  /**
   * Policy version
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
   * Policy description
   */
  description: string;
  /**
   * Keywords for the policy
   */
  keywords: Array<string>;
  /**
   * Dependencies of the policy
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
   * Policy homepage
   */
  homepage?: string;
  /**
   * Policy status
   */
  status: IPolicyVersionDef.status;
  /**
   * IPFS CID
   */
  ipfsCid: string;
  /**
   * Schema parameters
   */
  parameters: {
    /**
     * UI Schema for parameter display
     */
    uiSchema: string;
    /**
     * JSON Schema for parameter validation
     */
    jsonSchema: string;
  };
};
export namespace IPolicyVersionDef {
  /**
   * Policy status
   */
  export enum status {
    INVALID = 'invalid',
    VALIDATING = 'validating',
    VALID = 'valid',
    ERROR = 'error',
  }
}
