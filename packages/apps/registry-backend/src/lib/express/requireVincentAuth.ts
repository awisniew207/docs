import { Request, Response, NextFunction } from 'express';
import { SiweMessage } from 'siwe';
import { env } from '../../env';

// Create a specific interface for requests with authenticated user
export interface RequestWithVincentUser extends Request {
  vincentUser: {
    address: string;
  };
}

/**
 * Middleware to authenticate requests using SIWE (Sign In With Ethereum)
 * It verifies the Authorization header, which should contain a base64-encoded SIWE message and signature
 * If valid, it adds the wallet address to req.vincentUser
 */
export const requireVincentAuth = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      // If no Authorization header is present, return 401
      if (!authHeader) {
        res.status(401).json({
          message: 'Authentication required',
          error: 'No Authorization header provided',
        });
        return;
      }

      // Check if the Authorization header starts with "SIWE "
      if (!authHeader.startsWith('SIWE ')) {
        res.status(401).json({
          message: 'Invalid authentication scheme',
          error: 'Authorization header must use the SIWE scheme',
        });
        return;
      }

      // Extract the base64-encoded payload
      const base64Payload = authHeader.substring(5); // Remove "SIWE " prefix

      // Decode the base64 payload
      let payload: string;
      try {
        payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
      } catch (error) {
        res.status(401).json({
          message: 'Invalid authentication token',
          error: 'Failed to decode base64 payload',
        });
        return;
      }

      // Split the payload into message and signature
      const { message, signature } = JSON.parse(payload);

      if (!message || !signature) {
        res.status(401).json({
          message: 'Invalid authentication token',
          error: 'Payload must contain both message and signature separated by a colon',
        });
        return;
      }

      // Parse and verify the SIWE message
      let siweMessage: SiweMessage;
      try {
        siweMessage = new SiweMessage(message);
      } catch (error) {
        res.status(401).json({
          message: 'Invalid SIWE message',
          error: (error as Error).message,
        });
        return;
      }

      // Verify that the domain matches the expected audience
      if (siweMessage.domain !== env.EXPECTED_AUDIENCE) {
        res.status(401).json({
          message: 'Invalid domain in SIWE message',
          error: `Expected domain to be ${env.EXPECTED_AUDIENCE}, got ${siweMessage.domain}`,
        });
        return;
      }

      // Verify the signature
      const verificationResult = await siweMessage.verify({
        signature,
        domain: env.EXPECTED_AUDIENCE,
      });

      if (!verificationResult.success) {
        const expected = verificationResult.error?.expected || '';
        const received = verificationResult.error?.received || '';
        res.status(401).json({
          message: `SIWE verification failed.${expected ? ' Expected: ' + expected : ''} ${received ? ', Received: ' + received : ''}`,
          error: verificationResult.error?.type || 'Signature verification failed',
        });
        return;
      }

      // Add the wallet address to the request object
      (req as RequestWithVincentUser).vincentUser = {
        address: siweMessage.address,
      };

      // Continue to the next middleware or route handler
      next();
    } catch (error) {
      console.error('SIWE authentication error:', error);
      res.status(500).json({
        message: 'Authentication error',
        error: (error as Error).message,
      });
      return;
    }
  };
};

// Type-safe handler wrapper
export type VincentAuthHandler<T extends Request = RequestWithVincentUser> = (
  req: T & RequestWithVincentUser,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withVincentAuth = <T extends Request = Request>(handler: VincentAuthHandler<T>) => {
  return (req: T, res: Response, next: NextFunction) => {
    return handler(req as T & RequestWithVincentUser, res, next);
  };
};
