const { readFileSync } = require('fs');
const path = require('path'); // Add this import

// Reading the SWC compilation config for the spec files
const swcJestConfig = JSON.parse(readFileSync(`${__dirname}/.spec.swcrc`, 'utf-8'));

// Disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves
swcJestConfig.swcrc = false;

module.exports = {
  displayName: '@lit-protocol/toolpolicies-e2e',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  // @noble/secp256k1 is an ESM module while breaks unless we add it to transformIgnorePatterns
  transformIgnorePatterns: [
    // This pattern matches the PNPM format where @ in package names is replaced with +
    '<rootDir>/node_modules/.pnpm/(?!(@noble\\+secp256k1)@)',

    // For the absolute path pattern
    `${path.join(__dirname, '../..')}/node_modules/.pnpm/(?!(@noble\\+secp256k1)@)`,

    // For the relative pattern matching node_modules structure
    'node_modules/(?!.pnpm|@noble/secp256k1)',
  ],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: 'test-output/jest/coverage',
  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/test-e2e/**/*.spec.ts',
    '<rootDir>/test-e2e/**/*.test.ts',
  ],
  setupFilesAfterEnv: ['./jest.setup.js'],
};
