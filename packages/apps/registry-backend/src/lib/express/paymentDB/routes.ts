import type { Express } from 'express';

import { createDebugger } from '../../../../debug';
import { env } from '../../../env';
import { requireVincentAuth, withVincentAuth } from '../vincentAuth';

const { LIT_RELAYER_API_KEY, LIT_PAYER_SECRET_KEY } = env;

const pmtDebug = createDebugger('paymentDB');

export function registerRoutes(app: Express) {
  // Register delegatee addresses in the payment DB contract via the relayer
  // so that the app dev doesn't have to think about RLI NFTs
  app.post(
    '/paymentDB/addDelegatees',
    requireVincentAuth,
    withVincentAuth(async (req, res) => {
      const { delegateeAddresses } = req.body;

      const response = await fetch('https://datil-relayer.getlit.dev/add-users', {
        method: 'POST',
        headers: {
          'api-key': LIT_RELAYER_API_KEY,
          'payer-secret-key': LIT_PAYER_SECRET_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(delegateeAddresses),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Failed to add delegatees as payees -- status: ${response.status} - ${text}`,
        );
      }

      pmtDebug('Relayer addUsers response', response);

      res.json({ success: true });
      return;
    }),
  );
}
