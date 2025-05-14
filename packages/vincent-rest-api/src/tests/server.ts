import express, { Request, Response } from 'express';
import {
  CreateAppDef,
  AppDef,
  AppVersionDef,
  CreateAppVersionDef,
  AppVersionWithToolsDef,
  AppToolDef,
  VersionChanges,
} from '../api/api';

const app = express();
const PORT = 3000;

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

app.use(express.json());

const apps: AppDef[] = [];
const appVersions: AppVersionDef[] = [];
const appTools: AppToolDef[] = [];
let nextAppId = 1;

// POST /app endpoint
app.post('/app', (req: Request, res: Response) => {
  try {
    const createAppData = req.body;

    const validationResult = CreateAppDef.safeParse(createAppData);

    if (!validationResult.success) {
      return res.status(422).json(
        validationResult.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      );
    }

    // Create app with generated fields
    const newApp: AppDef = {
      ...validationResult.data,
      identity: `AppDef|${nextAppId}`,
      appId: nextAppId,
      lastUpdated: new Date().toISOString(),
      activeVersion: validationResult.data.activeVersion || 1,
    };

    apps.push(newApp);
    nextAppId++;

    res.status(200).json(newApp);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: errorMessage,
    });
  }
});

// GET /app/{identity} endpoint
app.get('/app/:identity', (req: Request, res: Response) => {
  try {
    const { identity } = req.params;
    const app = apps.find((a) => a.identity === identity);

    if (!app) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Application not found',
      });
    }

    res.status(200).json(app);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: errorMessage,
    });
  }
});

// PUT /app/{identity} endpoint
app.put('/app/:identity', (req: Request, res: Response) => {
  try {
    const { identity } = req.params;
    const updateData = req.body;

    const validationResult = CreateAppDef.safeParse(updateData);

    if (!validationResult.success) {
      return res.status(422).json(
        validationResult.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      );
    }

    const appIndex = apps.findIndex((a) => a.identity === identity);

    if (appIndex === -1) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Application not found',
      });
    }

    const updatedApp: AppDef = {
      ...apps[appIndex],
      ...validationResult.data,
      lastUpdated: new Date().toISOString(),
    };

    apps[appIndex] = updatedApp;

    res.status(200).json(updatedApp);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: errorMessage,
    });
  }
});

// GET /app/{identity}/versions endpoint
app.get('/app/:identity/versions', (req: Request, res: Response) => {
  try {
    const { identity } = req.params;
    const app = apps.find((a) => a.identity === identity);

    if (!app) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Application not found',
      });
    }

    const versions = appVersions.filter((v) => v.appId === app.appId);
    res.status(200).json(versions);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: errorMessage,
    });
  }
});

// POST /app/version/{identity} endpoint
app.post('/app/version/:identity', (req: Request, res: Response) => {
  try {
    const { identity } = req.params;
    const versionData = req.body;

    const validationResult = CreateAppVersionDef.safeParse(versionData);

    if (!validationResult.success) {
      return res.status(422).json(
        validationResult.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      );
    }

    const app = apps.find((a) => a.identity === identity);

    if (!app) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Application not found',
      });
    }

    const existingVersions = appVersions.filter((v) => v.appId === app.appId);
    const nextVersionNumber =
      existingVersions.length > 0
        ? Math.max(...existingVersions.map((v) => v.versionNumber)) + 1
        : 1;

    const newVersion: AppVersionDef = {
      appId: app.appId,
      versionNumber: nextVersionNumber,
      identity: `AppVersionDef|${app.appId}@${nextVersionNumber}`,
      enabled: true,
      changes: validationResult.data.changes,
    };

    appVersions.push(newVersion);

    for (const toolIdentity of validationResult.data.tools) {
      const newTool: AppToolDef = {
        appId: app.appId,
        appVersionNumber: nextVersionNumber,
        toolPackageName: toolIdentity.split('@')[0],
        toolVersion: toolIdentity.split('@')[1],
        toolIdentity: toolIdentity,
        identity: `AppToolDef|AppDef|${app.appId}/${toolIdentity}`,
      };
      appTools.push(newTool);
    }

    res.status(200).json(newVersion);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: errorMessage,
    });
  }
});

// GET /app/version/{identity} endpoint
app.get('/app/version/:identity', (req: Request, res: Response) => {
  try {
    const { identity } = req.params;
    const version = appVersions.find((v) => v.identity === identity);

    if (!version) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Application version not found',
      });
    }

    const tools = appTools.filter(
      (t) => t.appId === version.appId && t.appVersionNumber === version.versionNumber,
    );

    const response: AppVersionWithToolsDef = {
      version,
      tools,
    };

    res.status(200).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: errorMessage,
    });
  }
});

// PUT /app/version/{identity} endpoint
app.put('/app/version/:identity', (req: Request, res: Response) => {
  try {
    const { identity } = req.params;
    const updateData = req.body;

    const validationResult = VersionChanges.safeParse(updateData);

    if (!validationResult.success) {
      return res.status(422).json(
        validationResult.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      );
    }

    const versionIndex = appVersions.findIndex((v) => v.identity === identity);

    if (versionIndex === -1) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Application version not found',
      });
    }

    appVersions[versionIndex] = {
      ...appVersions[versionIndex],
      changes: validationResult.data.changes,
    };

    res.status(200).json(appVersions[versionIndex]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: errorMessage,
    });
  }
});

// POST /app/version/{identity}/toggle endpoint
app.post('/app/version/:identity/toggle', (req: Request, res: Response) => {
  try {
    const { identity } = req.params;

    const versionIndex = appVersions.findIndex((v) => v.identity === identity);

    if (versionIndex === -1) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Application version not found',
      });
    }

    appVersions[versionIndex] = {
      ...appVersions[versionIndex],
      enabled: !appVersions[versionIndex].enabled,
    };

    res.status(200).json(appVersions[versionIndex]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: errorMessage,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
