import { getFeatureFlags } from '@lit-protocol/flags';

import Flags from './featureState.json';
import type { Features } from './features';

const getEnvironment = (): string => {
  if (typeof window !== 'undefined') {
    const url = window.location.href;
    return url.includes('vercel') ? 'STAGING' : 'PRODUCTION';
  }
  return 'PRODUCTION';
};

const envVarName = 'VITE_NEW_DASHBOARD';
if (typeof globalThis !== 'undefined') {
  globalThis.process = globalThis.process || {};
  globalThis.process.env = globalThis.process.env || {};
  globalThis.process.env[envVarName] = getEnvironment();
}

const Features = getFeatureFlags({
  envVarName,
  featureState: Flags,
}) as Features;

export { Features };
