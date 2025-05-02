import { z } from 'zod';
import { VincentToolDef, VincentPolicyDef } from './types';

export function validateVincentToolDef<
  ToolParamsSchema extends z.ZodType,
  Policies extends Record<
    string,
    {
      policyDef: VincentPolicyDef;
      toolParameterMappings: any;
    }
  >,
>(
  vincentToolDef: VincentToolDef<ToolParamsSchema, Policies>,
): VincentToolDef<
  ToolParamsSchema,
  {
    [K in keyof Policies]: {
      policyDef: Policies[K]['policyDef'];
      toolParameterMappings: Policies[K]['toolParameterMappings'];
    };
  }
> {
  return vincentToolDef;
}
