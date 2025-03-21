/**
 * Disables console.log, console.info, and console.debug in production environments
 * while preserving console.warn and console.error functionality
 */
export function disableLogsInProduction(): void {
  if (process.env.NEXT_PUBLIC_NODE_ENV === 'production') {
    console.log = function() {};
    console.info = function() {};
    console.debug = function() {};
    // Keep console.warn and console.error for important messages
  }
}

/**
 * Execute the function immediately to disable logs when this module is imported
 */
disableLogsInProduction(); 