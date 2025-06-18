module.exports = {
  extends: '../../../../typedoc.config.base.js',
  $schema: 'https://typedoc.org/schema.json',
  entryPoints: ['../src/index.ts'],
  name: 'vincent-app-sdk',
  tsconfig: '../tsconfig.lib.json',
  includeVersion: true,
  navigation: {
    includeCategories: true,
  },
  defaultCategory: 'API',
  categorizeByGroup: false,
  categoryOrder: ['vincent-app-sdk', 'Vincent SDK API', 'Vincent Web App', 'Vincent Tools'],
  visibilityFilters: {},
};
