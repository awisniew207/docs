/**
 * Interface for the App data structure used in the dashboard
 */
export interface AppView {
  appId: number;
  appName: string;
  description: string;
  authorizedRedirectUris: string[];
  delegatees: string[];
  toolPolicies: any[]; // Array of version data
  managementWallet: string;
  currentVersion: number;
  appMetadata: {
    email: string;
    // Add any other metadata fields here
  };
} 