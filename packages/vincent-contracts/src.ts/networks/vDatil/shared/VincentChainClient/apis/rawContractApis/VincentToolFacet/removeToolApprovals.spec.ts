import { getTestContext } from '../testContext';
import { approveTools } from './approveTools';
import { registerTools } from './registerTools';
import { removeToolApprovals } from './removeToolApprovals';

describe('removeToolApprovals', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  // Register the tool with a single-item array
  const randomIpfsCids = [`Qm${Math.random().toString(36).substring(2, 15)}`];

  beforeAll(async () => {
    testContext = await getTestContext();

    // Register the tool
    await registerTools(
      {
        toolIpfsCids: randomIpfsCids,
      },
      testContext.networkContext,
    );

    // Approve the tool
    await approveTools(
      {
        toolIpfsCids: randomIpfsCids,
      },
      testContext.networkContext,
    );
  });

  it('should remove approvals for tools on the Vincent network', async () => {
    const res = await removeToolApprovals(
      {
        toolIpfsCids: randomIpfsCids,
      },
      testContext.networkContext,
    );
    console.log(res);
    expect(res.hash).toBeDefined();
    expect(res.receipt).toBeDefined();
    expect(res.decodedLogs).toBeDefined();

    // Find the ToolApprovalRemoved event for each tool
    for (const toolIpfsCid of randomIpfsCids) {
      const event = res.decodedLogs.find(
        (log) =>
          log.eventName === 'ToolApprovalRemoved' &&
          log.args.toolIpfsCidHash !== undefined,
      );
      expect(event).toBeDefined();
    }
  });
});
