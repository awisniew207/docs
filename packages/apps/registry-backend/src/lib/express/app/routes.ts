import { App, AppTool, AppVersion } from '../../mongo/app';

import type { Express } from 'express';
import { requireApp, withApp } from './requireApp';
import { requireAppVersion, withAppVersion } from './requireAppVersion';
import { withSession } from '../../mongo/withSession';
import { Features } from '../../../features';

const NEW_APP_APPVERSION = 1;
const MAX_APPID_RETRY_ATTEMPTS = 20;

function generateRandomAppId(): number {
  return Math.floor(Math.random() * (100_000_000 - 1000)) + 1000;
}

export function registerRoutes(app: Express) {
  // List all apps
  app.get('/apps', async (req, res) => {
    const apps = await App.find().lean();

    res.json(apps);
  });

  // Get a single app by its app ID
  app.get(
    '/app/:appId',
    requireApp(),
    withApp(async (req, res) => {
      const { vincentApp } = req;
      res.json(vincentApp);
      return;
    }),
  );

  // Create new App
  app.post('/app', async (req, res) => {
    await withSession(async (mongoSession) => {
      const {
        name,
        deploymentStatus,
        description,
        contactEmail,
        appUserUrl,
        logo,
        redirectUris,
        managerAddress,
      } = req.body;

      const triedAppIds = new Set<number>();
      let appId: number;
      let appDef;
      let success = false;
      let attempts = 0;

      while (!success && attempts < MAX_APPID_RETRY_ATTEMPTS) {
        attempts++;

        // Generate a new appId that we haven't tried yet
        do {
          appId = generateRandomAppId();
        } while (triedAppIds.has(appId));

        triedAppIds.add(appId);

        const appVersion = new AppVersion({
          appId,
          version: NEW_APP_APPVERSION,
          changes: 'Initial version',
          enabled: true,
        });

        const appDoc = new App({
          activeVersion: NEW_APP_APPVERSION,
          appId,
          name,
          description,
          contactEmail,
          appUserUrl,
          logo,
          redirectUris,
          deploymentStatus,
          managerAddress,
        });

        try {
          await mongoSession.withTransaction(async (session) => {
            await appVersion.save({ session });
            appDef = await appDoc.save({ session });
          });
          success = true;
        } catch (error: any) {
          // Check if the error is due to duplicate appId
          if (error.code === 11000 && error.keyPattern && error.keyPattern.appId) {
            // This is a duplicate key error for appId, try again with a new appId
            continue;
          } else {
            // This is some other error, re-throw it
            throw error;
          }
        }
      }

      if (!success) {
        res.status(500).json({
          error: 'Failed to generate unique appId after maximum attempts',
          attempts: MAX_APPID_RETRY_ATTEMPTS,
        });
        return;
      }

      res.status(201).json(appDef);
      return;
    });
  });

  // Edit App
  app.put(
    '/app/:appId',
    requireApp(),
    withApp(async (req, res) => {
      Object.assign(req.vincentApp, req.body);
      const updatedApp = await req.vincentApp.save();

      res.json(updatedApp);
      return;
    }),
  );

  // Change App Owner
  app.post(
    '/app/:appId/owner',
    requireApp(),
    withApp(async (req, res) => {
      const updatedApp = await req.vincentApp
        .updateOne({ managerAddress: req.body.managerAddress }, { new: true })
        .lean();

      res.json(updatedApp);
      return;
    }),
  );

  // Create new App Version
  app.post(
    '/app/:appId/version',
    requireApp(),
    withApp(async (req, res) => {
      const { appId } = req.params;
      await withSession(async (mongoSession) => {
        let savedAppVersion;

        await mongoSession.withTransaction(async (session) => {
          const highest = await AppVersion.find({ appId })
            .session(session)
            .sort({ version: -1 })
            .limit(1)
            .lean();

          console.log('highest', highest);

          const appVersion = new AppVersion({
            appId,
            version: highest.length ? highest[0].version + 1 : 1,
            changes: req.body.changes,
            enabled: true,
          });

          savedAppVersion = await appVersion.save({ session });
        });

        res.status(201).json(savedAppVersion);
        return;
      });
    }),
  );

  // List App Versions
  app.get(
    '/app/:appId/versions',
    requireApp(),
    withApp(async (req, res) => {
      const { appId } = req.params;

      const versions = await AppVersion.find({ appId: appId }).sort({ version: 1 }).lean();
      res.json(versions);
      return;
    }),
  );

  // Get App Version with its AppTools
  app.get(
    '/app/:appId/version/:version',
    requireApp(),
    requireAppVersion(),
    withAppVersion(async (req, res) => {
      const { vincentAppVersion } = req;

      res.json(vincentAppVersion);
      return;
    }),
  );

  // Edit App Version
  app.put(
    '/app/:appId/version/:version',
    requireApp(),
    requireAppVersion(),
    withAppVersion(async (req, res) => {
      const { vincentAppVersion } = req;

      Object.assign(vincentAppVersion, req.body);

      const version = await vincentAppVersion.save();
      res.json(version);
      return;
    }),
  );

  // Disable app version
  app.post(
    '/app/:appId/version/:version/disable',
    requireApp(),
    requireAppVersion(),
    withAppVersion(async (req, res) => {
      const { vincentAppVersion } = req;

      Object.assign(vincentAppVersion, { enabled: false });
      const updatedAppVersion = await vincentAppVersion.save();

      res.json(updatedAppVersion);
      return;
    }),
  );

  // Enable app version
  app.post(
    '/app/:appId/version/:version/enable',
    requireApp(),
    requireAppVersion(),
    withAppVersion(async (req, res) => {
      const { vincentAppVersion } = req;

      Object.assign(vincentAppVersion, { enabled: true });
      const updatedAppVersion = await vincentAppVersion.save();

      res.json(updatedAppVersion);
      return;
    }),
  );

  // Delete an app, along with all of its appVersions and their tools.
  app.delete('/app/:appId', async (req, res) => {
    await withSession(async (mongoSession) => {
      const { appId } = req.params;

      await mongoSession.withTransaction(async (session) => {
        if (Features.HARD_DELETE_DOCS) {
          await App.findOneAndDelete({ appId }).session(session);
          await AppVersion.deleteMany({ appId }).session(session);
          await AppTool.deleteMany({ appId }).session(session);
        } else {
          await App.updateMany({ appId }, { isDeleted: true }).session(session);
          await AppVersion.updateMany({ appId }, { isDeleted: true }).session(session);
          await AppTool.updateMany({ appId }, { isDeleted: true }).session(session);
        }
      });

      res.json({ message: 'App and associated data deleted successfully' });
      return;
    });
  });
}
