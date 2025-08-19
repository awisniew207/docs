import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { env } from '@/config/env';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient, SELECTED_LIT_NETWORK } from '@/utils/user-dashboard/lit';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { AUTH_METHOD_SCOPE } from '@lit-protocol/constants';
import { hexToBase58 } from '@/utils/user-dashboard/hexToBase58';

export type addVincentYieldToAgentPKPProps = {
  agentPKP: IRelayPKP;
  userPKP: IRelayPKP;
  sessionSigs: SessionSigs;
  connectInfoData: ConnectInfoMap;
};

const VINCENT_YIELD_APPID = Number(env.VITE_VINCENT_YIELD_APPID);

export async function addVincentYieldToAgentPKP({
  agentPKP,
  userPKP,
  sessionSigs,
  connectInfoData,
}: addVincentYieldToAgentPKPProps) {
  try {
    if (!sessionSigs || !userPKP) {
      throw new Error('Missing required authentication parameters: sessionSigs or userPKP');
    }

    if (!connectInfoData.app?.activeVersion) {
      throw new Error('Vincent Yield app information is incomplete');
    }

    const {
      app,
      supportedPoliciesByAbilityVersion,
      abilityVersionsByAppVersionAbility,
      appVersionAbilitiesByAppVersion,
    } = connectInfoData;
    const activeVersion = app.activeVersion;
    const versionKey = `${VINCENT_YIELD_APPID}-${activeVersion}`;

    // Get app version abilities for this version
    const appVersionAbilities = appVersionAbilitiesByAppVersion[versionKey] || [];

    // Create user PKP wallet
    const userPkpWallet = new PKPEthersWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: userPKP.publicKey,
      litNodeClient: litNodeClient,
    });
    await userPkpWallet.init();

    // Build permission data using the same pattern as ConnectPage
    const permissionData: Record<string, any> = {};

    appVersionAbilities.forEach((ability) => {
      const abilityKey = `${ability.abilityPackageName}-${ability.abilityVersion}`;
      const policies = supportedPoliciesByAbilityVersion[abilityKey] || [];
      const abilityVersions = abilityVersionsByAppVersionAbility[abilityKey] || [];
      const abilityVersion = abilityVersions[0];

      if (abilityVersion) {
        permissionData[abilityVersion.ipfsCid] = {};

        // Add all policies with empty default values (same as ConnectPage initial state)
        policies.forEach((policy) => {
          permissionData[abilityVersion.ipfsCid][policy.ipfsCid] = {};
        });
      }
    });

    // Add permitted actions directly
    const litContracts = new LitContracts({
      network: SELECTED_LIT_NETWORK,
      signer: userPkpWallet,
    });
    await litContracts.connect();

    const permittedActions =
      await litContracts.pkpPermissionsContractUtils.read.getPermittedActions(agentPKP.tokenId);
    const permittedActionSet = new Set(
      permittedActions
        .map((cid: string) => {
          const base58Cid = hexToBase58(cid);
          return base58Cid;
        })
        .filter(Boolean),
    );

    for (const ipfsCid of Object.keys(permissionData)) {
      if (!permittedActionSet.has(ipfsCid)) {
        await litContracts.addPermittedAction({
          ipfsId: ipfsCid,
          pkpTokenId: agentPKP.tokenId,
          authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
        });
      }
    }
    console.log('Permission data:', permissionData);
    console.log('App version abilities:', appVersionAbilities);
    console.log('supportedPoliciesByAbilityVersion:', supportedPoliciesByAbilityVersion);
    console.log('abilityVersionsByAppVersionAbility:', abilityVersionsByAppVersionAbility);

    // Get the client and permit the Vincent Yield app
    const client = getClient({ signer: userPkpWallet });
    const permitAppParams = {
      pkpEthAddress: agentPKP.ethAddress,
      appId: Number(env.VITE_VINCENT_YIELD_APPID),
      appVersion: activeVersion!, // There will always be an activeVersion
      permissionData,
    };

    console.log('Calling permitApp with params:', permitAppParams);
    const result = await client.permitApp(permitAppParams);
    console.log('permitApp result:', result);
    console.log('permitApp result type:', typeof result);
    console.log('permitApp result keys:', result ? Object.keys(result) : 'null/undefined');
  } catch (error) {
    console.error('Failed to add Vincent Yield to agent PKP:', error);
    throw new Error(
      `Vincent Yield setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
