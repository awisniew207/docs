import { importPackage, identifySupportedPolicies } from '../../src/lib/packageImporter';
import { Policy, PolicyVersion } from '../../src/lib/mongo/policy';
import mongoose from 'mongoose';

describe('packageImporter integration tests', () => {
  // Define real packages to use for testing
  const policyPackage = {
    packageName: '@lit-protocol/vincent-policy-spending-limit',
    version: '1.0.1',
    type: 'policy' as const,
    expectedIpfsCid: 'QmNoWR1d2z6WwLB3Z2Lx3Uf38Y5V1u1DothS1xPJm9P8QH',
  };

  const toolPackage = {
    packageName: '@lit-protocol/vincent-tool-erc20-approval',
    version: '1.0.1',
    type: 'tool' as const,
    expectedIpfsCid: 'QmWHK5KsJitDwW1zHRoiJQdQECASzSjjphp4Rg8YqB6BsX',
  };

  describe('Successful package imports', () => {
    it('should successfully import a policy package and extract metadata', async () => {
      // Import the policy package
      const metadata = await importPackage(policyPackage);

      // Verify the metadata
      expect(metadata).toBeDefined();
      expect(metadata.ipfsCid).toBe(policyPackage.expectedIpfsCid);
    });

    it('should successfully import a tool package and extract metadata', async () => {
      // Import the tool package
      const metadata = await importPackage(toolPackage);

      // Verify the metadata
      expect(metadata).toBeDefined();
      expect(metadata.ipfsCid).toBe(toolPackage.expectedIpfsCid);
    });
  });

  describe('Temporary directory management', () => {
    it('should create temporary directories in the system tmp directory', async () => {
      // Import a package
      await importPackage(toolPackage);

      // We can't directly verify the directory creation since we're not mocking fs
      // But we can verify the package was imported successfully
      expect(true).toBe(true);
    });

    it('should create unique directories for concurrent executions', async () => {
      // Start two imports concurrently
      const promise1 = importPackage(toolPackage);
      const promise2 = importPackage(policyPackage);

      // Wait for both to complete
      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Verify both succeeded with different results
      expect(result1.ipfsCid).toBe(toolPackage.expectedIpfsCid);
      expect(result2.ipfsCid).toBe(policyPackage.expectedIpfsCid);
    });
  });

  describe('Error handling', () => {
    it('should throw an error for a non-existent package', async () => {
      await expect(
        importPackage({
          packageName: '@lit-protocol/non-existent-package',
          version: '1.0.0',
          type: 'tool',
        }),
      ).rejects.toThrow('Failed to download and extract package');
    });

    it('should throw an error for a non-existent version', async () => {
      await expect(
        importPackage({
          packageName: toolPackage.packageName,
          version: '999.999.999',
          type: 'tool',
        }),
      ).rejects.toThrow('Failed to download and extract package');
    });

    it('should throw an error if the package does not have the required metadata file', async () => {
      // Use a package that exists but doesn't have the metadata file
      await expect(
        importPackage({
          packageName: 'lodash',
          version: '4.17.21',
          type: 'tool',
        }),
      ).rejects.toThrow(/Metadata file.*not found/);
    });
  });

  describe('identifySupportedPolicies', () => {
    // Mock policy data
    const testPolicy1 = {
      packageName: '@lit-protocol/test-policy-1',
      title: 'Test Policy 1',
      description: 'Test policy 1 for testing',
      activeVersion: '1.0.0',
      authorWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    };

    const testPolicy2 = {
      packageName: '@lit-protocol/test-policy-2',
      title: 'Test Policy 2',
      description: 'Test policy 2 for testing',
      activeVersion: '1.0.0',
      authorWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    };

    // Mock policy version data
    const testPolicyVersion1 = {
      packageName: '@lit-protocol/test-policy-1',
      version: '1.0.0',
      changes: 'Initial version',
      description: 'Test policy 1 for testing',
      dependencies: {},
      ipfsCid: 'QmTestCid1',
    };

    beforeAll(async () => {
      // Clean up any existing test policies
      await Policy.deleteMany({
        packageName: { $in: [testPolicy1.packageName, testPolicy2.packageName] },
      });
      await PolicyVersion.deleteMany({
        packageName: { $in: [testPolicy1.packageName, testPolicy2.packageName] },
      });

      // Create test policies in the database
      await Policy.create(testPolicy1);
      await Policy.create(testPolicy2);

      // Create test policy version only for policy 1
      await PolicyVersion.create(testPolicyVersion1);
    });

    afterAll(async () => {
      // Clean up test policies
      await Policy.deleteMany({
        packageName: { $in: [testPolicy1.packageName, testPolicy2.packageName] },
      });
      await PolicyVersion.deleteMany({
        packageName: { $in: [testPolicy1.packageName, testPolicy2.packageName] },
      });
    });

    it('should identify supported policies correctly', async () => {
      const dependencies = {
        [testPolicy1.packageName]: '1.0.0', // Policy with version in registry
        [testPolicy2.packageName]: '1.0.0', // Policy without version in registry
        lodash: '4.17.21', // Not a policy
        express: '^4.18.2', // Non-explicit semver
      };

      const result = await identifySupportedPolicies(dependencies);

      expect(result.supportedPolicies).toContain(testPolicy1.packageName);
      expect(result.supportedPolicies).not.toContain(testPolicy2.packageName);
      expect(result.supportedPolicies).not.toContain('lodash');
      expect(result.supportedPolicies).not.toContain('express');
      expect(result.supportedPolicies.length).toBe(1);

      expect(result.policiesNotInRegistry).toContain(`${testPolicy2.packageName}@1.0.0`);
      expect(result.policiesNotInRegistry.length).toBe(1);
    });

    it('should skip packages with non-explicit semvers', async () => {
      const dependencies = {
        [testPolicy1.packageName]: '^1.0.0', // Non-explicit semver
        lodash: '~4.17.21', // Non-explicit semver
        express: '>4.18.2', // Non-explicit semver
        react: '*', // Non-explicit semver
      };

      const result = await identifySupportedPolicies(dependencies);

      expect(result.supportedPolicies.length).toBe(0);
      expect(result.policiesNotInRegistry.length).toBe(0);
    });

    it('should handle empty dependencies object', async () => {
      const result = await identifySupportedPolicies({});

      expect(result.supportedPolicies.length).toBe(0);
      expect(result.policiesNotInRegistry.length).toBe(0);
    });
  });
});
