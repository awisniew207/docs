import { Request, Response, NextFunction } from 'express';
import { AppTool } from '../../mongo/app';

import { RequestWithAppAndVersion } from './requireAppVersion';

interface RequestWithAppVersionAndTool extends RequestWithAppAndVersion {
  vincentAppTool: InstanceType<typeof AppTool>;
}

// Type guard function that expects vincentApp and vincentAppVersion to already exist
export const requireAppTool = (toolPackageNameParam = 'toolPackageName') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const reqWithAppVersion = req as RequestWithAppAndVersion;

    // Ensure app and appVersion middleware ran first
    if (!reqWithAppVersion.vincentApp) {
      res.status(500).json({
        error: 'App middleware must run before AppTool middleware',
      });
      return;
    }

    if (!reqWithAppVersion.vincentAppVersion) {
      res.status(500).json({
        error: 'AppVersion middleware must run before AppTool middleware',
      });
      return;
    }

    const toolPackageName = req.params[toolPackageNameParam];

    try {
      const appTool = await AppTool.findOne({
        appId: reqWithAppVersion.vincentApp.appId,
        appVersion: reqWithAppVersion.vincentAppVersion.version,
        toolPackageName,
        isDeleted: { $ne: true },
      });

      if (!appTool) {
        res.status(404).end();
        return;
      }

      (req as RequestWithAppVersionAndTool).vincentAppTool = appTool;
      next();
    } catch (error) {
      res.status(500).json({
        message: `Error fetching tool ${toolPackageName} for app ${reqWithAppVersion.vincentApp.appId} version ${reqWithAppVersion.vincentAppVersion.version}`,
        error,
      });
      return;
    }
  };
};

// Type-safe handler wrapper
export type AppToolHandler = (
  req: RequestWithAppVersionAndTool,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withAppTool = (handler: AppToolHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return handler(req as RequestWithAppVersionAndTool, res, next);
  };
};
