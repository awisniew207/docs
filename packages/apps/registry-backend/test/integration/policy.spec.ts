import { api } from './setup';

describe('Policy API Integration Tests', () => {
  const testPolicyPackageName = 'express';
  const testPolicyVersion = '4.18.2';

  describe('GET /policies', () => {
    it('should return a list of policies', async () => {
      const result = await api.endpoints.listAllPolicies.initiate();
      expect(result.isSuccess).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('POST /policy', () => {
    it('should create a new policy', async () => {
      const policyData = {
        packageName: testPolicyPackageName,
        authorWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        description: 'Test policy for integration tests',
        activeVersion: testPolicyVersion,
        version: testPolicyVersion,
      };

      const result = await api.endpoints.createPolicy.initiate({ createPolicyDef: policyData });
      expect(result.isSuccess).toBe(true);
      expect(result.data.packageName).toBe(testPolicyPackageName);
      expect(result.data.description).toBe(policyData.description);
    });

    it('should reject invalid package names', async () => {
      const invalidPolicyData = {
        packageName: 'Invalid Package Name', // Contains spaces, which is invalid
        authorWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        description: 'Test policy with invalid package name',
        activeVersion: '4.18.2', // Valid version
        version: testPolicyVersion,
      };

      const result = await api.endpoints.createPolicy.initiate({
        createPolicyDef: invalidPolicyData,
      });
      expect(result.isError).toBe(true);
      expect(result.error.status).toBe(400);
      expect(result.error.data.error).toContain('Invalid NPM package name');
    });

    it('should reject invalid versions', async () => {
      const invalidVersionData = {
        packageName: 'express-test',
        authorWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        description: 'Test policy with invalid version',
        activeVersion: 'not-a-valid-version', // Not a valid semver
        version: 'wt-version-is-this-1234567890',
      };

      const result = await api.endpoints.createPolicy.initiate({
        createPolicyDef: invalidVersionData,
      });
      expect(result.isError).toBe(true);
      expect(result.error.status).toBe(400);
      expect(result.error.data.error).toContain('Invalid semantic version');
    });

    it('should reject semver with range modifiers', async () => {
      const rangeVersionData = {
        packageName: 'express-test',
        authorWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        description: 'Test policy with range version',
        activeVersion: '^4.18.2', // Contains caret range modifier
        version: '^4.18.2',
      };

      const result = await api.endpoints.createPolicy.initiate({
        createPolicyDef: rangeVersionData,
      });
      expect(result.isError).toBe(true);
      expect(result.error.status).toBe(400);
      expect(result.error.data.error).toContain('Invalid semantic version');

      // Test with tilde range modifier
      const tildeVersionData = {
        ...rangeVersionData,
        activeVersion: '~4.18.2',
        version: '~4.18.2',
      };
      const tildeResult = await api.endpoints.createPolicy.initiate({
        createPolicyDef: tildeVersionData,
      });
      expect(tildeResult.isError).toBe(true);
      expect(tildeResult.error.status).toBe(400);
      expect(tildeResult.error.data.error).toContain('Invalid semantic version');

      // Test with greater than range modifier
      const gtVersionData = {
        ...rangeVersionData,
        activeVersion: '>4.18.2',
        version: '>4.18.2',
      };
      const gtResult = await api.endpoints.createPolicy.initiate({
        createPolicyDef: gtVersionData,
      });
      expect(gtResult.isError).toBe(true);
      expect(gtResult.error.status).toBe(400);
      expect(gtResult.error.data.error).toContain('Invalid semantic version');
    });
  });

  describe('GET /policy/:packageName', () => {
    it('should return a specific policy', async () => {
      const result = await api.endpoints.getPolicy.initiate({ packageName: testPolicyPackageName });
      expect(result.isSuccess).toBe(true);
      expect(result.data.packageName).toBe(testPolicyPackageName);
    });

    it('should return 404 for non-existent policy', async () => {
      const result = await api.endpoints.getPolicy.initiate({ packageName: 'non-existent-policy' });
      expect(result.isError).toBe(true);
      expect(result.error.status).toBe(404);
    });
  });

  describe('PUT /policy/:packageName', () => {
    it('should update a policy', async () => {
      const updateData = {
        description: 'Updated test policy description',
      };

      const result = await api.endpoints.editPolicy.initiate({
        packageName: testPolicyPackageName,
        editPolicyDef: updateData,
      });
      expect(result.isSuccess).toBe(true);

      // Verify the update
      const getResult = await api.endpoints.getPolicy.initiate({
        packageName: testPolicyPackageName,
      });
      expect(getResult.data.description).toBe(updateData.description);
    });
  });

  describe('POST /policy/:packageName/owner', () => {
    it('should change the policy owner', async () => {
      const newOwnerData = {
        authorWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      };

      const result = await api.endpoints.changePolicyOwner.initiate({
        packageName: testPolicyPackageName,
        changeOwner: newOwnerData,
      });
      expect(result.isSuccess).toBe(true);

      // Verify the owner change
      const getResult = await api.endpoints.getPolicy.initiate({
        packageName: testPolicyPackageName,
      });
      expect(getResult.data.authorWalletAddress).toBe(newOwnerData.authorWalletAddress);
    });
  });

  describe('POST /policy/:packageName/version/:version', () => {
    it('should create a new policy version', async () => {
      const newVersion = '4.18.1';
      const versionData = {
        changes: 'Added new features',
        description: 'New version description',
        repository: 'https://github.com/test/test-policy',
        keywords: ['test', 'policy', 'updated'],
        dependencies: [],
        contributors: [],
      };

      const result = await api.endpoints.createPolicyVersion.initiate({
        packageName: testPolicyPackageName,
        version: newVersion,
        versionChanges: versionData,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.data.version).toBe(newVersion);
      expect(result.data.changes).toBe(versionData.changes);
    });

    it('should reject invalid versions', async () => {
      const invalidVersion = 'not-a-valid-version';
      const versionData = {
        changes: 'This should fail',
        description: 'Version with invalid format',
        repository: 'https://github.com/expressjs/express',
        keywords: ['test', 'policy', 'invalid'],
        dependencies: [],
        contributors: [],
      };

      const result = await api.endpoints.createPolicyVersion.initiate({
        packageName: testPolicyPackageName,
        version: invalidVersion,
        versionChanges: versionData,
      });

      expect(result.isError).toBe(true);
      expect(result.error.status).toBe(400);
      expect(result.error.data.error).toContain('Invalid semantic version');
    });
  });

  describe('GET /policy/:packageName/versions', () => {
    it('should list all versions of a policy', async () => {
      const result = await api.endpoints.getPolicyVersions.initiate({
        packageName: testPolicyPackageName,
      });
      expect(result.isSuccess).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /policy/:packageName/version/:version', () => {
    it('should get a specific policy version', async () => {
      const result = await api.endpoints.getPolicyVersion.initiate({
        packageName: testPolicyPackageName,
        version: testPolicyVersion,
      });
      expect(result.isSuccess).toBe(true);
      expect(result.data.version).toBe(testPolicyVersion);
    });

    it('should return 404 for non-existent version', async () => {
      const result = await api.endpoints.getPolicyVersion.initiate({
        packageName: testPolicyPackageName,
        version: '9.9.9',
      });
      expect(result.isError).toBe(true);
      expect(result.error.status).toBe(404);
    });
  });

  describe('PUT /policy/:packageName/version/:version', () => {
    it('should update a policy version', async () => {
      const updateData = {
        changes: 'Updated changes description',
      };

      const result = await api.endpoints.editPolicyVersion.initiate({
        packageName: testPolicyPackageName,
        version: testPolicyVersion,
        versionChanges: updateData,
      });

      expect(result.isSuccess).toBe(true);

      // Verify the update
      const getResult = await api.endpoints.getPolicyVersion.initiate({
        packageName: testPolicyPackageName,
        version: testPolicyVersion,
      });
      expect(getResult.data.changes).toBe(updateData.changes);
    });
  });

  describe('DELETE /policy/:packageName', () => {
    it('should delete a policy and its versions', async () => {
      // Since there's no deletePolicy endpoint in the vincentApiClientNode,
      // we need to make a direct fetch request
      const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
      const response = await fetch(`${baseUrl}/policy/${testPolicyPackageName}`, {
        method: 'DELETE',
      });
      const responseData = await response.json();
      expect(response.status).toBe(200);
      expect(responseData.message).toContain('deleted successfully');

      // Verify the deletion
      const getResult = await api.endpoints.getPolicy.initiate({
        packageName: testPolicyPackageName,
      });
      expect(getResult.isError).toBe(true);
      expect(getResult.error.status).toBe(404);
    });
  });
});
