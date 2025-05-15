/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type IAppDef = {
  /**
   * The name of the application
   */
  name: string;
  /**
   * Description of the application
   */
  description: string;
  /**
   * Contact email for the application
   */
  contactEmail: string;
  /**
   * URL of the application for users
   */
  appUserUrl: string;
  /**
   * Base64 encoded logo image
   */
  logo: string;
  /**
   * Redirect URIs for the application
   */
  redirectUris: Array<string>;
  /**
   * Deployment status of the application
   */
  deploymentStatus: IAppDef.deploymentStatus;
  /**
   * Manager wallet address
   */
  managerAddress: string;
  /**
   * Active version of the application
   */
  activeVersion: number;
  /**
   * Unique composite identifier in the format AppDef|<appId>
   */
  readonly identity: string;
  /**
   * Application ID
   */
  readonly appId: number;
  /**
   * Last updated timestamp
   */
  readonly lastUpdated: string;
};
export namespace IAppDef {
  /**
   * Deployment status of the application
   */
  export enum deploymentStatus {
    DEV = 'dev',
    TEST = 'test',
    PROD = 'prod',
  }
}
