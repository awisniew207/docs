import { api, store } from './setup';

describe('Tool API Integration Tests', () => {
  const testToolPackageName = 'lodash';
  const testToolVersion = '4.17.21';

  describe('GET /tools', () => {
    it('should return a list of tools', async () => {
      const result = await store.dispatch(api.endpoints.listAllTools.initiate());
      expect(result.isSuccess).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('POST /tool', () => {
    it('should create a new tool', async () => {
      const toolData = {
        packageName: testToolPackageName,
        authorWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        description: 'Test tool for integration tests',
        version: testToolVersion,
      };

      const result = await store.dispatch(
        api.endpoints.createTool.initiate({ createTool: toolData }),
      );
      expect(result.isSuccess).toBe(true);
      expect(result.data.packageName).toBe(testToolPackageName);
      expect(result.data.description).toBe(toolData.description);
    });

    it('should reject invalid package names', async () => {
      const invalidToolData = {
        packageName: 'Invalid Package Name', // Contains spaces, which is invalid
        authorWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        description: 'Test tool with invalid package name',
        version: '4.17.21', // Valid version
      };

      const result = await store.dispatch(
        api.endpoints.createTool.initiate({ createTool: invalidToolData }),
      );
      expect(result.isError).toBe(true);
      expect(result.error.status).toBe(400);
      expect(result.error.data.error).toContain('Invalid NPM package name');
    });

    it('should reject invalid versions', async () => {
      const invalidVersionData = {
        packageName: 'lodash-test',
        authorWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        description: 'Test tool with invalid version',
        version: 'not-a-valid-version', // Not a valid semver
      };

      const result = await store.dispatch(
        api.endpoints.createTool.initiate({ createTool: invalidVersionData }),
      );
      expect(result.isError).toBe(true);
      expect(result.error.status).toBe(400);
      expect(result.error.data.error).toContain('Invalid semantic version');
    });

    it('should reject semver with range modifiers', async () => {
      const rangeVersionData = {
        packageName: 'lodash-test',
        authorWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        description: 'Test tool with range version',
        version: '^4.17.21', // Contains caret range modifier
      };

      const result = await store.dispatch(
        api.endpoints.createTool.initiate({ createTool: rangeVersionData }),
      );
      expect(result.isError).toBe(true);
      expect(result.error.status).toBe(400);
      expect(result.error.data.error).toContain('Invalid semantic version');

      // Test with tilde range modifier
      const tildeVersionData = { ...rangeVersionData, version: '~4.17.21' };
      const tildeResult = await store.dispatch(
        api.endpoints.createTool.initiate({ createTool: tildeVersionData }),
      );
      expect(tildeResult.isError).toBe(true);
      expect(tildeResult.error.status).toBe(400);
      expect(tildeResult.error.data.error).toContain('Invalid semantic version');

      // Test with less than or equal range modifier
      const lteVersionData = { ...rangeVersionData, version: '<=4.17.21' };
      const lteResult = await store.dispatch(
        api.endpoints.createTool.initiate({ createTool: lteVersionData }),
      );
      expect(lteResult.isError).toBe(true);
      expect(lteResult.error.status).toBe(400);
      expect(lteResult.error.data.error).toContain('Invalid semantic version');
    });
  });

  describe('GET /tool/:packageName', () => {
    it('should return a specific tool', async () => {
      const result = await store.dispatch(
        api.endpoints.getTool.initiate({ packageName: testToolPackageName }),
      );
      expect(result.isSuccess).toBe(true);
      expect(result.data.packageName).toBe(testToolPackageName);
    });

    it('should return 404 for non-existent tool', async () => {
      const result = await store.dispatch(
        api.endpoints.getTool.initiate({ packageName: 'non-existent-tool' }),
      );
      expect(result.isError).toBe(true);
      expect(result.error.status).toBe(404);
    });
  });

  describe('PUT /tool/:packageName', () => {
    it('should update a tool', async () => {
      const updateData = {
        description: 'Updated test tool description',
      };

      const result = await store.dispatch(
        api.endpoints.editTool.initiate({
          packageName: testToolPackageName,
          editTool: updateData,
        }),
      );
      expect(result.isSuccess).toBe(true);

      // Verify the update
      const getResult = await store.dispatch(
        api.endpoints.getTool.initiate({ packageName: testToolPackageName }),
      );
      expect(getResult.data.description).toBe(updateData.description);
    });
  });

  describe('POST /tool/:packageName/owner', () => {
    it('should change the tool owner', async () => {
      const newOwnerData = {
        authorWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      };

      const result = await store.dispatch(
        api.endpoints.changeToolOwner.initiate({
          packageName: testToolPackageName,
          changeOwner: newOwnerData,
        }),
      );
      expect(result.isSuccess).toBe(true);

      // Verify the owner change
      const getResult = await store.dispatch(
        api.endpoints.getTool.initiate({ packageName: testToolPackageName }),
      );
      expect(getResult.data.authorWalletAddress).toBe(newOwnerData.authorWalletAddress);
    });
  });

  describe('POST /tool/:packageName/version/:version', () => {
    it('should create a new tool version', async () => {
      const newVersion = '4.17.20';
      const versionData = {
        changes: 'Added new features',
        description: 'New version description',
      };

      const result = await store.dispatch(
        api.endpoints.createToolVersion.initiate({
          packageName: testToolPackageName,
          version: newVersion,
          versionChanges: versionData,
        }),
      );

      expect(result.isSuccess).toBe(true);
      expect(result.data.version).toBe(newVersion);
      expect(result.data.changes).toBe(versionData.changes);
    });

    it('should reject invalid versions', async () => {
      const invalidVersion = 'not-a-valid-version';
      const versionData = {
        changes: 'This should fail',
        description: 'Version with invalid format',
        repository: 'https://github.com/lodash/lodash',
      };

      const result = await store.dispatch(
        api.endpoints.createToolVersion.initiate({
          packageName: testToolPackageName,
          version: invalidVersion,
          versionChanges: versionData,
        }),
      );

      expect(result.isError).toBe(true);
      expect(result.error.status).toBe(400);
      expect(result.error.data.error).toContain('Invalid semantic version');
    });
  });

  describe('GET /tool/:packageName/versions', () => {
    it('should list all versions of a tool', async () => {
      const result = await store.dispatch(
        api.endpoints.getToolVersions.initiate({ packageName: testToolPackageName }),
      );
      expect(result.isSuccess).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /tool/:packageName/version/:version', () => {
    it('should get a specific tool version', async () => {
      const result = await store.dispatch(
        api.endpoints.getToolVersion.initiate({
          packageName: testToolPackageName,
          version: testToolVersion,
        }),
      );
      expect(result.isSuccess).toBe(true);
      expect(result.data.version).toBe(testToolVersion);
    });

    it('should return 404 for non-existent version', async () => {
      const result = await store.dispatch(
        api.endpoints.getToolVersion.initiate({
          packageName: testToolPackageName,
          version: '9.9.9',
        }),
      );
      expect(result.isError).toBe(true);
      expect(result.error.status).toBe(404);
    });
  });

  describe('PUT /tool/:packageName/version/:version', () => {
    it('should update a tool version', async () => {
      const updateData = {
        changes: 'Updated changes description',
      };

      const result = await store.dispatch(
        api.endpoints.editToolVersion.initiate({
          packageName: testToolPackageName,
          version: testToolVersion,
          versionChanges: updateData,
        }),
      );

      expect(result.isSuccess).toBe(true);

      // Verify the update
      const getResult = await store.dispatch(
        api.endpoints.getToolVersion.initiate({
          packageName: testToolPackageName,
          version: testToolVersion,
        }),
      );
      expect(getResult.data.changes).toBe(updateData.changes);
    });
  });

  describe('DELETE /tool/:packageName', () => {
    it('should delete a tool and its versions', async () => {
      const result = await store.dispatch(
        api.endpoints.deleteTool.initiate({ packageName: testToolPackageName }),
      );
      expect(result.isSuccess).toBe(true);
      expect(result.data.message).toContain('deleted successfully');

      // Verify the deletion
      const getResult = await store.dispatch(
        api.endpoints.getTool.initiate({ packageName: testToolPackageName }),
      );
      expect(getResult.isError).toBe(true);
      expect(getResult.error.status).toBe(404);
    });
  });
});
