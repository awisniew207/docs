import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../vincentNetworkContext';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../utils/createVincentContracts';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';

const ApproveToolsRequest = z.object({
  toolIpfsCids: z.array(z.string()),
});

type ApproveToolsRequest = z.input<typeof ApproveToolsRequest>;

/**
 * Approves tools for use on the Vincent network
 * @param request The request containing an array of tool IPFS CIDs to approve
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function approveTools(
  request: ApproveToolsRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = ApproveToolsRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentToolFacetContract, publicClient } =
    createVincentContracts(ctx);

  const hash = await callWithAdjustedOverrides(
    vincentToolFacetContract,
    'approveTools',

    // TypeScript is complaining because it thinks you're passing a string[][] to something that expects a string[], but at runtime, the helper function's unwrapping behavior makes it work correctly.
    [[validatedRequest.toolIpfsCids] as unknown as string[]],
  );

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
}
