import { Request, Response, NextFunction } from 'express';
import { Tool } from '../../mongo/tool';
import { RequestWithVincentUser } from '../requireVincentAuth';

// Create a specific interface for requests with tool
export interface RequestWithTool extends Request {
  vincentTool: InstanceType<typeof Tool>;
}

// Combined interface for requests with both tool and vincent user
export interface RequestWithToolAndVincentUser extends RequestWithTool, RequestWithVincentUser {}

// Type guard function
export const requireTool = (paramName = 'packageName') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const packageName = req.params[paramName];

    try {
      const tool = await Tool.findOne({ packageName });

      if (!tool) {
        res.status(404).end();
        return;
      }

      (req as RequestWithTool).vincentTool = tool;
      next();
    } catch (error) {
      res
        .status(500)
        .json({ message: `Error fetching tool ${packageName}`, error: (error as Error).message });
      return;
    }
  };
};

// Type-safe handler wrapper
export type ToolHandler<T extends Request = RequestWithTool> = (
  req: T & RequestWithTool,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withTool = <T extends Request = Request>(handler: ToolHandler<T>) => {
  return (req: T, res: Response, next: NextFunction) => {
    return handler(req as T & RequestWithTool, res, next);
  };
};
