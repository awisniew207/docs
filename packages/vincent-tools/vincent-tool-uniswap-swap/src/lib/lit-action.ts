import { vincentToolHandler } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import { vincentTool } from './vincent-tool';
import { toolParamsSchema } from './schemas';

declare const toolParams: z.infer<typeof toolParamsSchema>;
declare const LitAuth: {
  authSigAddress: string;
  actionIpfsIds: string[];
};

declare const context: {
  appVersion: number;
  appId: number;
};
(async () => {
  const func = vincentToolHandler({
    vincentTool: vincentTool,
    baseContext: {
      appId: context.appId,
      appVersion: context.appVersion,
      toolIpfsCid: LitAuth.actionIpfsIds[0],
      delegation: {
        delegator: toolParams.pkpEthAddress,
        delegatee: LitAuth.authSigAddress,
      },
    },
    toolParams,
  });
  await func();
})();
