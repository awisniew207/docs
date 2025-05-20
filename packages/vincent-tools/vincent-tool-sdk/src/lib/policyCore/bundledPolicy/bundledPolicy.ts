// src/lib/policyCore/bundledPolicy/bundledPolicy.ts

import { __bundledPolicyBrand, BundledVincentPolicy } from './types';
import { VincentPolicy } from '../../types';

export function asBundledVincentPolicy<
  const VP extends VincentPolicy<any, any, any, any, any, any, any, any, any, any, any, any, any>,
  const CID extends string,
>(vincentPolicy: VP, ipfsCid: CID): BundledVincentPolicy<VP> {
  return {
    ipfsCid,
    vincentPolicy,
    [__bundledPolicyBrand]: 'BundledVincentPolicy',
  } as BundledVincentPolicy<VP>;
}
