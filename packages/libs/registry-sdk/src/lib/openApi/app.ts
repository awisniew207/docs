import { z } from '../schemas/openApiZod';

import { appDoc, appCreate, appEdit } from '../schemas/app';
import {
  appVersionDoc,
  appVersionCreate,
  appVersionEdit,
  appVersionToolCreate,
  appVersionToolDoc,
} from '../schemas/appVersion';
import { DeleteResponse, ErrorResponse } from './baseRegistry';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

const appIdParam = z
  .number()
  .openapi({ param: { description: 'ID of the target application', example: 132 } });

const appVersionParam = z
  .number()
  .openapi({ param: { description: 'Version # of the target application version', example: 3 } });

const packageNameParam = z
  .string()
  .openapi({ param: { description: 'The NPM package name', example: '@vincent/foo-bar' } });

export function addToRegistry(registry: OpenAPIRegistry) {
  const AppCreate = registry.register('AppCreate', appCreate);
  const AppEdit = registry.register('AppEdit', appEdit);
  const AppRead = registry.register('App', appDoc);

  const AppVersionCreate = registry.register('AppVersionCreate', appVersionCreate);
  const AppVersionEdit = registry.register('AppVersionEdit', appVersionEdit);
  const AppVersionRead = registry.register('AppVersion', appVersionDoc);

  const AppVersionToolCreate = registry.register('AppVersionToolCreate', appVersionToolCreate);
  const AppVersionToolRead = registry.register('AppVersionTool', appVersionToolDoc);

  // GET /apps - List all applications
  registry.registerPath({
    method: 'get',
    path: '/apps',
    tags: ['app'],
    summary: 'Lists all applications',
    operationId: 'listApps',
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: z.array(AppRead).openapi('AppList'),
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

  // POST /app - Create a new application
  registry.registerPath({
    method: 'post',
    path: '/app',
    tags: ['app'],
    summary: 'Creates a new application',
    operationId: 'createApp',
    request: {
      body: {
        content: {
          'application/json': {
            schema: AppCreate,
          },
        },
        description: 'Developer-defined application information',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AppRead,
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

  // GET /app/{appId} - Fetch an application
  registry.registerPath({
    method: 'get',
    path: '/app/{appId}',
    tags: ['app'],
    summary: 'Fetches an application',
    operationId: 'getApp',
    request: {
      params: z.object({ appId: appIdParam }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AppRead,
          },
        },
      },
      404: {
        description: 'Application not found',
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

  // PUT /app/{appId} - Edit an application
  registry.registerPath({
    method: 'put',
    path: '/app/{appId}',
    tags: ['app'],
    summary: 'Edits an application',
    operationId: 'editApp',
    request: {
      params: z.object({
        appId: appIdParam,
      }),
      body: {
        content: {
          'application/json': {
            schema: AppEdit,
          },
        },
        description: 'Developer-defined updated application details',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AppRead,
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

  // DELETE /app/{appId} - Delete an application
  registry.registerPath({
    method: 'delete',
    path: '/app/{appId}',
    tags: ['app'],
    summary: 'Deletes an application',
    operationId: 'deleteApp',
    request: {
      params: z.object({
        appId: appIdParam,
      }),
    },
    responses: {
      200: {
        description: 'OK - Resource successfully deleted',
        content: {
          'application/json': {
            schema: DeleteResponse,
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

  // GET /app/{appId}/versions - Fetch all versions of an application
  registry.registerPath({
    method: 'get',
    path: '/app/{appId}/versions',
    tags: ['app'],
    summary: 'Fetches all versions of an application',
    operationId: 'getAppVersions',
    request: {
      params: z.object({
        appId: appIdParam,
      }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: z.array(AppVersionRead).openapi('AppVersionList'),
          },
        },
      },
      404: {
        description: 'Application not found',
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

  // POST /app/{appId}/version/{version} - Create an application version
  registry.registerPath({
    method: 'post',
    path: '/app/{appId}/version/{version}',
    tags: ['app/version'],
    summary: 'Creates an application version',
    operationId: 'createAppVersion',
    request: {
      params: z.object({
        appId: appIdParam,
        version: appVersionParam,
      }),
      body: {
        content: {
          'application/json': {
            schema: AppVersionCreate,
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
            schema: AppVersionRead,
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

  // GET /app/{appId}/version/{version} - Fetch an application version
  registry.registerPath({
    method: 'get',
    path: '/app/{appId}/version/{version}',
    tags: ['app/version'],
    summary: 'Fetches an application version',
    operationId: 'getAppVersion',
    request: {
      params: z.object({
        appId: appIdParam,
        version: appVersionParam,
      }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AppVersionRead,
          },
        },
      },
      404: {
        description: 'Application not found',
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

  // PUT /app/{appId}/version/{version} - Edit an application version
  registry.registerPath({
    method: 'put',
    path: '/app/{appId}/version/{version}',
    tags: ['app/version'],
    summary: 'Edits an application version',
    operationId: 'editAppVersion',
    request: {
      params: z.object({
        appId: appIdParam,
        version: appVersionParam,
      }),
      body: {
        content: {
          'application/json': {
            schema: AppVersionEdit,
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
            schema: AppVersionRead,
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

  // POST /app/{appId}/version/{version}/enable - Enable an application version
  registry.registerPath({
    method: 'post',
    path: '/app/{appId}/version/{version}/enable',
    tags: ['app/version'],
    summary: 'Enables an application version',
    operationId: 'enableAppVersion',
    request: {
      params: z.object({
        appId: appIdParam,
        version: appVersionParam,
      }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AppVersionRead,
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

  // POST /app/{appId}/version/{version}/disable - Disable an application version
  registry.registerPath({
    method: 'post',
    path: '/app/{appId}/version/{version}/disable',
    tags: ['app/version'],
    summary: 'Disables an application version',
    operationId: 'disableAppVersion',
    request: {
      params: z.object({
        appId: appIdParam,
        version: appVersionParam,
      }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AppVersionRead,
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

  // GET /app/{appId}/version/{appVersion}/tools - List all tools for an application version
  registry.registerPath({
    method: 'get',
    path: '/app/{appId}/version/{appVersion}/tools',
    tags: ['app/version/tool'],
    summary: 'Lists all tools for an application version',
    operationId: 'listAppVersionTools',
    request: {
      params: z.object({
        appId: appIdParam,
        version: appVersionParam,
      }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: z.array(AppVersionToolRead).openapi('AppVersionToolList'),
          },
        },
      },
      404: {
        description: 'Application or version not found',
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

  // POST /app/{appId}/version/{appVersion}/tool/{toolPackageName} - Create a tool for an application version
  registry.registerPath({
    method: 'post',
    path: '/app/{appId}/version/{appVersion}/tool/{toolPackageName}',
    tags: ['app/version/tool'],
    summary: 'Creates a tool for an application version',
    operationId: 'createAppVersionTool',
    request: {
      params: z.object({
        appId: appIdParam,
        appVersion: appVersionParam,
        toolPackageName: packageNameParam,
      }),
      body: {
        content: {
          'application/json': {
            schema: AppVersionToolCreate,
          },
        },
        description: 'Tool configuration for the application version',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: AppVersionToolRead,
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
