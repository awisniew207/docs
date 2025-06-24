import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { deleteResult, errorResult } from '../schemas/base';
import { changeOwner } from '../schemas/packages';

const registry = new OpenAPIRegistry();

// Define 'global' references that are used in multiple routes
export const ErrorResponse = registry.register('Error', errorResult);
export const DeleteResponse = registry.register('DeleteResponse', deleteResult);
export const ChangeOwner = registry.register('ChangeOwner', changeOwner);

// Export the registry
export { registry };
