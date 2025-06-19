import { getFeatureFlags } from '@lit-protocol/flags';

import Flags from './featureState.json';
import type { Features } from './features';

const getEnvironment = (): string => {
  if (typeof window !== 'undefined') {
    const url = window.location.href;
    const env = url.includes('vercel') ? 'STAGING' : 'PRODUCTION';
    console.log('🔍 Environment Detection:', { url, env });
    return env;
  }
  console.log('🔍 Server-side fallback: PRODUCTION');
  return 'PRODUCTION';
};

const envVarName = 'VITE_NEW_DASHBOARD';
const detectedEnv = getEnvironment();

if (typeof globalThis !== 'undefined') {
  globalThis.process = globalThis.process || {};
  globalThis.process.env = globalThis.process.env || {};
  globalThis.process.env[envVarName] = detectedEnv;
  console.log('🔍 Set env var:', envVarName, '=', detectedEnv);
}

const Features = getFeatureFlags({
  envVarName,
  featureState: Flags,
}) as Features;

export { Features };
