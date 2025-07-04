import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { policyParams, DenySchema, toolParams } from '../../../../schemas';

/**
 * Policy that denies in evaluate with schema but no result
 * Tests deny() with schema defined but no result provided in evaluate
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/test-policy@1.0.0',
  toolParamsSchema: toolParams,
  userParamsSchema: policyParams,

  evaluateDenyResultSchema: DenySchema,

  precheck: async (_, { allow }) => {
    return allow();
  },

  evaluate: async (_, { deny }) => {
    // Call deny() without a result, even though a schema is defined
    return deny();
  },

  commit: async (_, { allow }) => {
    return allow();
  },
});
