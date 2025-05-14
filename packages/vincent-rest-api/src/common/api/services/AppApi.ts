/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */

import type { AppVersionsArray } from '../models/AppVersionsArray';
import type { DeleteResponse } from '../models/DeleteResponse';
import type { Error } from '../models/Error';
import type { IAppDef } from '../models/IAppDef';
import type { ICreateAppDef } from '../models/ICreateAppDef';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class AppApi {
  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * Creates a new application
   * @param requestBody Developer-defined application information
   * @returns IAppDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public createApp(requestBody: ICreateAppDef): CancelablePromise<IAppDef | Error> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/app',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Invalid input`,
        422: `Validation exception`,
      },
    });
  }

  /**
   * Fetches an application
   * @param identity Identity of the application to retrieve
   * @returns IAppDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public getApp(identity: string): CancelablePromise<IAppDef | Error> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/app/{identity}',
      path: {
        identity: identity,
      },
      errors: {
        404: `Application not found`,
      },
    });
  }

  /**
   * Edits an application
   * @param identity Identity of the application to edit
   * @param requestBody Developer-defined updated application details
   * @returns IAppDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public editApp(identity: string, requestBody: ICreateAppDef): CancelablePromise<IAppDef | Error> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/app/{identity}',
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
   * Deletes an application
   * @param identity Identity of the application to delete
   * @returns DeleteResponse OK - Resource successfully deleted
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public deleteApp(identity: string): CancelablePromise<DeleteResponse | Error> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/app/{identity}',
      path: {
        identity: identity,
      },
      errors: {
        400: `Invalid input`,
        422: `Validation exception`,
      },
    });
  }

  /**
   * Fetches all versions of an application
   * @param identity Identity of the application whose versions will be fetched
   * @returns AppVersionsArray Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public getAppVersions(identity: string): CancelablePromise<AppVersionsArray | Error> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/app/{identity}/versions',
      path: {
        identity: identity,
      },
      errors: {
        404: `Application not found`,
      },
    });
  }
}
