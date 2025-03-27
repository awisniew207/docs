export const validateTokenAreAllowed = (
    tokenIn: string,
    tokenOut: string,
    allowedTokens: string[]
): void => {
    if (allowedTokens.length > 0) {
        // Check if tokenIn is allowed
        if (!allowedTokens.includes(tokenIn)) {
            throw new Error(
                `Token ${tokenIn} is not allowed for input. Allowed tokens: ${allowedTokens.join(', ')}`
            );
        }

        // Check if tokenOut is allowed
        if (!allowedTokens.includes(tokenOut)) {
            throw new Error(
                `Token ${tokenOut} is not allowed for output. Allowed tokens: ${allowedTokens.join(', ')}`
            );
        }
    }
}; 