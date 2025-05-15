/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { Error } from '../models/Error';
import type { IPolicyVersionDef } from '../models/IPolicyVersionDef';
import type { PolicyVersionsArray } from '../models/PolicyVersionsArray';
import type { VersionChanges } from '../models/VersionChanges';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class PolicyVersionApi {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Creates a new policy version
   * @param identity Identity of the policy to create a new version for
   * @param requestBody Developer-defined version details
   * @returns IPolicyVersionDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public createPolicyVersion(
    identity: string,
    requestBody: VersionChanges,
  ): CancelablePromise<IPolicyVersionDef | Error> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/policy/version/{identity}',
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
   * Fetches a policy version
   * @param identity Identity of the policy version to retrieve
   * @returns IPolicyVersionDef Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public getPolicyVersion(identity: string): CancelablePromise<IPolicyVersionDef | Error> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/policy/version/{identity}',
      path: {
        identity: identity,
      },
      errors: {
        404: `Policy version not found`,
      },
    });
  }
  /**
   * Fetches all versions of a policy
   * @param identity Identity of the policy to fetch versions for
   * @returns PolicyVersionsArray Successful operation
   * @returns Error Unexpected error
   * @throws ApiError
   */
  public getPolicyVersions(identity: string): CancelablePromise<PolicyVersionsArray | Error> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/policy/versions',
      query: {
        identity: identity,
      },
      errors: {
        404: `Policy not found`,
      },
    });
  }
}
