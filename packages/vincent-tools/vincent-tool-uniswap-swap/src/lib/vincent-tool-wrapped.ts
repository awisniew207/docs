import { vincentToolHandler } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import { UniswapSwapTool, UniswapSwapToolParamsSchema } from './vincent-tool';

declare const toolParams: z.infer<typeof UniswapSwapToolParamsSchema>;
declare const LitAuth: {
  authSigAddress: string;
};

(async () => {
  const func = vincentToolHandler({
    vincentTool: UniswapSwapTool,
    baseContext: {
      delegation: {
        delegator: toolParams.pkpEthAddress,
        delegatee: LitAuth.authSigAddress,
      },
    },
    toolParams,
  });
  await func();
})();
