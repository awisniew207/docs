import { getFeatureFlags } from '@lit-protocol/flags';
import Flags from './featureState.json';
import type { Features } from './features';

const envVarName = 'VITE_LIT_FEATURE_ENV';

const Features = getFeatureFlags({
  envVarName,
  featureState: Flags,
  runtimeEnv: import.meta.env,
}) as Features;

export { Features };
