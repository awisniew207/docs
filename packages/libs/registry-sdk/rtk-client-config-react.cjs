/**
 * @type {import('@rtk-query/codegen-openapi').ConfigFile}
 */
const config = {
  schemaFile: './src/generated/openapi.json',
  apiFile: './src/lib/internal/baseVincentRtkApiReact.ts',
  apiImport: 'baseVincentRtkApiReact',
  outputFile: './src/generated/vincentApiClientReact.ts',
  exportName: 'vincentApiClientReact',
  hooks: true,
};

module.exports = config;
