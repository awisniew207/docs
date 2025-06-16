const path = require('path');

module.exports = {
  displayName: '@lit-protocol/toolpolicies-e2e',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/test-e2e/**/*.spec.ts',
    '<rootDir>/test-e2e/**/*.test.ts',
  ],
  transformIgnorePatterns: [
    // This pattern matches the PNPM format where @ in package names is replaced with +
    '<rootDir>/node_modules/.pnpm/(?!(@noble\\+secp256k1)@)',

    // For the absolute path pattern
    `${path.join(__dirname, '../..')}/node_modules/.pnpm/(?!(@noble\\+secp256k1)@)`,

    // For the relative pattern matching node_modules structure
    'node_modules/(?!.pnpm|@noble/secp256k1)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  detectOpenHandles: true,
};
