import { useEffect, useState, useCallback } from "react";
import { z } from "zod";

interface HiddenTokensData {
    hiddenTokens: string[];
    isProcessing: boolean;
    error: string | null;
}

interface HiddenTokensActions {
    hideToken: (address: string) => void;
    unhideToken: (address: string) => void;
}

interface HiddenTokensHook extends HiddenTokensData, HiddenTokensActions {}

const HIDDEN_TOKENS_KEY = 'hidden-tokens';

const ethereumAddressSchema = z.string().regex(/^(0x)?[0-9a-f]{40}$/, {
    message: "Invalid Ethereum address format"
});

// Schema for the hidden tokens - an array of lowercase Ethereum addresses
const hiddenTokensSchema = z.array(ethereumAddressSchema)
    .refine(addresses => {
        return addresses.every(addr => addr === addr.toLowerCase());
    }, {
        message: "All Ethereum addresses must be lowercase"
    });

export const useHiddenTokens = (): HiddenTokensHook => {
    const [hiddenTokens, setHiddenTokens] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadHiddenTokens = async () => {
            setIsProcessing(true);
            
            // Fetch data
            const storedHiddenTokens = localStorage.getItem(HIDDEN_TOKENS_KEY);

            if (!storedHiddenTokens) {
                setIsProcessing(false);
                return;
            }

            // Parse data
            let parsedData;
            try {
                parsedData = JSON.parse(storedHiddenTokens);
            } catch (parseError) {
                setError("Failed to parse hidden tokens data from storage");
                localStorage.setItem(HIDDEN_TOKENS_KEY, JSON.stringify([]));
                setIsProcessing(false);
                return;
            }

            // Validate data
            try {
                const validatedData = hiddenTokensSchema.parse(parsedData);
                setHiddenTokens(validatedData);
            } catch (validationError) {
                localStorage.removeItem(HIDDEN_TOKENS_KEY);
                setError("Invalid token data format - resetting token preferences");
            } finally {
                setIsProcessing(false);
            }
        };
        
        loadHiddenTokens();
    }, []);

    const hideToken = useCallback((address: string) => {
        if (address === 'ETH') return; // Don't allow hiding ETH

        const lowercaseAddress = address.toLowerCase();
        try {
            ethereumAddressSchema.parse(lowercaseAddress);
        } catch (validationError) {
            console.error('Invalid address format:', validationError);
            setError("Invalid Ethereum address format - cannot hide token");
            return;
        }

        const newHiddenTokens = [...hiddenTokens, lowercaseAddress];
        setHiddenTokens(newHiddenTokens);

        try {
            localStorage.setItem(HIDDEN_TOKENS_KEY, JSON.stringify(newHiddenTokens));
        } catch (error) {
            setError("Failed to save token preferences to browser storage");
            return;
        }
    }, [hiddenTokens]);

    const unhideToken = useCallback((address: string) => {
        const lowercaseAddress = address.toLowerCase();
        
        const newHiddenTokens = hiddenTokens.filter(
            (tokenAddr: string) => tokenAddr !== lowercaseAddress
        );
        setHiddenTokens(newHiddenTokens);

        try {
            localStorage.setItem(HIDDEN_TOKENS_KEY, JSON.stringify(newHiddenTokens));
        } catch (error) {
            setError("Failed to save token preferences to browser storage");
            return;
        }
    }, [hiddenTokens]);

    return { 
        hiddenTokens, 
        isProcessing, 
        error,
        hideToken,
        unhideToken
    };
}
