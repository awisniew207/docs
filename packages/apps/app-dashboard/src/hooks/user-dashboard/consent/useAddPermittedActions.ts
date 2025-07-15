import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { JsonRpcProvider as V6JsonRpcProvider } from 'ethers-v6';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { AUTH_METHOD_SCOPE } from '@lit-protocol/constants';
import { SELECTED_LIT_NETWORK } from '../../../utils/user-dashboard/lit';
import { IPFS_POLICIES_THAT_NEED_SIGNING } from '@/config/policyConstants';
import { hexToBase58 } from '../../../utils/user-dashboard/consentVerificationUtils';
import { LIT_RPC } from '@lit-protocol/constants';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

type AddPermittedActionsProps = {
  wallet: PKPEthersWallet;
  agentPKPTokenId: string;
  toolIpfsCids: string[];
  policyIpfsCids: string[];
};

export const useAddPermittedActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addPermittedActions = useCallback(
    async ({ wallet, agentPKPTokenId, toolIpfsCids, policyIpfsCids }: AddPermittedActionsProps) => {
      if (!wallet || !agentPKPTokenId || !toolIpfsCids.length) {
        setError('Missing required data for adding permitted actions');
        return;
      }

      setIsLoading(true);
      setLoadingStatus('Initializing Lit Contracts');
      setError(null);

      try {
        // Initialize Lit Contracts
        const litContracts = new LitContracts({
          network: SELECTED_LIT_NETWORK,
          signer: wallet,
        });
        await litContracts.connect();

        setLoadingStatus('Fetching Current Permissions');
        const permittedActions =
          await litContracts.pkpPermissionsContractUtils.read.getPermittedActions(agentPKPTokenId);

        const permittedActionSet = new Set(
          permittedActions
            .map((cid: string) => {
              const base58Cid = hexToBase58(cid);
              return base58Cid;
            })
            .filter(Boolean),
        );

        setLoadingStatus('Processing Policy Permissions');
        // Process policy IPFS CIDs
        for (const ipfsCid of policyIpfsCids) {
          if (IPFS_POLICIES_THAT_NEED_SIGNING[ipfsCid]) {
            if (!permittedActionSet.has(ipfsCid)) {
              await litContracts.addPermittedAction({
                ipfsId: ipfsCid,
                pkpTokenId: agentPKPTokenId,
                authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
              });
            }
          }
        }

        setLoadingStatus('Processing Tool Permissions');
        // Process tool IPFS CIDs
        for (const ipfsCid of toolIpfsCids) {
          if (!permittedActionSet.has(ipfsCid)) {
            await litContracts.addPermittedAction({
              ipfsId: ipfsCid,
              pkpTokenId: agentPKPTokenId,
              authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
            });
          }
        }

        setLoadingStatus('Permissions Added Successfully');
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to add permitted actions');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { addPermittedActions, isLoading, loadingStatus, error };
};
