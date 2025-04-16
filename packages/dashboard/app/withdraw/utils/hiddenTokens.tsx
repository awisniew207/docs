import { useEffect, useState, useCallback } from "react";

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

export const useHiddenTokens = (): HiddenTokensHook => {
    const [hiddenTokens, setHiddenTokens] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadHiddenTokens = async () => {
            try {
                const storedHiddenTokens = localStorage.getItem(HIDDEN_TOKENS_KEY);
                if (storedHiddenTokens) {
                    const parsedHiddenTokens = JSON.parse(storedHiddenTokens);
                    setHiddenTokens(parsedHiddenTokens);
                }
            } catch (error) {
                console.error('Error loading hidden tokens from localStorage', error);
                setError(error as string);
            } finally {
                setIsProcessing(false);
            }
        }
        loadHiddenTokens();
    }, []);

    const hideToken = useCallback((address: string) => {
        if (address === 'ETH') return; // Don't allow hiding ETH

        const newHiddenTokens = [...hiddenTokens, address.toLowerCase()];
        setHiddenTokens(newHiddenTokens);

        // Save to localStorage
        try {
            localStorage.setItem(HIDDEN_TOKENS_KEY, JSON.stringify(newHiddenTokens));
        } catch (error) {
            console.error('Error saving to localStorage', error);
        }
    }, [hiddenTokens]);

    // Function to unhide a token
    const unhideToken = useCallback((address: string) => {
        const newHiddenTokens = hiddenTokens.filter(
            (tokenAddr: string) => tokenAddr !== address.toLowerCase()
        );
        setHiddenTokens(newHiddenTokens);

        // Save to localStorage
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
