module.exports = {
  displayName: 'tool-uniswap-swap',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['./jest.setup.js'],
};
