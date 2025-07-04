const fs = require('fs');
const path = require('path');
const { buildVincentTool, buildVincentPolicy } = require('./esbuild');

// Base directories for tools and policies
const ACTIONS_DIR = path.resolve(__dirname, '../src/lib/');
const GENERATED_DIR = path.resolve(__dirname, '../src/generated');
const TSCONFIG_PATH = path.resolve(__dirname, '../tsconfig.app.json');

/**
 * Gets all tool directories in the specified base directory and its subdirectories
 * @param {string} baseDir - The base directory to search in
 * @returns {Object[]} Array of objects with actionDir (relative path) and fullPath
 */
function getActionDirectories(baseDir) {
  const results = [];

  // Helper function to recursively search directories
  function searchDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const itemRelativePath = relativePath ? path.join(relativePath, item) : item;

      if (fs.statSync(itemPath).isDirectory()) {
        // Check if this directory contains a tool
        if (fs.existsSync(path.join(itemPath, 'lit-action.ts'))) {
          results.push({
            actionDir: itemRelativePath,
            fullPath: itemPath,
          });
        } else {
          // Recursively search subdirectories
          searchDirectory(itemPath, itemRelativePath);
        }
      }
    }
  }

  searchDirectory(baseDir);
  return results;
}

/**
 * Builds all tools and policies in the specified directories
 */
async function buildAllActions() {
  // Ensure the generated directory exists
  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
  }

  const actions = getActionDirectories(ACTIONS_DIR);

  console.log(`Found ${actions.length} actions`);
  console.log(`Building all actions in parallel...`);

  const results = await Promise.all(
    actions.map(async (tool) => {
      const { actionDir, fullPath } = tool;
      const entryPoint = path.join(fullPath, 'lit-action.ts');
      const outdir = path.join(GENERATED_DIR, actionDir);

      console.log(`Starting build: ${actionDir}`);
      try {
        if (actionDir.includes('tool')) {
          await buildVincentTool({
            entryPoint,
            outdir,
            tsconfigPath: TSCONFIG_PATH,
          });
        } else {
          await buildVincentPolicy({
            entryPoint,
            outdir,
            tsconfigPath: TSCONFIG_PATH,
          });
        }
        console.log(`Successfully built: ${actionDir}`);
        return { name: actionDir, success: true };
      } catch (error) {
        console.error(`Error building ${actionDir}:`, error);
        return { name: actionDir, success: false, error: error.message };
      }
    }),
  );

  // Print summary
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;

  console.log('\nBuild Summary:');
  console.log('===================');
  console.log(`Total: ${results.length}, Success: ${successCount}, Failed: ${failCount}`);

  if (failCount > 0) {
    console.log('\nFailed builds:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`- ${r.name}: ${r.error}`);
      });
    throw new Error('Some builds failed');
  } else {
    console.log('All actions built successfully!');
  }
}

// Execute the build function
buildAllActions().catch((error) => {
  console.error('Error building actions:', error);
  process.exit(1);
});
