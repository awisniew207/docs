/** Vincent Model Context Protocol (MCP) integration
 *
 * This module provides types and utilities for working with Vincent applications
 * that integrate with the Model Context Protocol.
 *
 * @module mcp
 * @category Vincent SDK API
 */

import {
  VincentAppDef,
  VincentAppDefSchema,
  VincentToolDef,
  VincentToolDefSchema,
} from './definitions';
import { getVincentAppServer } from './server';

export {
  VincentAppDef,
  VincentAppDefSchema,
  VincentToolDef,
  VincentToolDefSchema,
  getVincentAppServer,
};
