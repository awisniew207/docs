import { SiweMessage } from "siwe";
import axios from "axios";
import { verifyMessage } from "ethers/lib/utils";
import { VincentApp } from "@/types";
import { VincentContracts } from "../contract/contracts";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_BE_BASE_URL || "http://localhost:8000/api/v1";

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

async function createSiweMessage(address: string, action: string, params = {}) {
    const message = new SiweMessage({
        domain: "localhost", // Use actual domain from window
        address,
        statement: "Log in to App Registry with your Management Wallet",
        uri: "https://localhost/*", // Use actual origin from window
        version: "1",
        chainId: 1,
        nonce: Math.random().toString(36).slice(2),
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
    });

    const preparedMessage = message.prepareMessage();

    const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [preparedMessage, address],
    });

    const signerAddress = verifyMessageWithEthers(preparedMessage, signature);

    const signedMessage = {
        message: preparedMessage,
        signature,
    };
    return JSON.stringify(signedMessage);
}

function verifyMessageWithEthers(message: any, signature: string) {
    const signerAddress = verifyMessage(message, signature);
    return signerAddress;
}

// Register new app
export async function registerApp(
    address: string,
    params: {
        name: string;
        description: string;
        contactEmail: string;
        authorizedDomains: string[];
        authorizedRedirectUris: string[];
    }
) {
    const signedMessage = await createSiweMessage(
        address,
        "register_app",
        params
    );

    const body = {
        ...params,
        signedMessage,
        managementWallet: address,
    };

    const response = await axios.post(`${API_BASE_URL}/registerApp`, body);
    return response.data.data;
}

// Update app metadata
export async function updateApp(
    address: string,
    params: {
        appId: number;
        contactEmail: string;
        description: string;
        name: string;
        authorizedDomains: string[];
        authorizedRedirectUris: string[];
    }
) {
    const signedMessage = await createSiweMessage(
        address,
        "update_app",
        params
    );

    const response = await axios.put(`${API_BASE_URL}/updateApp`, {
        ...params,
        signedMessage,
    });
    return response.data.data;
}

// Add tool policy to app
export async function addToolPolicy(
    address: string,
    params: {
        appId: number;
        toolPolicy: {
            description: string;
            toolIpfsCid: string;
            policyVarsSchema: {
                paramName: string;
                valueType: string;
                defaultValue: string;
            }[];
        };
    }
) {
    const signedMessage = await createSiweMessage(
        address,
        "add_tool_policy",
        params
    );

    const response = await axios.post(`${API_BASE_URL}/addToolPolicy`, {
        ...params,
        signedMessage,
    });
    return response.data.data;
}

// Update tool policy
export async function updateToolPolicy(
    address: string,
    params: {
        appId: number;
        toolPolicyId: string;
        toolPolicy: {
            description: string;
            toolIpfsCid: string;
            policyVarsSchema: {
                paramName: string;
                valueType: string;
                defaultValue: string;
            }[];
        };
    }
) {
    const signedMessage = await createSiweMessage(
        address,
        "update_tool_policy",
        params
    );

    const response = await axios.put(`${API_BASE_URL}/updateToolPolicy`, {
        ...params,
        signedMessage,
    });
    return response.data.data;
}

// Add delegatee to app
export async function addDelegatee(
    address: string,
    params: {
        appId: number;
        delegateeAddress: string;
    }
) {
    const signedMessage = await createSiweMessage(
        address,
        "add_delegatee",
        params
    );

    const response = await axios.post(`${API_BASE_URL}/addDelegatee`, {
        ...params,
        signedMessage,
    });
    return response.data.data;
}

// Remove delegatee from app
export async function removeDelegatee(
    address: string,
    params: {
        appId: number;
        delegateeAddress: string;
    }
) {
    const signedMessage = await createSiweMessage(
        address,
        "remove_delegatee",
        params
    );

    const response = await axios.post(`${API_BASE_URL}/removeDelegatee`, {
        ...params,
        signedMessage,
    });
    return response.data.data;
}

// Update management wallet
export async function updateManagementWallet(
    address: string,
    params: {
        appId: number;
        newManagementWallet: string;
    }
) {
    const signedMessage = await createSiweMessage(
        address,
        "update_management_wallet",
        params
    );

    const response = await axios.put(`${API_BASE_URL}/updateManagementWallet`, {
        ...params,
        signedMessage,
    });
    return response.data.data;
}

// Toggle app enabled status
export async function toggleAppEnabled(
    address: string,
    params: {
        appId: number;
        isEnabled: boolean;
    }
) {
    const signedMessage = await createSiweMessage(
        address,
        "toggle_app_enabled",
        params
    );

    const response = await axios.put(`${API_BASE_URL}/toggleAppEnabled`, {
        ...params,
        signedMessage,
    });
    return response.data.data;
}

// Get app details
export async function getAppDetails(appId: number) {
    const response = await axios.get(`${API_BASE_URL}/app/${appId}`);
    return response.data.data;
}

// Get all apps for a management wallet
export async function getAllApps(managementWallet: string) {
    const response = await axios.get(`${API_BASE_URL}/apps`, {
        params: {
            managementWallet,
        },
    });
    return response.data.data;
}

// ------------------------------------------------------------

export async function checkIfAppExists(address: string): Promise<Boolean> {
    return true;
}

export async function formCompleteVincentAppForDev(address: string): Promise<VincentApp[]> {
    const contracts = new VincentContracts('datil');
    const apps = await contracts.getAppsByManager(address);
    console.log('apps', apps);
    
    // index of app in the array is the appId
    const completeApps = await Promise.all(apps.map(async (app: any[], index: number) => {
        console.log('full app', app);
        const latestVersion = app[3];
        const versionedApp = await contracts.getAppVersion(index, latestVersion); // Get versioned app details
        
        return {
            appId: index,
            appName: app[0], // name
            description: app[1], // description
            authorizedDomains: app[5], // authorizedDomains
            authorizedRedirectUris: app[6], // authorizedRedirectUris
            delegatees: app[4], // delegatees
            toolPolicies: versionedApp.toolIpfsCidHashes.map((cid: string) => ({
                toolIpfsCid: cid,
                policyIpfsCid: "", // This would need to be fetched separately if needed
                parameters: [] // This would need to be fetched separately if needed
            })),
            managementWallet: app[2], // manager
            isEnabled: versionedApp.enabled,
            appMetadata: {
                email: "" // This needs to be fetched from somewhere else since it's off-chain
            }
        };
    }));
    
    return completeApps;
}

// export async function formCompleteVincentAppForDev(address: string): Promise<VincentApp> {
//     return {
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
//         }
//     }
// }