/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { Error } from '../models/Error';
import type { ICreatePolicyDef } from '../models/ICreatePolicyDef';
import type { IEditPolicyDef } from '../models/IEditPolicyDef';
import type { IPolicyDef } from '../models/IPolicyDef';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class PolicyApi {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Creates a new policy
   * @param requestBody Developer-defined policy details
   * @returns IPolicyDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public createPolicy(requestBody: ICreatePolicyDef): CancelablePromise<IPolicyDef | Error> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/policy',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        400: `Invalid input`,
        422: `Validation exception`,
      },
    });
  }
  /**
   * Fetches a policy
   * @param identity Identity of the policy to retrieve
   * @returns IPolicyDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public getPolicy(identity: string): CancelablePromise<IPolicyDef | Error> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/policy/{identity}',
      path: {
        identity: identity,
      },
      errors: {
        404: `Policy not found`,
      },
    });
  }
  /**
   * Edits a policy
   * @param identity Identity of the policy to edit
   * @param requestBody Developer-defined updated policy details
   * @returns IPolicyDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public editPolicy(
    identity: string,
    requestBody: IEditPolicyDef,
  ): CancelablePromise<IPolicyDef | Error> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/policy/{identity}',
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
