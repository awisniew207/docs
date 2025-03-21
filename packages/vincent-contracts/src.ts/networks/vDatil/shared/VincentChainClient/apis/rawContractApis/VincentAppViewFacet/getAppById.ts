import { z } from 'zod';
import { vincentNetworkContext, VincentNetworkContext } from '../../../_vincentConfig';
import { createVincentContracts } from '../../utils/createVincentContracts';

type RawContractMethod = ReturnType<typeof createVincentContracts>['vincentAppViewFacetContract']['read']['getAppById'];
type RawContractParams = Parameters<RawContractMethod>[0];
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

// Validate at runtime that our transformation matches contract params
const ExpectedParams = z.object({
  appId: z.union([z.number(), z.bigint()]),
}).transform((obj): RawContractParams => [BigInt(obj.appId)]);

type ExpectedParams = z.input<typeof ExpectedParams>;

export async function getAppById(request: ExpectedParams, ctx: VincentNetworkContext): Promise<RawContractResponse> {
  const contractParams = ExpectedParams.parse(request);
  const { vincentAppViewFacetContract } = createVincentContracts(ctx);
  const res = await vincentAppViewFacetContract.read.getAppById(contractParams);
  return res;
}

if (import.meta.main) {
  const appId = 1;
  const ctx = vincentNetworkContext;
  const result = await getAppById({ appId }, ctx);
  console.log(result);
}
