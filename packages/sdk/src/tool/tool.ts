import { ethers } from 'ethers';
import { LIT_ABILITY, LIT_NETWORK } from '@lit-protocol/constants';

import {
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitActionResource,
  LitPKPResource,
} from '@lit-protocol/auth-helpers';
import { getLitNodeClientInstance } from '../internal/LitNodeClient/getLitNodeClient';

import type { LitNodeClient } from '@lit-protocol/lit-node-client';
import type { ExecuteJsResponse, LIT_NETWORKS_KEYS } from '@lit-protocol/types';
import { VincentToolClientv1, VincentToolClientConfigv1, VincentToolParamsv1 } from './types';

const generateSessionSigs = async ({
  litNodeClient,
  ethersSigner,
}: {
  litNodeClient: LitNodeClient;
  ethersSigner: ethers.Signer;
}) => {
  return litNodeClient.getSessionSigs({
    chain: 'ethereum',
    resourceAbilityRequests: [
      {
        resource: new LitPKPResource('*'),
        ability: LIT_ABILITY.PKPSigning,
      },
      {
        resource: new LitActionResource('*'),
        ability: LIT_ABILITY.LitActionExecution,
      },
    ],
    authNeededCallback: async ({ resourceAbilityRequests, uri }) => {
      const [walletAddress, nonce] = await Promise.all([
        ethersSigner.getAddress(),
        litNodeClient.getLatestBlockhash(),
      ]);

      const toSign = await createSiweMessageWithRecaps({
        uri: uri || 'http://localhost:3000',
        expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes,
        resources: resourceAbilityRequests || [],
        walletAddress,
        nonce,
        litNodeClient,
      });

      return await generateAuthSig({
        signer: ethersSigner,
        toSign,
      });
    },
  });
};

const executeVincentTool = async <ToolParams extends VincentToolParamsv1>({
  ethersSigner,
  litActionIpfsCid,
  params,
  network,
}: {
  ethersSigner: ethers.Signer;
  litActionIpfsCid: string;
  params: ToolParams;
  network: LIT_NETWORKS_KEYS;
}) => {
  const litNodeClient = await getLitNodeClientInstance({ network });
  const sessionSigs = await generateSessionSigs({ ethersSigner, litNodeClient });

  return litNodeClient.executeJs({
    ipfsId: litActionIpfsCid,
    sessionSigs: sessionSigs,
    jsParams: { toolParams: { ...params } },
  });
};

/** Create a new {@link VincentToolClientv1} instance.
 *
 * - `ethersSigner` is assumed to be an Ethers v5 signer
 *
 * @category Vincent SDK API
 * */
export const getVincentToolClientv1 = (config: VincentToolClientConfigv1): VincentToolClientv1 => {
  const { vincentToolCid, ethersSigner } = config;

  const network = LIT_NETWORK.Datil;

  return {
    execute: async <ToolParams extends VincentToolParamsv1>(
      toolParams: ToolParams
    ): Promise<ExecuteJsResponse> => {
      return executeVincentTool({
        ethersSigner,
        network,
        params: toolParams,
        litActionIpfsCid: vincentToolCid,
      });
    },
  };
};
