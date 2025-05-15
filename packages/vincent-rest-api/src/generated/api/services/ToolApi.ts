/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { DeleteResponse } from '../models/DeleteResponse';
import type { Error } from '../models/Error';
import type { ICreateToolDef } from '../models/ICreateToolDef';
import type { IEditToolDef } from '../models/IEditToolDef';
import type { IToolDef } from '../models/IToolDef';
import type { IToolVersionDef } from '../models/IToolVersionDef';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ToolApi {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Creates a new tool
   * @param requestBody Developer-defined tool details
   * @returns IToolDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public createTool(requestBody: ICreateToolDef): CancelablePromise<IToolDef | Error> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/tool',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Invalid input`,
        422: `Validation exception`,
      },
    });
  }
  /**
   * Fetches a tool
   * @param identity Identity of the tool to retrieve
   * @returns IToolDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public getTool(identity: string): CancelablePromise<IToolDef | Error> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/tool/{identity}',
      path: {
        identity: identity,
      },
      errors: {
        404: `Tool not found`,
      },
    });
  }
  /**
   * Edits a tool
   * @param identity Identity of the tool to edit
   * @param requestBody Developer-defined updated tool details
   * @returns IToolDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public editTool(
    identity: string,
    requestBody: IEditToolDef,
  ): CancelablePromise<IToolDef | Error> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/tool/{identity}',
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
   * Deletes a tool
   * @param identity Identity of the tool to delete
   * @returns DeleteResponse Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public deleteTool(identity: string): CancelablePromise<DeleteResponse | Error> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/tool/{identity}',
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
   * Fetches all versions of a tool
   * @param identity Identity of the tool to fetch versions for
   * @returns IToolVersionDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public getToolVersions(identity: string): CancelablePromise<Array<IToolVersionDef> | Error> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/tool/{identity}/versions',
      path: {
        identity: identity,
      },
      errors: {
        404: `Tool not found`,
      },
    });
  }
  /**
   * Changes a tool's owner
   * @param identity Identity of the tool to change the owner of
   * @param requestBody Developer-defined updated tool details
   * @returns IToolDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public changeToolOwner(
    identity: string,
    requestBody: {
      /**
       * New author wallet address
       */
      authorWalletAddress: string;
    },
  ): CancelablePromise<IToolDef | Error> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/tool/{identity}/owner',
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
