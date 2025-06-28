import { Request, Response, NextFunction } from 'express';
import { AppVersion } from '../../mongo/app';

import { RequestWithApp } from './requireApp';

export interface RequestWithAppAndVersion extends RequestWithApp {
  vincentAppVersion: InstanceType<typeof AppVersion>;
}

// Type guard function that expects vincentApp to already exist
export const requireAppVersion = (versionParam = 'version') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const reqWithApp = req as RequestWithApp;

    // FIXME: Return error 400 if appId or appVersion can't be parseInt'd
    // Ensure app middleware ran first
    if (!reqWithApp.vincentApp) {
      res.status(500).json({
        error: 'App middleware must run before AppVersion middleware',
      });
      return;
    }

    const version = req.params[versionParam];

    try {
      const appVersion = await AppVersion.findOne({
        appId: reqWithApp.vincentApp.appId,
        version: parseInt(version),
      });

      if (!appVersion) {
        res.status(404).end();
        return;
      }

      (req as RequestWithAppAndVersion).vincentAppVersion = appVersion;
      next();
    } catch (error) {
      res.status(500).json({
        message: `Error fetching version ${version} for app ${reqWithApp.vincentApp.appId}`,
        error,
      });
      return;
    }
  };
};

// Type-safe handler wrapper
export type AppVersionHandler<T extends Request = RequestWithAppAndVersion> = (
  req: T & RequestWithAppAndVersion,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withAppVersion = <T extends Request = Request>(handler: AppVersionHandler<T>) => {
  return (req: T, res: Response, next: NextFunction) => {
    return handler(req as T & RequestWithAppAndVersion, res, next);
  };
};
