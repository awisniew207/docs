module.exports = {
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  passWithNoTests: true,
  globalSetup: './test/integration/global-setup.ts',
  globalTeardown: './test/integration/global-teardown.ts',
};
