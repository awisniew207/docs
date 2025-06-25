module.exports = {
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  testMatch: ['**/index.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globalSetup: './test/integration/global-setup.ts',
  globalTeardown: './test/integration/global-teardown.ts',
};
