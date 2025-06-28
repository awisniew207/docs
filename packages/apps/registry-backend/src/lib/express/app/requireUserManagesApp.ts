import { Request, Response, NextFunction } from 'express';
import { RequestWithApp } from './requireApp';
import { RequestWithVincentUser } from '../requireVincentAuth';

// Combined interface for requests with both app and vincent user
export interface RequestWithAppAndVincentUser extends RequestWithApp, RequestWithVincentUser {}

/**
 * Middleware to check if the authenticated user is the manager of the app
 * It verifies that req.vincentUser.address matches req.vincentApp.managerAddress
 * This middleware should be used after requireApp and requireVincentAuth
 */
export const requireUserManagesApp = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqWithAppAndUser = req as RequestWithAppAndVincentUser;

      // Ensure app and authentication middleware ran first
      if (!reqWithAppAndUser.vincentApp) {
        res.status(500).json({
          error: 'App middleware must run before requireUserManagesApp middleware',
        });
        return;
      }

      if (!reqWithAppAndUser.vincentUser) {
        res.status(500).json({
          error: 'Authentication middleware must run before requireUserManagesApp middleware',
        });
        return;
      }

      // Check if the authenticated user is the manager of the app
      if (reqWithAppAndUser.vincentUser.address !== reqWithAppAndUser.vincentApp.managerAddress) {
        res.status(403).json({
          message: 'Forbidden',
          error: 'You are not authorized to manage this app',
        });
        return;
      }

      // Continue to the next middleware or route handler
      next();
    } catch (error) {
      console.error('Error in requireUserManagesApp middleware:', error);
      res.status(500).json({
        message: 'Server error',
        error: (error as Error).message,
      });
      return;
    }
  };
};
