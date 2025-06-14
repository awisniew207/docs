import type { Config } from 'jest';

const config: Config = {
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  passWithNoTests: true,
  verbose: true,
};

export default config;
