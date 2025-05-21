// src/lib/toolCore/helpers/createPolicyMapFromToolPolicies.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ToolPolicyMap<T extends readonly any[], PkgNames extends string> = {
  policyByPackageName: {
    [K in PkgNames]: Extract<T[number], { vincentPolicy: { packageName: K } }>;
  };
  policyByIpfsCid: Record<string, T[number]>;
  cidToPackageName: Map<string, PkgNames>;
  packageNameToCid: Map<PkgNames, string>;
};

/**
 * Safely builds a strongly typed policy map from an array of VincentToolPolicy entries.
 * Enforces literal string `packageName` keys and exposes reverse lookup maps.
 */
export function createPolicyMapFromToolPolicies<
  const T extends readonly {
    vincentPolicy: { packageName: string };
    ipfsCid: string;
  }[],
  PkgNames extends
    T[number]['vincentPolicy']['packageName'] = T[number]['vincentPolicy']['packageName'],
>(policies: T): ToolPolicyMap<T, PkgNames> {
  type PolicyMap = {
    [K in PkgNames]: Extract<T[number], { vincentPolicy: { packageName: K } }>;
  };

  const policyByPackageName = {} as Partial<PolicyMap>;
  const policyByIpfsCid: Record<string, T[number]> = {};
  const cidToPackageName = new Map<string, PkgNames>();
  const packageNameToCid = new Map<PkgNames, string>();

  for (const policy of policies) {
    const pkg = policy.vincentPolicy.packageName as PkgNames;
    const cid = policy.ipfsCid;

    if (!pkg) throw new Error('Missing policy packageName');
    if ((policyByPackageName as Record<string, unknown>)[pkg]) {
      throw new Error(`Duplicate policy packageName: ${pkg}`);
    }

    policyByPackageName[pkg] = policy as Extract<
      T[number],
      { vincentPolicy: { packageName: typeof pkg } }
    >;
    policyByIpfsCid[cid] = policy;
    cidToPackageName.set(cid, pkg);
    packageNameToCid.set(pkg, cid);
  }

  return {
    policyByPackageName: policyByPackageName as PolicyMap,
    policyByIpfsCid,
    cidToPackageName,
    packageNameToCid,
  } as ToolPolicyMap<T, PkgNames>;
}
