import { getFeatureFlags } from '@lit-protocol/flags';

import Flags from './featureState.json';
import type { Features } from './features';

const envVarName = 'LIT_FEATURE_ENV';

const Features = getFeatureFlags({
  envVarName,
  featureState: Flags,
}) as Features;

export { Features };
