/**
 * A unified logging interface that uses:
 * - Lit Protocol Logger for browser environments
 * - Pino for Node.js environments
 */

import { LogManager, Logger } from '@lit-protocol/logger';

// Environment detection
const isBrowser = typeof window !== 'undefined';

const DEFAULT_CATEGORY = 'vincent-contracts';

let logger: {
  info: (message: any, ...args: any[]) => void;
  error: (message: any, ...args: any[]) => void;
  warn: (message: any, ...args: any[]) => void;
  debug: (message: any, ...args: any[]) => void;
  trace: (message: any, ...args: any[]) => void;
  child: (bindings: object) => Logger;
};

// ================================================
// For browser environments, use the Lit Logger
// ================================================
if (isBrowser) {
  const browserLogger = LogManager.Instance.get(DEFAULT_CATEGORY);
  
  interface ExtendedBrowserLogger extends Logger {
    child: (bindings: object) => Logger;
  }
  
  logger = browserLogger as ExtendedBrowserLogger;
  
  // create a child logger with the same interface
  const createChildLogger = (bindings: object, category = DEFAULT_CATEGORY) => {
    // Use the object's properties to create a string ID for the child logger
    const id = Object.entries(bindings)
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    
    return LogManager.Instance.get(category, id);
  };
  
  // Add the child method to the browser logger
  logger.child = function(bindings: object) {
    return createChildLogger(bindings);
  };
} 
// ================================================
// For Node.js environments, use Pino
// ================================================
else {
  const pino = require('pino');
    
  logger = pino({
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: true },
    },
    base: { app: DEFAULT_CATEGORY }
  });
  
}

export { logger };
