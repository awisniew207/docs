#!/usr/bin/env node
'use strict';
/**
 * Command-line interface for Vincent MCP
 *
 * This module provides a command-line interface for the Model Context Protocol (MCP)
 * implementation in Vincent. It serves as the entry point for running the MCP server
 * in different modes (HTTP or stdio).
 *
 * The CLI accepts a single argument specifying the mode:
 * - 'http': Starts the MCP server in HTTP mode, which provides a web server interface
 * - 'stdio': Starts the MCP server in stdio mode, which communicates through standard input/output
 *
 * @module cli
 * @category Vincent MCP
 */
Object.defineProperty(exports, '__esModule', { value: true });
const [sub] = process.argv.slice(2);
if (sub === 'http') require('./http');
else if (sub === 'stdio') require('./stdio');
else {
  console.error('usage: vincent-mcp <http|stdio>');
  process.exit(1);
}
