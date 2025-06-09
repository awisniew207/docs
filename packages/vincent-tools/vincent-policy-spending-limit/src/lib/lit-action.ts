import { vincentPolicyHandler } from '@lit-protocol/vincent-tool-sdk';

import { vincentPolicy } from './vincent-policy';
import { toolParamsSchema } from './schemas';

declare const context: {
  toolIpfsCid: string;
  delegation: { delegator: string; delegatee: string };
  appVersion: number;
  appId: number;
};
declare const toolParams: typeof toolParamsSchema;

(async () => {
  return await vincentPolicyHandler({
    vincentPolicy: vincentPolicy,
    context,
    toolParams,
  });
})();
