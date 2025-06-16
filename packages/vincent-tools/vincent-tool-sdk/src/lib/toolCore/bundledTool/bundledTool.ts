// src/lib/toolCore/bundledTool/bundledTool.ts

import { __bundledToolBrand, BundledVincentTool } from './types';
import { VincentTool } from '../../types';

export function asBundledVincentTool<
  const VT extends VincentTool<any, any, any, any, any, any, any, any, any, any>,
  const IpfsCid extends string,
>(vincentTool: VT, ipfsCid: IpfsCid): BundledVincentTool<VT, IpfsCid> {
  return {
    ipfsCid,
    vincentTool,
    [__bundledToolBrand]: 'BundledVincentTool',
  } as BundledVincentTool<VT, IpfsCid>;
}
