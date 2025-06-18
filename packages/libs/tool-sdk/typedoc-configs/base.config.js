module.exports = {
  extends: '../../../../typedoc.config.base.js',
  $schema: 'https://typedoc.org/schema.json',
  entryPoints: ['../src/index.ts'],
  name: 'vincent-tool-sdk',
  tsconfig: '../tsconfig.lib.json',
  includeVersion: true,
  navigation: {
    includeCategories: true,
  },
  defaultCategory: 'API',
  categorizeByGroup: false,
  // categoryOrder: ['vincent-tool-sdk'],
  visibilityFilters: {},
};
