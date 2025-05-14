import { Api, ApiError } from '../common/api/index';
import { ICreateAppDef } from '../common/api/models/ICreateAppDef';
import { VersionChanges } from '../common/api/models/VersionChanges';
import { ICreateAppVersionDef } from '../common/api/models/ICreateAppVersionDef';

const fail = (message: string) => {
  expect(message).toBeFalsy();
};

type ValidationErrors = Array<{
  path: string[];
  message: string;
}>;

const waitBetweenRequests = () => new Promise((r) => setTimeout(r, 100));

describe('Integration tests', () => {
  const apiClient = new Api({
    BASE: 'http://localhost:3000',
  });

  let appIdentity: string;
  let versionIdentity: string;

  // App endpoint tests
  describe('App endpoints', () => {
    test('create app - valid', async () => {
      const app: ICreateAppDef = {
        name: 'Integration Test App',
        description: 'An app for integration testing',
        contactEmail: 'test@example.com',
        appUserUrl: 'https://example.com',
        logo: 'base64encodedlogo',
        redirectUris: ['https://example.com/callback'],
        deploymentStatus: ICreateAppDef.deploymentStatus.DEV,
        managerAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
      };

      const response = await apiClient.app.createApp(app);

      if ('appId' in response) {
        expect(response).toHaveProperty('identity');
        expect(response).toHaveProperty('appId');
        expect(response.name).toBe(app.name);
        expect(response.description).toBe(app.description);

        appIdentity = response.identity;
        console.log('Created app with identity:', appIdentity);
      } else {
        fail('Expected AppDef response but got Error');
      }

      await waitBetweenRequests();
    });

    test('create app - invalid schema', async () => {
      const invalidApp = {
        name: 'Invalid Test App',
      };

      try {
        await apiClient.app.createApp(invalidApp as any);
        fail('Expected API call to fail but it succeeded');
      } catch (e: any) {
        if (e instanceof ApiError) {
          expect(e.status).toBe(422);
          const errors = e.body as ValidationErrors;
          expect(Array.isArray(errors)).toBe(true);

          expect(errors.some((err) => err.path.includes('description'))).toBe(true);
          expect(errors.some((err) => err.path.includes('contactEmail'))).toBe(true);
        } else {
          throw e;
        }
      }

      await waitBetweenRequests();
    });

    test('get app - valid', async () => {
      if (!appIdentity) {
        console.warn('Skipping get app test - no app identity available');
        return;
      }

      const response = await apiClient.app.getApp(appIdentity);

      if ('appId' in response) {
        expect(response).toHaveProperty('identity', appIdentity);
        expect(response).toHaveProperty('name', 'Integration Test App');
        expect(response).toHaveProperty('description', 'An app for integration testing');
      } else {
        fail('Expected AppDef response but got Error');
      }

      await waitBetweenRequests();
    });

    test('update app - valid', async () => {
      if (!appIdentity) {
        console.warn('Skipping update app test - no app identity available');
        return;
      }

      const updatedApp: ICreateAppDef = {
        name: 'Updated Integration Test App',
        description: 'Updated description for integration testing',
        contactEmail: 'updated@example.com',
        appUserUrl: 'https://updated-example.com',
        logo: 'updatedbase64encodedlogo',
        redirectUris: ['https://updated-example.com/callback'],
        deploymentStatus: ICreateAppDef.deploymentStatus.TEST,
        managerAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
      };

      const response = await apiClient.app.editApp(appIdentity, updatedApp);

      if ('appId' in response) {
        expect(response).toHaveProperty('identity', appIdentity);
        expect(response).toHaveProperty('name', 'Updated Integration Test App');
        expect(response).toHaveProperty(
          'description',
          'Updated description for integration testing',
        );
      } else {
        fail('Expected AppDef response but got Error');
      }

      await waitBetweenRequests();
    });
  });

  // App Version endpoint tests
  describe('App Version endpoints', () => {
    beforeAll(async () => {
      try {
        if (!appIdentity) {
          console.warn('Skipping version setup - no app identity available');
          return;
        }

        const versionData: ICreateAppVersionDef = {
          tools: ['@vincent/foo-bar@1.0.0'],
          changes: 'Initial version',
        };

        const versionResponse = await apiClient.appVersion.createAppVersion(
          appIdentity,
          versionData,
        );
        if ('identity' in versionResponse) {
          versionIdentity = versionResponse.identity;
          console.log('Created version with identity:', versionIdentity);
        }

        await waitBetweenRequests();
      } catch (error) {
        console.error('Version setup failed:', error);
      }
    });

    test('get app versions - valid', async () => {
      if (!appIdentity) {
        console.warn('Skipping get app versions test - no app identity available');
        return;
      }

      const response = await apiClient.app.getAppVersions(appIdentity);

      if (Array.isArray(response)) {
        expect(response.length).toBeGreaterThan(0);
        expect(response[0]).toHaveProperty('identity');
        expect(response[0]).toHaveProperty('appId');
        expect(response[0]).toHaveProperty('changes', 'Initial version');
      } else {
        fail('Expected array of app versions but got Error');
      }

      await waitBetweenRequests();
    });

    test('get app version - valid', async () => {
      if (!versionIdentity) {
        console.warn('Skipping get app version test - no version identity available');
        return;
      }

      const response = await apiClient.appVersion.getAppVersion(versionIdentity);

      if ('version' in response) {
        expect(response.version).toHaveProperty('identity', versionIdentity);
        expect(response).toHaveProperty('tools');
        expect(Array.isArray(response.tools)).toBe(true);
        expect(response.tools.length).toBe(1);
        expect(response.tools[0].toolIdentity).toBe('@vincent/foo-bar@1.0.0');
      } else {
        fail('Expected app version with tools but got Error');
      }

      await waitBetweenRequests();
    });

    test('edit app version - valid', async () => {
      if (!versionIdentity) {
        console.warn('Skipping edit app version test - no version identity available');
        return;
      }

      const updateData: VersionChanges = {
        changes: 'Updated changelog',
      };

      const response = await apiClient.appVersion.editAppVersion(versionIdentity, updateData);

      if ('identity' in response) {
        expect(response).toHaveProperty('identity', versionIdentity);
        expect(response).toHaveProperty('changes', 'Updated changelog');
      } else {
        fail('Expected updated app version but got Error');
      }

      await waitBetweenRequests();
    });

    test('toggle app version - valid', async () => {
      if (!versionIdentity) {
        console.warn('Skipping toggle app version test - no version identity available');
        return;
      }

      const originalVersionResponse = await apiClient.appVersion.getAppVersion(versionIdentity);
      let originalEnabled = false;

      if ('version' in originalVersionResponse) {
        originalEnabled = originalVersionResponse.version.enabled;
      } else {
        fail('Expected app version but got Error');
        return;
      }

      await waitBetweenRequests();

      const response = await apiClient.appVersion.toggleAppVersion(versionIdentity);

      if ('identity' in response) {
        expect(response).toHaveProperty('identity', versionIdentity);
        expect(response.enabled).toBe(!originalEnabled);
      } else {
        fail('Expected updated app version but got Error');
      }

      await waitBetweenRequests();
    });
  });
});
