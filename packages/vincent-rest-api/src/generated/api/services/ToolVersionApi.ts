/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { Error } from '../models/Error';
import type { ICreateToolVersionDef } from '../models/ICreateToolVersionDef';
import type { IToolVersionDef } from '../models/IToolVersionDef';
import type { VersionChanges } from '../models/VersionChanges';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ToolVersionApi {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Creates a tool version
   * @param identity Identity of the tool to create a new version for
   * @param requestBody Developer-defined version details
   * @returns IToolVersionDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public createToolVersion(
    identity: string,
    requestBody: ICreateToolVersionDef,
  ): CancelablePromise<IToolVersionDef | Error> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/tool/version/{identity}',
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
   * Fetches a tool version
   * @param identity Identity of the tool version to retrieve
   * @returns IToolVersionDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public getToolVersion(identity: string): CancelablePromise<IToolVersionDef | Error> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/tool/version/{identity}',
      path: {
        identity: identity,
      },
      errors: {
        404: `Tool version not found`,
      },
    });
  }
  /**
   * Edits a tool version
   * @param identity Identity of the tool version to edit
   * @param requestBody Update version changes field
   * @returns IToolVersionDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public editToolVersion(
    identity: string,
    requestBody: VersionChanges,
  ): CancelablePromise<IToolVersionDef | Error> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/tool/version/{identity}',
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
}
