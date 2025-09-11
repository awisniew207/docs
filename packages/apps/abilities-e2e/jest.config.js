const path = require('path');

module.exports = {
  displayName: '@lit-protocol/vincent-abilities-e2e',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/test-e2e/**/*.spec.ts',
    '<rootDir>/test-e2e/**/*.test.ts',
  ],
  transformIgnorePatterns: [
    // PNPM style: scoped packages with `.` become `+`, and non-scoped stay the same
    // Include all @account-kit and @aa-sdk packages using wildcards
    '<rootDir>/node_modules/.pnpm/(?!(@noble\\+secp256k1|cbor2|@cto\\.af\\+wtf8|@account-kit\\+[^@]+|@aa-sdk\\+[^@]+|@lit-protocol\\+vincent-scaffold-sdk)@)',

    // Absolute path variant (in case of different module resolution by Jest)
    `${path.join(__dirname, '../..')}/node_modules/.pnpm/(?!(@noble\\+secp256k1|cbor2|@cto\\.af\\+wtf8|@account-kit\\+[^@]+|@aa-sdk\\+[^@]+|@lit-protocol\\+vincent-scaffold-sdk)@)`,

    // Fallback for non-PNPM node_modules structure
    'node_modules/(?!.pnpm|@noble/secp256k1|cbor2|@cto\\.af/wtf8|@account-kit/[^/]+|@aa-sdk/[^/]+|@lit-protocol/vincent-scaffold-sdk)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  detectOpenHandles: true,
};
