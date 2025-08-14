import type { Express } from 'express';

import { env } from '../../../env';
import { requireVincentAuth, withVincentAuth } from '../vincentAuth';

const { LIT_RELAYER_API_KEY, LIT_PAYER_SECRET_KEY } = env;

export function registerRoutes(app: Express) {
  // Register delegatee addresses in the payment DB contract via the relayer
  // so that the app dev doesn't have to think about RLI NFTs
  app.post(
    '/paymentDB/addDelegatees',
    requireVincentAuth,
    withVincentAuth(async (req, res) => {
      const { delegateeAddresses } = req.body;
      // hit the relayer server to add the delegatee addresses
      const headers = {
        'api-key': LIT_RELAYER_API_KEY,
        'payer-secret-key': LIT_PAYER_SECRET_KEY,
        'Content-Type': 'application/json',
      };

      const response = await fetch('https://datil-relayer.getlit.dev/add-users', {
        method: 'POST',
        headers,
        body: JSON.stringify(delegateeAddresses),
      });

      console.debug('Relayer addUsers response', response);

      res.json({ success: true });
      return;
    }),
  );
}
