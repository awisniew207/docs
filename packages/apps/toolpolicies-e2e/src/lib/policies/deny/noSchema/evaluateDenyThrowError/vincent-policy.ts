import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { policyParams, toolParams } from '../../../../schemas';

/**
 * Policy that throws an error in evaluate
 * Tests throwing an error instead of calling deny() in evaluate
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/test-policy@1.0.0',
  toolParamsSchema: toolParams,
  userParamsSchema: policyParams,

  precheck: async (_, { allow }) => {
    return allow();
  },

  evaluate: async () => {
    // Throw an error instead of calling deny()
    throw new Error('Intentional evaluate failure with thrown error');
  },

  commit: async (_, { allow }) => {
    return allow();
  },
});
