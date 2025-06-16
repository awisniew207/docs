import * as jwt from './jwt';
export { jwt };
export type { JWTConfig, VincentJWT, VincentJWTPayload } from './jwt/types';

export { getVincentToolClientv1 } from './tool';
export type {
  VincentToolParamsv1,
  VincentToolClientConfigv1,
  VincentToolClientv1,
} from './tool/types';

export { getVincentToolClient } from './toolClient';

export { getVincentWebAppClient } from './app';
export type {
  VincentWebAppClient,
  VincentAppClientConfig,
  RedirectToVincentConsentPageParams,
} from './types';

import * as expressAuthHelpers from './express-authentication-middleware';
export { expressAuthHelpers };
export type { ExpressAuthHelpers } from './express-authentication-middleware/types';

import * as mcp from './mcp';
export { mcp };
