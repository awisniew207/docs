'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.env = void 0;
const env_core_1 = require('@t3-oss/env-core');
const zod_1 = require('zod');
// Ref: https://github.com/t3-oss/t3-env/pull/145
const booleanStrings = ['true', 'false', true, false, '1', '0', 'yes', 'no', 'y', 'n', 'on', 'off'];
const BooleanOrBooleanStringSchema = zod_1.z
  .any()
  .refine((val) => booleanStrings.includes(val), { message: 'must be boolean' })
  .transform((val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      const normalized = val.toLowerCase().trim();
      if (['true', 'yes', 'y', '1', 'on'].includes(normalized)) return true;
      if (['false', 'no', 'n', '0', 'off'].includes(normalized)) return false;
      throw new Error(`Invalid boolean string: "${val}"`);
    }
    throw new Error(`Expected boolean or boolean string, got: ${typeof val}`);
  });
exports.env = (0, env_core_1.createEnv)({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    HTTP_PORT: zod_1.z.coerce.number().default(3000),
    PUBKEY_ROUTER_DATIL_CONTRACT: zod_1.z.string(),
    VINCENT_APP_JSON_DEFINITION: zod_1.z.string(),
    VINCENT_DELEGATEE_PRIVATE_KEY: zod_1.z.string(),
    VINCENT_DATIL_CONTRACT: zod_1.z.string(),
  },
});
