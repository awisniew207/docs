import { getTestContext } from '../testContext';
import { isToolApproved } from './isToolApproved';
import { registerTools } from '../VincentToolFacet/registerTools';
import { approveTools } from '../VincentToolFacet/approveTools';
import { removeToolApprovals } from '../VincentToolFacet/removeToolApprovals';

describe('isToolApproved', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  const randomIpfsCid = [
    `Qm${Math.random().toString(36).substring(2, 15)}`,
    `Qm${Math.random().toString(36).substring(2, 15)}`,
  ];

  beforeAll(async () => {
    testContext = await getTestContext();

    // Register both tools first
    const resgisterToolsRes = await registerTools(
      {
        toolIpfsCids: randomIpfsCid,
      },
      testContext.networkContext,
    );
    console.log(resgisterToolsRes);

    // Approve both tools
    await approveTools(
      {
        toolIpfsCids: randomIpfsCid,
      },
      testContext.networkContext,
    );
  });

  it('should check if a tool is approved on the Vincent network', async () => {
    const result = await isToolApproved(
      {
        toolIpfsCid: randomIpfsCid[0],
      },
      testContext.networkContext,
    );

    // Log the result for debugging
    console.log(JSON.stringify(result, null, 2));

    // Verify structure of the response
    expect(result).toHaveProperty('isApproved');

    // Now that we've approved the tool, we expect isApproved to be true
    expect(result.isApproved).toBe(true);
  });

  it('should return false for a non-approved tool', async () => {
    // Create a random IPFS CID that hasn't been approved
    const nonApprovedCid = `QmRandom${Math.random().toString(36).substring(2, 10)}`;

    const result = await isToolApproved(
      {
        toolIpfsCid: nonApprovedCid,
      },
      testContext.networkContext,
    );

    // Verify the result is false since this tool hasn't been approved
    expect(result.isApproved).toBe(false);
  });

  it('should return false after a tool approval is removed', async () => {
    // First, verify the tool is currently approved
    const initialResult = await isToolApproved(
      {
        toolIpfsCid: randomIpfsCid[0],
      },
      testContext.networkContext,
    );

    expect(initialResult.isApproved).toBe(true);

    // Now remove approval for the tool
    await removeToolApprovals(
      {
        toolIpfsCids: [randomIpfsCid[0]],
      },
      testContext.networkContext,
    );

    // Check again - should now be false
    const afterResult = await isToolApproved(
      {
        toolIpfsCid: randomIpfsCid[0],
      },
      testContext.networkContext,
    );

    expect(afterResult.isApproved).toBe(false);
  });
});
