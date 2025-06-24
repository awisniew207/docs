import { api, store } from './setup';
import { expectAssertArray, expectAssertObject } from '../assertions';
import { logIfVerbose } from '../log';

const VERBOSE_LOGGING = true;

const verboseLog = (value: any) => {
  logIfVerbose(value, VERBOSE_LOGGING);
};

describe('Policy API Integration Tests', () => {
  beforeAll(async () => {
    verboseLog('Policy API Integration Tests');
  });

  let testPackageName: string;
  let testPolicyVersion: string;

  // Test data for creating a policy
  const policyData = {
    title: 'Test Policy',
    description: 'Test policy for integration tests',
    activeVersion: '1.0.0',
    authorWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
  };

  // Test data for creating a policy version
  const policyVersionData = {
    changes: 'Initial version',
  };

  describe('GET /policies', () => {
    it('should return a list of policies', async () => {
      const result = await store.dispatch(api.endpoints.listAllPolicies.initiate());

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      expectAssertArray(result.data);
    });
  });

  describe('POST /policy', () => {
    it('should create a new policy', async () => {
      // Generate a unique package name for testing
      testPackageName = `@lit-protocol/vincent-policy-spending-limit`;
      testPolicyVersion = policyData.activeVersion;

      // Update the package name in the policy data
      const testData = {
        ...policyData,
      };

      const result = await store.dispatch(
        api.endpoints.createPolicy.initiate({
          packageName: testPackageName,
          policyCreate: testData,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toMatchObject({
        packageName: testPackageName,
        title: policyData.title,
        description: policyData.description,
        activeVersion: policyData.activeVersion,
        authorWalletAddress: policyData.authorWalletAddress,
      });
    });
  });

  describe('GET /policy/{packageName}', () => {
    it('should return a specific policy', async () => {
      const result = await store.dispatch(
        api.endpoints.getPolicy.initiate({ packageName: testPackageName }),
      );
      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toMatchObject({
        packageName: testPackageName,
        title: policyData.title,
        description: policyData.description,
        activeVersion: policyData.activeVersion,
      });
    });

    it('should return 404 for non-existent policy', async () => {
      const result = await store.dispatch(
        api.endpoints.getPolicy.initiate({
          packageName: `@vincent/non-existent-policy-${Date.now()}`,
        }),
      );

      expect(result).toHaveProperty('error');

      expect(result.isError).toBe(true);
      if (result.isError) {
        const { error } = result;
        expectAssertObject(error);
        // @ts-expect-error it's a test
        expect(error.status).toBe(404);
      }
    });
  });

  describe('PUT /policy/{packageName}', () => {
    it('should update a policy', async () => {
      const updateData = {
        description: 'Updated test policy description!',
      };

      const result = await store.dispatch(
        api.endpoints.editPolicy.initiate({
          packageName: testPackageName,
          policyEdit: updateData,
        }),
      );
      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      // Reset the API cache so we can verify the change
      store.dispatch(api.util.resetApiState());

      const getResult = await store.dispatch(
        api.endpoints.getPolicy.initiate({ packageName: testPackageName }),
      );

      verboseLog(getResult);

      const { data } = getResult;
      expectAssertObject(data);

      expect(data).toHaveProperty('description', updateData.description);
    });
  });

  describe('POST /policy/{packageName}/version/{version}', () => {
    it('should create a new policy version', async () => {
      const result = await store.dispatch(
        api.endpoints.createPolicyVersion.initiate({
          packageName: testPackageName,
          version: '1.0.1',
          policyVersionCreate: policyVersionData,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toHaveProperty('changes', policyVersionData.changes);
      expect(data).toHaveProperty('version', '1.0.1');
    });
  });

  describe('GET /policy/{packageName}/versions', () => {
    it('should list all versions of a policy', async () => {
      store.dispatch(api.util.resetApiState());

      const result = await store.dispatch(
        api.endpoints.getPolicyVersions.initiate({ packageName: testPackageName }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertArray(data);

      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /policy/{packageName}/version/{version}', () => {
    it('should get a specific policy version', async () => {
      store.dispatch(api.util.resetApiState());

      const result = await store.dispatch(
        api.endpoints.getPolicyVersion.initiate({
          packageName: testPackageName,
          version: testPolicyVersion,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toHaveProperty('version', testPolicyVersion);
      expect(data).toHaveProperty('changes', policyVersionData.changes);
    });

    it('should return 404 for non-existent version', async () => {
      const result = await store.dispatch(
        api.endpoints.getPolicyVersion.initiate({
          packageName: testPackageName,
          version: '999.999.999',
        }),
      );

      verboseLog(result);
      expect(result).toHaveProperty('error');

      expect(result.isError).toBe(true);
      if (result.isError) {
        const { error } = result;
        expectAssertObject(error);
        // @ts-expect-error it's a test
        expect(error.status).toBe(404);
      }
    });
  });

  describe('PUT /policy/{packageName}/version/{version}', () => {
    it('should update a policy version', async () => {
      store.dispatch(api.util.resetApiState());

      const changes = 'Updated changes description for policy version' as const;

      {
        const result = await store.dispatch(
          api.endpoints.editPolicyVersion.initiate({
            packageName: testPackageName,
            version: testPolicyVersion,
            policyVersionEdit: {
              changes,
            },
          }),
        );
        verboseLog(result);
        expect(result).not.toHaveProperty('error');

        const { data } = result;
        expectAssertObject(data);
      }

      store.dispatch(api.util.resetApiState());

      {
        // Verify the update
        const getResult = await store.dispatch(
          api.endpoints.getPolicyVersion.initiate({
            packageName: testPackageName,
            version: testPolicyVersion,
          }),
        );

        verboseLog(getResult);
        expect(getResult).not.toHaveProperty('error');

        const { data } = getResult;
        expectAssertObject(data);
        expect(data).toHaveProperty('changes', changes);
      }
    });
  });

  describe('PUT /policy/{packageName}/owner', () => {
    it('should change a policy owner', async () => {
      const newOwnerAddress = '0x9876543210abcdef9876543210abcdef98765432';

      const result = await store.dispatch(
        api.endpoints.changePolicyOwner.initiate({
          packageName: testPackageName,
          changeOwner: {
            authorWalletAddress: newOwnerAddress,
          },
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      // Reset the API cache so we can verify the change
      store.dispatch(api.util.resetApiState());

      const getResult = await store.dispatch(
        api.endpoints.getPolicy.initiate({ packageName: testPackageName }),
      );

      verboseLog(getResult);
      expect(getResult).not.toHaveProperty('error');

      const { data: updatedData } = getResult;
      expectAssertObject(updatedData);

      expect(updatedData).toHaveProperty('authorWalletAddress', newOwnerAddress);
    });
  });

  describe('DELETE /policy/{packageName}', () => {
    it('should delete a policy and all its versions', async () => {
      // First, delete the policy
      const result = await store.dispatch(
        api.endpoints.deletePolicy.initiate({ packageName: testPackageName }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      // Verify the message in the response
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('deleted successfully');

      // Reset the API cache
      store.dispatch(api.util.resetApiState());

      // Verify the policy is deleted by checking for a 404
      const getResult = await store.dispatch(
        api.endpoints.getPolicy.initiate({ packageName: testPackageName }),
      );

      verboseLog(getResult);
      expect(getResult).toHaveProperty('error');
      expect(getResult.isError).toBe(true);

      if (getResult.isError) {
        const { error } = getResult;
        expectAssertObject(error);
        // @ts-expect-error it's a test
        expect(error.status).toBe(404);
      }
    });
  });
});
