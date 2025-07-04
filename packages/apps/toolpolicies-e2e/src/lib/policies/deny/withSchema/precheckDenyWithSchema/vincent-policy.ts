import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { policyParams, DenySchema, toolParams } from '../../../../schemas';

/**
 * Policy that denies in precheck with schema
 * Tests deny() with schema in precheck
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/test-policy@1.0.0',
  toolParamsSchema: toolParams,
  userParamsSchema: policyParams,

  precheckDenyResultSchema: DenySchema,

  precheck: async (_, { deny }) => {
    return deny({ reason: 'Intentional precheck denial with schema' });
  },

  evaluate: async (_, { allow }) => {
    return allow();
  },

  commit: async (_, { allow }) => {
    return allow();
  },
});
