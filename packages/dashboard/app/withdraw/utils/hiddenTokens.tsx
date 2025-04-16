import { useEffect, useState, useCallback } from "react";
import { z } from "zod";

export interface HiddenTokensData {
    hiddenTokens: string[];
    isProcessing: boolean;
    error: string | null;
}

export interface HiddenTokensActions {
    hideToken: (address: string) => void;
    unhideToken: (address: string) => void;
}

export interface HiddenTokensHook extends HiddenTokensData, HiddenTokensActions {}

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
            try {
                const storedHiddenTokens = localStorage.getItem(HIDDEN_TOKENS_KEY);
                if (storedHiddenTokens) {
                    let parsedData;
                    
                    try {
                        parsedData = JSON.parse(storedHiddenTokens);
                    } catch (parseError) {
                        console.error('Error parsing hidden tokens data', parseError);
                        throw new Error('Invalid hidden tokens format');
                    }
                    
                    try {
                        const validatedData = hiddenTokensSchema.parse(parsedData);
                        setHiddenTokens(validatedData);
                    } catch (validationError) {
                        console.warn('Hidden tokens data validation failed:', validationError);
                        
                        localStorage.removeItem(HIDDEN_TOKENS_KEY);
                        setHiddenTokens([]);
                        
                        throw new Error('Hidden tokens data is invalid');
                    }
                }
            } catch (error) {
                console.error('Error loading hidden tokens from localStorage', error);
                setError(error as string);
                setHiddenTokens([]);
                localStorage.setItem(HIDDEN_TOKENS_KEY, JSON.stringify([]));
            } finally {
                setIsProcessing(false);
            }
        }
        loadHiddenTokens();
    }, []);

    const hideToken = useCallback((address: string) => {
        if (address === 'ETH') return; // Don't allow hiding ETH

        const lowercaseAddress = address.toLowerCase();
        try {
            ethereumAddressSchema.parse(lowercaseAddress);
        } catch (validationError) {
            console.error('Invalid address format:', validationError);
            return;
        }

        const newHiddenTokens = [...hiddenTokens, lowercaseAddress];
        setHiddenTokens(newHiddenTokens);

        try {
            localStorage.setItem(HIDDEN_TOKENS_KEY, JSON.stringify(newHiddenTokens));
        } catch (error) {
            console.error('Error saving to localStorage', error);
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
            console.error('Error saving to localStorage', error);
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
