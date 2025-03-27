/* eslint-disable */
import { NETWORK_CONFIG, getPkpInfo } from '@lit-protocol/vincent-tool';
import { ethers } from "ethers";

import { getErc20Info, sendErc20ApprovalTx } from "./utils";


(async () => {
    console.log(`Using Lit Network: ${LIT_NETWORK}`);

    const networkConfig = NETWORK_CONFIG[LIT_NETWORK as keyof typeof NETWORK_CONFIG];
    console.log(
        `Using Vincent Contract Address: ${networkConfig.vincentAddress}`
    );
    console.log(
        `Using Pubkey Router Address: ${networkConfig.pubkeyRouterAddress}`
    );

    const userRpcProvider = new ethers.providers.JsonRpcProvider(toolParams.rpcUrl);
    const yellowstoneRpcProvider = new ethers.providers.JsonRpcProvider(
        await Lit.Actions.getRpcUrl({
            chain: 'yellowstone',
        })
    );

    const pkpInfo = await getPkpInfo(networkConfig.pubkeyRouterAddress, yellowstoneRpcProvider, toolParams.pkpEthAddress);
    console.log(`Retrieved PKP info for PKP ETH Address: ${toolParams.pkpEthAddress}: ${JSON.stringify(pkpInfo)}`);

    const tokenInDecimals = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'get token info' },
        async () => {
            const tokenInInfo = await getErc20Info(userRpcProvider, toolParams.tokenIn);

            return tokenInInfo.decimals.toString();
        }
    );

    const approvalTxHash = await sendErc20ApprovalTx(
        userRpcProvider,
        toolParams.chainId,
        toolParams.tokenIn,
        toolParams.amountIn,
        tokenInDecimals,
        toolParams.pkpEthAddress,
        pkpInfo.publicKey,
    );

    Lit.Actions.setResponse({
        response: JSON.stringify({
            status: 'success',
            approvalTxHash,
        }),
    });
})();