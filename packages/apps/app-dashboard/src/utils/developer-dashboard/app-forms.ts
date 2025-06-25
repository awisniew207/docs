import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Delay in milliseconds for redirects after successful operations */
export const REDIRECT_DELAY_MS = 1500;

/** Delay in milliseconds for clearing success messages */
export const SUCCESS_MESSAGE_CLEAR_DELAY_MS = 3000;

// =============================================================================
// TYPES & SCHEMAS
// =============================================================================

/** Tool selection schema based on the Vincent Registry API types */
export const ToolSelectionSchema = z.object({
  packageName: z.string().describe('Tool NPM package name'),
  activeVersion: z.string().describe('Active version of the tool'),
  title: z.string().optional().describe('Tool title'),
  description: z.string().optional().describe('Tool description'),
});

export type ToolSelection = z.infer<typeof ToolSelectionSchema>;

/** Enhanced error type for better error handling */
export interface ApiError {
  data?: {
    message?: string;
  };
  message?: string;
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Handles navigation with a delay after successful operations
 */
export const navigateWithDelay = (navigate: ReturnType<typeof useNavigate>, path: string) => {
  setTimeout(() => navigate(path), REDIRECT_DELAY_MS);
};

/**
 * Extracts error message from various error formats
 */
export const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (error && typeof error === 'object') {
    const apiError = error as ApiError;
    return apiError.data?.message || apiError.message || fallbackMessage;
  }
  return fallbackMessage;
};

/**
 * Clears a result state after a delay
 */
export const clearResultWithDelay = (
  clearFunction: () => void,
  delay = SUCCESS_MESSAGE_CLEAR_DELAY_MS,
) => {
  setTimeout(clearFunction, delay);
};

/**
 * Formats multiple error messages from failed operations
 */
export const formatMultipleErrors = (errors: any[], operationName: string): string => {
  const errorMessages = errors
    .map((e: any) => e.error?.data?.message || e.error?.message)
    .filter(Boolean);

  return `Failed to ${operationName} ${errors.length} items: ${errorMessages.join(', ')}`;
};
