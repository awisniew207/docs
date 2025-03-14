import { VincentApp } from "@/services/types";
import { VincentContracts } from "./contract/contracts";

export async function checkIfAppExists(address: string): Promise<Boolean> {
    return true;
}

// export async function formCompleteVincentAppForDev(address: string): Promise<VincentApp[]> {
//     const contracts = new VincentContracts('datil');
//     console.log('address', address);
//     const apps = await contracts.getAppsByManager(address);
//     console.log('apps', apps);
    
//     // Map all apps to VincentApp type
//     return apps.map((app: any[]) => ({
//         appId: 0, // This needs to be fetched from somewhere else since it's not in the contract view
//         appName: app[0], // name
//         description: app[1], // description
//         authorizedDomains: app[5], // authorizedDomains
//         authorizedRedirectUris: app[6], // authorizedRedirectUris
//         delegatees: app[4], // delegatees
//         toolPolicies: [], // This needs to be fetched from somewhere else since it's not in the contract view
//         managementWallet: app[2], // manager
//         isEnabled: app[3], // This needs to be fetched from somewhere else since it's not in the contract view
//         appMetadata: {
//             email: ""
//         },
//         currentVersion: 0,
//     }));
// }

export async function formCompleteVincentAppForDev(address: string): Promise<VincentApp[]> {
    return [{
        appId: 0,
        appName: "Test App",
        description: "Test Description",
        authorizedDomains: ["test.com"],
        authorizedRedirectUris: ["https://test.com"],
        delegatees: ["0x1234567890123456789012345678901234567890"],
        toolPolicies: [],
        managementWallet: address,
        isEnabled: true,
        appMetadata: {
            email: "test@test.com",
        },
        currentVersion: 0,
    }]
}