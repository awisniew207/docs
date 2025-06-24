import { z } from '../schemas/openApiZod';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import {
  toolCreate,
  toolEdit,
  toolDoc,
  toolVersionCreate,
  toolVersionEdit,
  toolVersionDoc,
} from '../schemas/tool';
import { ErrorResponse, ChangeOwner } from './baseRegistry';

const packageNameParam = z
  .string()
  .openapi({ param: { description: 'The NPM package name', example: '@vincent/foo-bar' } });

const toolVersionParam = z
  .string()
  .openapi({ param: { description: 'NPM semver of the target tool version', example: '2.1.0' } });

export function addToRegistry(registry: OpenAPIRegistry) {
  const ToolCreate = registry.register('ToolCreate', toolCreate);
  const ToolEdit = registry.register('ToolEdit', toolEdit);
  const ToolRead = registry.register('Tool', toolDoc);

  const ToolVersionCreate = registry.register('ToolVersionCreate', toolVersionCreate);
  const ToolVersionEdit = registry.register('ToolVersionEdit', toolVersionEdit);
  const ToolVersionRead = registry.register('ToolVersion', toolVersionDoc);

  // GET /tools - List all tools
  registry.registerPath({
    method: 'get',
    path: '/tools',
    tags: ['tool'],
    summary: 'Lists all tools',
    operationId: 'listAllTools',
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: z.array(ToolRead).openapi('ToolList'),
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

  // POST /tool - Create a new tool
  registry.registerPath({
    method: 'post',
    path: '/tool',
    tags: ['tool'],
    summary: 'Creates a new tool',
    operationId: 'createTool',
    request: {
      body: {
        content: {
          'application/json': {
            schema: ToolCreate,
          },
        },
        description: 'Developer-defined tool details',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: ToolRead,
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

  // GET /tool/{packageName} - Fetch a tool
  registry.registerPath({
    method: 'get',
    path: '/tool/{packageName}',
    tags: ['tool'],
    summary: 'Fetches a tool',
    operationId: 'getTool',
    request: {
      params: z.object({ packageName: packageNameParam }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: ToolRead,
          },
        },
      },
      404: {
        description: 'Tool not found',
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

  // PUT /tool/{packageName} - Edit a tool
  registry.registerPath({
    method: 'put',
    path: '/tool/{packageName}',
    tags: ['tool'],
    summary: 'Edits a tool',
    operationId: 'editTool',
    request: {
      params: z.object({ packageName: packageNameParam }),
      body: {
        content: {
          'application/json': {
            schema: ToolEdit,
          },
        },
        description: 'Developer-defined updated tool details',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: ToolRead,
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

  // GET /tool/{packageName}/versions - Fetch all versions of a tool
  registry.registerPath({
    method: 'get',
    path: '/tool/{packageName}/versions',
    tags: ['tool'],
    summary: 'Fetches all versions of a tool',
    operationId: 'getToolVersions',
    request: {
      params: z.object({ packageName: packageNameParam }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: z.array(ToolVersionRead).openapi('ToolVersionList'),
          },
        },
      },
      404: {
        description: 'Tool not found',
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

  // PUT /tool/{packageName}/owner - Changes a tool's owner
  registry.registerPath({
    method: 'put',
    path: '/tool/{packageName}/owner',
    tags: ['tool'],
    summary: "Changes a tool's owner",
    operationId: 'changeToolOwner',
    request: {
      params: z.object({ packageName: packageNameParam }),
      body: {
        content: {
          'application/json': {
            schema: ChangeOwner,
          },
        },
        description: 'Developer-defined updated tool details',
        required: true,
      },
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: ToolRead,
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

  // POST /tool/{packageName}/version/{version} - Create a tool version
  registry.registerPath({
    method: 'post',
    path: '/tool/{packageName}/version/{version}',
    tags: ['tool/version'],
    summary: 'Creates a tool version',
    operationId: 'createToolVersion',
    request: {
      params: z.object({ packageName: packageNameParam, version: toolVersionParam }),
      body: {
        content: {
          'application/json': {
            schema: ToolVersionCreate,
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
            schema: ToolVersionRead,
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

  // GET /tool/{packageName}/version/{version} - Fetch a tool version
  registry.registerPath({
    method: 'get',
    path: '/tool/{packageName}/version/{version}',
    tags: ['tool/version'],
    summary: 'Fetches a tool version',
    operationId: 'getToolVersion',
    request: {
      params: z.object({ packageName: packageNameParam, version: toolVersionParam }),
    },
    responses: {
      200: {
        description: 'Successful operation',
        content: {
          'application/json': {
            schema: ToolVersionRead,
          },
        },
      },
      404: {
        description: 'Tool version not found',
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

  // PUT /tool/{packageName}/version/{version} - Edit a tool version
  registry.registerPath({
    method: 'put',
    path: '/tool/{packageName}/version/{version}',
    tags: ['tool/version'],
    summary: 'Edits a tool version',
    operationId: 'editToolVersion',
    request: {
      params: z.object({ packageName: packageNameParam, version: toolVersionParam }),
      body: {
        content: {
          'application/json': {
            schema: ToolVersionEdit,
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
            schema: ToolVersionRead,
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
