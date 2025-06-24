import { api, store } from './setup';
import { expectAssertArray, expectAssertObject } from '../assertions';
import { logIfVerbose } from '../log';

const VERBOSE_LOGGING = true;

const verboseLog = (value: any) => {
  logIfVerbose(value, VERBOSE_LOGGING);
};

describe('App API Integration Tests', () => {
  beforeAll(async () => {
    verboseLog('App API Integration Tests');
  });

  // FIXME: baseUrl shouldn't be in here.
  const baseUrl = `http://localhost:${process.env.PORT || 3000}`;

  let testAppId: number | undefined;
  const testAppVersion = 1;

  const appData = {
    name: 'Test App',
    description: 'Test app for integration tests',
    contactEmail: 'test@example.com',
    appUserUrl: 'https://example.com/app',
    logo: 'https://example.com/logo.png',
    redirectUris: ['https://example.com/callback'],
    // deploymentStatus: 'dev' as const,
    managerAddress: '0x1234567890abcdef1234567890abcdef12345678',
  };

  describe('GET /apps', () => {
    it('should return a list of apps', async () => {
      const result = await store.dispatch(api.endpoints.listApps.initiate());

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      expectAssertArray(result.data);
    });
  });

  describe('POST /app', () => {
    it('should create a new app', async () => {
      const result = await store.dispatch(
        api.endpoints.createApp.initiate({
          appCreate: appData,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      testAppId = data.appId;

      expect(data).toMatchObject(appData);
    });
  });

  describe('GET /app/:appId', () => {
    it('should return a specific app', async () => {
      const result = await store.dispatch(api.endpoints.getApp.initiate({ appId: testAppId }));
      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toMatchObject(appData);
    });

    it('should return 404 for non-existent app', async () => {
      const result = await store.dispatch(
        api.endpoints.getApp.initiate({ appId: Number(Math.random() * 1000000) }),
      );

      expect(result).not.toHaveProperty('error');

      expect(result.isError).toBe(true);
      if (result.isError) {
        const { error } = result;
        expectAssertObject(error);
        expect(error.status).toBe(404);
      }
    });
  });

  describe('PUT /app/:appId', () => {
    it('should update an app', async () => {
      const updateData = {
        description: 'Updated test app description',
      };

      const result = await store.dispatch(
        api.endpoints.editApp.initiate({
          appId: testAppId,
          createApp: updateData,
        }),
      );
      expect(result.isSuccess).toBe(true);

      // Verify the update
      const getResult = await store.dispatch(api.endpoints.getApp.initiate({ appId: testAppId }));
      expect(getResult.data.description).toBe(updateData.description);
    });
  });

  describe('POST /app/:appId/owner', () => {
    it('should change the app owner', async () => {
      const newOwnerData = {
        managerAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      };

      // Since there's no changeAppOwner endpoint in the vincentApiClientNode,
      // we need to make a direct fetch request
      const response = await fetch(`${baseUrl}/app/${testAppId}/owner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOwnerData),
      });
      expect(response.status).toBe(200);

      // Verify the owner change
      const getResult = await store.dispatch(api.endpoints.getApp.initiate({ appId: testAppId }));
      expect(getResult.data.managerAddress).toBe(newOwnerData.managerAddress);
    });
  });

  describe('POST /app/:appId/version', () => {
    it('should create a new app version', async () => {
      const versionData = {
        changes: 'Added new features',
      };

      const result = await store.dispatch(
        api.endpoints.createAppVersion.initiate({
          appId: testAppId,
          createAppVersion: versionData,
        }),
      );

      expect(result.isSuccess).toBe(true);
      expect(result.data.changes).toBe(versionData.changes);
      expect(result.data.version).toBe(2); // Since the first version is 1
    });
  });

  describe('GET /app/:appId/versions', () => {
    it('should list all versions of an app', async () => {
      const result = await store.dispatch(
        api.endpoints.getAppVersions.initiate({ appId: testAppId }),
      );
      expect(result.isSuccess).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /app/:appId/version/:version', () => {
    it('should get a specific app version', async () => {
      const result = await store.dispatch(
        api.endpoints.getAppVersion.initiate({
          appId: testAppId,
          version: testAppVersion,
        }),
      );
      expect(result.isSuccess).toBe(true);
      expect(result.data.version).toBe(testAppVersion);
    });

    it('should return 404 for non-existent version', async () => {
      const result = await store.dispatch(
        api.endpoints.getAppVersion.initiate({
          appId: testAppId,
          version: 999,
        }),
      );
      expect(result.isError).toBe(true);
      expect(result.error.status).toBe(404);
    });
  });

  describe('PUT /app/:appId/version/:version', () => {
    it('should update an app version', async () => {
      const updateData = {
        changes: 'Updated changes description',
      };

      const result = await store.dispatch(
        api.endpoints.editAppVersion.initiate({
          appId: testAppId,
          version: testAppVersion,
          versionChanges: updateData,
        }),
      );

      expect(result.isSuccess).toBe(true);

      // Verify the update
      const getResult = await store.dispatch(
        api.endpoints.getAppVersion.initiate({
          appId: testAppId,
          version: testAppVersion,
        }),
      );
      expect(getResult.data.changes).toBe(updateData.changes);
    });
  });

  describe('POST /app/:appId/version/:version/disable', () => {
    it('should disable an app version', async () => {
      const result = await store.dispatch(
        api.endpoints.disableAppVersion.initiate({
          appId: testAppId,
          version: testAppVersion,
        }),
      );
      expect(result.isSuccess).toBe(true);

      // Verify the version is disabled
      const getResult = await store.dispatch(
        api.endpoints.getAppVersion.initiate({
          appId: testAppId,
          version: testAppVersion,
        }),
      );
      expect(getResult.data.enabled).toBe(false);
    });
  });

  describe('POST /app/:appId/version/:version/enable', () => {
    it('should enable an app version', async () => {
      const result = await store.dispatch(
        api.endpoints.enableAppVersion.initiate({
          appId: testAppId,
          version: testAppVersion,
        }),
      );
      expect(result.isSuccess).toBe(true);

      // Verify the version is enabled
      const getResult = await store.dispatch(
        api.endpoints.getAppVersion.initiate({
          appId: testAppId,
          version: testAppVersion,
        }),
      );
      expect(getResult.data.enabled).toBe(true);
    });
  });

  describe('DELETE /app/:appId', () => {
    it('should delete an app and its versions', async () => {
      const result = await store.dispatch(api.endpoints.deleteApp.initiate({ appId: testAppId }));
      expect(result.isSuccess).toBe(true);
      expect(result.data.message).toContain('deleted successfully');

      // Verify the deletion
      const getResult = await store.dispatch(api.endpoints.getApp.initiate({ appId: testAppId }));
      expect(getResult.isError).toBe(true);
      expect(getResult.error.status).toBe(404);
    });
  });
});
