/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { Error } from '../models/Error';
import type { IAppVersionDef } from '../models/IAppVersionDef';
import type { IAppVersionWithToolsDef } from '../models/IAppVersionWithToolsDef';
import type { ICreateAppVersionDef } from '../models/ICreateAppVersionDef';
import type { VersionChanges } from '../models/VersionChanges';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AppVersionApi {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Creates an application version
   * @param identity Identity of the application to create a new version for
   * @param requestBody Developer-defined version details
   * @returns IAppVersionDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public createAppVersion(
    identity: string,
    requestBody: ICreateAppVersionDef,
  ): CancelablePromise<IAppVersionDef | Error> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/app/version/{identity}',
      path: {
        identity: identity,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Invalid input`,
        422: `Validation exception`,
      },
    });
  }
  /**
   * Fetches an application version
   * @param identity Identity of the application version to retrieve
   * @returns IAppVersionWithToolsDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public getAppVersion(identity: string): CancelablePromise<IAppVersionWithToolsDef | Error> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/app/version/{identity}',
      path: {
        identity: identity,
      },
      errors: {
        404: `Application not found`,
      },
    });
  }
  /**
   * Edits an application version
   * @param identity Identity of the application version to edit
   * @param requestBody Update version changes field
   * @returns IAppVersionDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public editAppVersion(
    identity: string,
    requestBody: VersionChanges,
  ): CancelablePromise<IAppVersionDef | Error> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/app/version/{identity}',
      path: {
        identity: identity,
      },
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Invalid input`,
        422: `Validation exception`,
      },
    });
  }
  /**
   * Toggles enabled/disabled for an application version
   * @param identity Identity of the application version to toggle
   * @returns IAppVersionDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public toggleAppVersion(identity: string): CancelablePromise<IAppVersionDef | Error> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/app/version/{identity}/toggle',
      path: {
        identity: identity,
      },
      errors: {
        400: `Invalid input`,
        422: `Validation exception`,
      },
    });
  }
}
