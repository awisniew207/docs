import { z } from '../schemas/openApiZod';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import {
  policyCreate,
  policyEdit,
  policyRead,
  policyVersionCreate,
  policyVersionEdit,
  policyVersionRead,
} from '../schemas/policy';
import { ErrorResponse, ChangeOwner } from './baseRegistry';

export function addToRegistry(registry: OpenAPIRegistry) {
  const PolicyCreate = registry.register('PolicyCreate', policyCreate);
  const PolicyEdit = registry.register('PolicyEdit', policyEdit);
  const PolicyRead = registry.register('PolicyRead', policyRead);
  const PolicyVersionCreate = registry.register('PolicyVersionCreate', policyVersionCreate);
  const PolicyVersionEdit = registry.register('PolicyVersionEdit', policyVersionEdit);
  const PolicyVersionRead = registry.register('PolicyVersionRead', policyVersionRead);

  registry.registerPath({
    method: 'get',
    path: '/policies',
    tags: ['policy'],
    summary: 'Lists all policies',
    operationId: 'listAllPolicies',
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: z.array(PolicyRead).openapi('PolicyList'),
          },
        },
      },
      default: {
        description: 'Unexpected error',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  });

  // POST /policy - Create a new policy
  registry.registerPath({
    method: 'post',
    path: '/policy',
    tags: ['policy'],
    summary: 'Creates a new policy',
    operationId: 'createPolicy',
    request: {
      body: {
        content: {
          'application/json': {
            schema: PolicyCreate,
          },
        },
        description: 'Developer-defined policy details',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: PolicyRead,
          },
        },
      },
      400: {
        description: 'Invalid input',
      },
      422: {
        description: 'Validation exception',
      },
      default: {
        description: 'Unexpected error',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  });

  // GET /policy/{packageName} - Fetch a policy
  registry.registerPath({
    method: 'get',
    path: '/policy/{packageName}',
    tags: ['policy'],
    summary: 'Fetches a policy',
    operationId: 'getPolicy',
    parameters: [
      {
        name: 'packageName',
        in: 'path',
        description: 'Package name of the policy to retrieve',
        required: true,
        schema: {
          type: 'string',
          example: '@vincent/foo-bar-policy',
        },
      },
    ],
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: PolicyRead,
          },
        },
      },
      404: {
        description: 'Policy not found',
      },
      default: {
        description: 'Unexpected error',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  });

  // PUT /policy/{packageName} - Edit a policy
  registry.registerPath({
    method: 'put',
    path: '/policy/{packageName}',
    tags: ['policy'],
    summary: 'Edits a policy',
    operationId: 'editPolicy',
    parameters: [
      {
        name: 'packageName',
        in: 'path',
        description: 'Package name of the policy to edit',
        required: true,
        schema: {
          type: 'string',
          example: '@vincent/foo-bar-policy',
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: PolicyEdit,
          },
        },
        description: 'Developer-defined updated policy details',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: PolicyRead,
          },
        },
      },
      400: {
        description: 'Invalid input',
      },
      422: {
        description: 'Validation exception',
      },
      default: {
        description: 'Unexpected error',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  });

  // POST /policy/{packageName}/version/{version} - Create a new policy version
  registry.registerPath({
    method: 'post',
    path: '/policy/{packageName}/version/{version}',
    tags: ['policy/version'],
    summary: 'Creates a new policy version',
    operationId: 'createPolicyVersion',
    parameters: [
      {
        name: 'packageName',
        in: 'path',
        description: 'Package name of the policy to create a new version for',
        required: true,
        schema: {
          type: 'string',
          example: '@vincent/foo-bar-policy',
        },
      },
      {
        name: 'version',
        in: 'path',
        description: 'Version number to create',
        required: true,
        schema: {
          type: 'string',
          example: '1.0.0',
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: PolicyVersionCreate,
          },
        },
        description: 'Developer-defined version details',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: PolicyVersionRead,
          },
        },
      },
      400: {
        description: 'Invalid input',
      },
      422: {
        description: 'Validation exception',
      },
      default: {
        description: 'Unexpected error',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  });

  // GET /policy/{packageName}/version/{version} - Fetch a policy version
  registry.registerPath({
    method: 'get',
    path: '/policy/{packageName}/version/{version}',
    tags: ['policy/version'],
    summary: 'Fetches a policy version',
    operationId: 'getPolicyVersion',
    parameters: [
      {
        name: 'packageName',
        in: 'path',
        description: 'Package name of the policy to retrieve a version for',
        required: true,
        schema: {
          type: 'string',
          example: '@vincent/foo-bar-policy',
        },
      },
      {
        name: 'version',
        in: 'path',
        description: 'Version number to retrieve',
        required: true,
        schema: {
          type: 'string',
          example: '1.0.0',
        },
      },
    ],
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: PolicyVersionRead,
          },
        },
      },
      404: {
        description: 'Policy version not found',
      },
      default: {
        description: 'Unexpected error',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  });

  // GET /policy/{packageName}/versions - Fetch all versions of a policy
  registry.registerPath({
    method: 'get',
    path: '/policy/{packageName}/versions',
    tags: ['policy'],
    summary: 'Fetches all versions of a policy',
    operationId: 'getPolicyVersions',
    parameters: [
      {
        name: 'packageName',
        in: 'path',
        description: 'Package name of the policy to fetch versions for',
        required: true,
        schema: {
          type: 'string',
          example: '@vincent/foo-bar-policy',
        },
      },
    ],
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: z.array(PolicyVersionRead).openapi('PolicyVersionList'),
          },
        },
      },
      404: {
        description: 'Policy not found',
      },
      default: {
        description: 'Unexpected error',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  });

  // PUT /policy/{packageName}/owner - Changes a policy's owner
  registry.registerPath({
    method: 'put',
    path: '/policy/{packageName}/owner',
    tags: ['policy'],
    summary: "Changes a policy's owner",
    operationId: 'changePolicyOwner',
    parameters: [
      {
        name: 'packageName',
        in: 'path',
        description: 'Package name of the policy to change the owner of',
        required: true,
        schema: {
          type: 'string',
          example: '@vincent/foo-bar-policy',
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: ChangeOwner,
          },
        },
        description: 'Developer-defined updated policy details',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: PolicyRead,
          },
        },
      },
      400: {
        description: 'Invalid input',
      },
      422: {
        description: 'Validation exception',
      },
      default: {
        description: 'Unexpected error',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  });

  // PUT /policy/{packageName}/version/{version} - Edit a policy version
  registry.registerPath({
    method: 'put',
    path: '/policy/{packageName}/version/{version}',
    tags: ['policy/version'],
    summary: 'Edits a policy version',
    operationId: 'editPolicyVersion',
    parameters: [
      {
        name: 'packageName',
        in: 'path',
        description: 'Package name of the policy to edit a version for',
        required: true,
        schema: {
          type: 'string',
          example: '@vincent/foo-bar-policy',
        },
      },
      {
        name: 'version',
        in: 'path',
        description: 'Version number to edit',
        required: true,
        schema: {
          type: 'string',
          example: '1.0.0',
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: PolicyVersionEdit,
          },
        },
        description: 'Update version changes field',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: PolicyVersionRead,
          },
        },
      },
      400: {
        description: 'Invalid input',
      },
      422: {
        description: 'Validation exception',
      },
      default: {
        description: 'Unexpected error',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  });
}
