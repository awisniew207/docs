import { SiweMessage } from "siwe";
import axios from "axios";
import { verifyMessage } from "ethers/lib/utils";
import { VincentApp } from "@/services/types";
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