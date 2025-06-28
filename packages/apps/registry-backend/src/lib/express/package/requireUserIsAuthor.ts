import { Request, Response, NextFunction } from 'express';
import { RequestWithTool } from '../tool/requireTool';
import { RequestWithPolicy } from '../policy/requirePolicy';
import { RequestWithVincentUser } from '../requireVincentAuth';

// Combined interfaces for requests with both entity and vincent user
export interface RequestWithToolAndVincentUser extends RequestWithTool, RequestWithVincentUser {}
export interface RequestWithPolicyAndVincentUser
  extends RequestWithPolicy,
    RequestWithVincentUser {}

type EntityType = 'tool' | 'policy';

/**
 * Middleware to check if the authenticated user is the author of the entity (tool or policy)
 * It verifies that req.vincentUser.address matches the authorWalletAddress on the entity
 * This middleware should be used after requireTool/requirePolicy and requireVincentAuth
 *
 * @param entityType - The type of entity to check ('tool' or 'policy')
 */
export const requireUserIsAuthor = (entityType: EntityType) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure authentication middleware ran first
      if (!(req as RequestWithVincentUser).vincentUser) {
        res.status(500).json({
          error: 'Authentication middleware must run before requireUserIsAuthor middleware',
        });
        return;
      }

      const userAddress = (req as RequestWithVincentUser).vincentUser.address;

      if (entityType === 'tool') {
        const reqWithTool = req as RequestWithToolAndVincentUser;

        // Ensure tool middleware ran first
        if (!reqWithTool.vincentTool) {
          res.status(500).json({
            error: 'Tool middleware must run before requireUserIsAuthor middleware',
          });
          return;
        }

        // Check if the authenticated user is the author of the tool
        if (userAddress !== reqWithTool.vincentTool.authorWalletAddress) {
          res.status(403).json({
            message: 'Forbidden',
            error: 'You are not authorized to modify this tool',
          });
          return;
        }
      } else if (entityType === 'policy') {
        const reqWithPolicy = req as RequestWithPolicyAndVincentUser;

        // Ensure policy middleware ran first
        if (!reqWithPolicy.vincentPolicy) {
          res.status(500).json({
            error: 'Policy middleware must run before requireUserIsAuthor middleware',
          });
          return;
        }

        // Check if the authenticated user is the author of the policy
        if (userAddress !== reqWithPolicy.vincentPolicy.authorWalletAddress) {
          res.status(403).json({
            message: 'Forbidden',
            error: 'You are not authorized to modify this policy',
          });
          return;
        }
      } else {
        res.status(500).json({
          error: `Invalid entity type: ${entityType}. Must be 'tool' or 'policy'`,
        });
        return;
      }

      // Continue to the next middleware or route handler
      next();
    } catch (error) {
      console.error(`Error in requireUserIsAuthor middleware for ${entityType}:`, error);
      res.status(500).json({
        message: 'Server error',
        error: (error as Error).message,
      });
      return;
    }
  };
};
