import { VincentApp } from "@/services/types";
import { VincentContracts } from "./contract/contracts";

export async function formCompleteVincentAppForDev(address: string): Promise<VincentApp[]> {
    const contracts = new VincentContracts('datil');
    console.log('address', address);
    const apps = await contracts.getAppsByManager(address);
    console.log('apps', apps);

    return apps.map((appData: [any[], any[]], index: number) => {
        const [app, versions] = appData;
        const [
            name,
            description,
            manager,
            latestVersion,
            delegatees,
            authorizedDomains,
            authorizedRedirectUris
        ] = app;

        const latestVersionData = versions[versions.length - 1]
        const isEnabled = latestVersionData ? latestVersionData.enabled : false;

        return {
            appId: index,
            appName: name,
            description: description,
            authorizedDomains: authorizedDomains,
            authorizedRedirectUris: authorizedRedirectUris,
            delegatees: delegatees,
            toolPolicies: versions,
            managementWallet: manager,
            isEnabled: isEnabled,
            appMetadata: {
                email: "", // Not fetching off-chain data for now
            },
            currentVersion: latestVersion.toNumber(),
        };
    });
}

// export async function formCompleteVincentAppForDev(address: string): Promise<VincentApp[]> {
//     return [{
//         appId: 0,
//         appName: "Test App",
//         description: "Test Description",
//         authorizedDomains: ["test.com"],
//         authorizedRedirectUris: ["https://test.com"],
//         delegatees: ["0x1234567890123456789012345678901234567890"],
//         toolPolicies: [],
//         managementWallet: address,
//         isEnabled: true,
//         appMetadata: {
//             email: "test@test.com",
//         },
//         currentVersion: 0,
//     }]
// }