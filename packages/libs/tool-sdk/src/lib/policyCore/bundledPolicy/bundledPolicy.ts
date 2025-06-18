// src/lib/policyCore/bundledPolicy/bundledPolicy.ts

import { __bundledPolicyBrand, BundledVincentPolicy } from './types';
import { VincentPolicy } from '../../types';

/** @hidden */
export function asBundledVincentPolicy<
  const VP extends VincentPolicy<any, any, any, any, any, any, any, any, any, any, any, any, any>,
  const IpfsCid extends string,
>(vincentPolicy: VP, ipfsCid: IpfsCid): BundledVincentPolicy<VP, IpfsCid> {
  return {
    ipfsCid,
    vincentPolicy,
    [__bundledPolicyBrand]: 'BundledVincentPolicy',
  };
}
