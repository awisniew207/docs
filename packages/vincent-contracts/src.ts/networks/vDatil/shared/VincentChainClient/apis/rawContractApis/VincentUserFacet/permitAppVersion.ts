import { toHex } from 'viem';
import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../vincentNetworkContext';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../utils/createVincentContracts';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';

const PermitAppVersionRequest = z.object({
  pkpTokenId: z.coerce.bigint(),
  appId: z.coerce.bigint(),
  appVersion: z.coerce.bigint(),
  toolIpfsCids: z.array(z.string()),
  policyIpfsCids: z.array(z.array(z.string())),
  policyParameterNames: z.array(z.array(z.array(z.string()))),
  policyParameterValues: z.array(z.array(z.array(z.string()))),
});

type PermitAppVersionRequest = z.input<typeof PermitAppVersionRequest>;

/**
 * Permits a specific application version for a PKP token with associated policies
 * @param request The request containing PKP token ID, app ID, app version, and policy details
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function permitAppVersion(
  request: PermitAppVersionRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = PermitAppVersionRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentUserFacetContract, publicClient } =
    createVincentContracts(ctx);

  // Convert string arrays to hex strings for parameter values
  const policyParameterValues = validatedRequest.policyParameterValues.map(
    (toolPolicies) =>
      toolPolicies.map((policies) => policies.map((value) => toHex(value))),
  );

  const hash = await callWithAdjustedOverrides(
    vincentUserFacetContract,
    'permitAppVersion',
    [
      validatedRequest.pkpTokenId,
      validatedRequest.appId,
      validatedRequest.appVersion,
      validatedRequest.toolIpfsCids,
      validatedRequest.policyIpfsCids,
      validatedRequest.policyParameterNames,
      policyParameterValues,
    ],
  );

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
}
