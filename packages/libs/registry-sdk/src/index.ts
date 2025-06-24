import { registry as openAPIRegistry } from './lib/openApi/baseRegistry';
import openApiJson from './generated/openapi.json';

import { appCreate, appEdit, appDoc } from './lib/schemas/app';
import {
  appVersionCreate,
  appVersionEdit,
  appVersionDoc,
  appVersionToolCreate,
  appVersionToolDoc,
} from './lib/schemas/appVersion';

import {
  toolCreate,
  toolEdit,
  toolDoc,
  toolVersionCreate,
  toolVersionEdit,
  toolVersionDoc,
} from './lib/schemas/tool';

import {
  policyCreate,
  policyEdit,
  policyDoc,
  policyVersionCreate,
  policyVersionEdit,
  policyVersionDoc,
} from './lib/schemas/policy';

export * as nodeClient from './nodeClient';
export * as reactClient from './reactClient';

export { openApiJson, openAPIRegistry };

export const docSchemas = {
  appDoc,
  appEdit,
  appCreate,

  appVersionCreate,
  appVersionEdit,
  appVersionDoc,

  appVersionToolCreate,
  appVersionToolDoc,

  toolCreate,
  toolEdit,
  toolDoc,

  toolVersionCreate,
  toolVersionEdit,
  toolVersionDoc,

  policyCreate,
  policyEdit,
  policyDoc,

  policyVersionCreate,
  policyVersionEdit,
  policyVersionDoc,
};
