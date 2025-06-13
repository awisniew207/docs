// src/lib/toolCore/helpers/validatePolicies.ts

import { z } from 'zod';

import { VincentTool, VincentToolPolicy } from '../../types';
import { getMappedToolPolicyParams } from './getMappedToolPolicyParams';
import { Policy, PolicyParameter } from '../../policyCore/policyParameters/types';
import { ToolPolicyMap } from './supportedPoliciesForTool';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ValidatedPolicyMap<
  ParsedToolParams extends Record<string, any>,
  PoliciesByPackageName extends Record<string, VincentToolPolicy<any, any, any>>,
  Parameters extends PolicyParameter[] = Policy['parameters'],
> = Array<
  {
    [PkgName in keyof PoliciesByPackageName]: {
      parameters: Parameters;
      policyPackageName: PkgName;
      toolPolicyParams: {
        [PolicyParamKey in PoliciesByPackageName[PkgName]['toolParameterMappings'][keyof PoliciesByPackageName[PkgName]['toolParameterMappings']] &
          string]: ParsedToolParams[{
          [ToolParamKey in keyof PoliciesByPackageName[PkgName]['toolParameterMappings']]: PoliciesByPackageName[PkgName]['toolParameterMappings'][ToolParamKey] extends PolicyParamKey
            ? ToolParamKey
            : never;
        }[keyof PoliciesByPackageName[PkgName]['toolParameterMappings']] &
          keyof ParsedToolParams];
      };
    };
  }[keyof PoliciesByPackageName]
>;

export async function validatePolicies<
  ToolParamsSchema extends z.ZodType,
  PolicyMap extends ToolPolicyMap<any, any>,
  PoliciesByPackageName extends PolicyMap['policyByPackageName'],
>({
  policies,
  vincentTool,
  toolIpfsCid,
  parsedToolParams,
}: {
  policies: Policy[];
  vincentTool: VincentTool<
    ToolParamsSchema,
    keyof PoliciesByPackageName & string,
    PolicyMap,
    PoliciesByPackageName,
    any,
    any,
    any,
    any
  >;
  toolIpfsCid: string;
  parsedToolParams: z.infer<ToolParamsSchema>;
}): Promise<ValidatedPolicyMap<z.infer<ToolParamsSchema>, PoliciesByPackageName>> {
  const validatedPolicies: Array<{
    policyPackageName: keyof PoliciesByPackageName;
    toolPolicyParams: Record<string, unknown>;
    parameters: PolicyParameter[];
  }> = [];

  for (const policy of policies) {
    const { policyIpfsCid, parameters } = policy;
    const toolPolicy = vincentTool.supportedPolicies.policyByIpfsCid[policyIpfsCid as string];

    console.log(
      'vincentTool.supportedPolicies',
      Object.keys(vincentTool.supportedPolicies.policyByIpfsCid),
    );
    if (!toolPolicy) {
      throw new Error(
        `Policy with IPFS CID ${policyIpfsCid} is registered on-chain but not supported by this tool. Vincent Tool: ${toolIpfsCid}`,
      );
    }

    const policyPackageName = toolPolicy.vincentPolicy.packageName;

    if (!toolPolicy.toolParameterMappings) {
      throw new Error('toolParameterMappings missing on policy');
    }

    console.log(
      'toolPolicy.toolParameterMappings',
      JSON.stringify(toolPolicy.toolParameterMappings),
    );
    const toolPolicyParams = getMappedToolPolicyParams({
      toolParameterMappings: toolPolicy.toolParameterMappings as Record<
        keyof typeof parsedToolParams,
        string
      >,
      parsedToolParams,
    }) as {
      [key: string]: unknown;
    };

    validatedPolicies.push({ parameters, policyPackageName, toolPolicyParams });
  }

  return validatedPolicies as ValidatedPolicyMap<z.infer<ToolParamsSchema>, PoliciesByPackageName>;
}
