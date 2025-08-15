import { expectAssertObject } from '../assertions';
import { createTestDebugger } from '../debug';
import { api, store, defaultWallet, generateJWT } from './setup';

const debug = createTestDebugger('paymentDB');

const verboseLog = (value: any) => {
  debug(value);
};

describe('PaymentDB API Integration Tests', () => {
  beforeAll(async () => {
    verboseLog('PaymentDB API Integration Tests');
  });

  describe('POST /paymentDB/addDelegatees', () => {
    it('should add delegatee addresses to the payment DB', async () => {
      const delegateeAddresses = ['0x058f76DF266E7ef79791261BA21C99D98F125564'];

      const jwt = await generateJWT(defaultWallet);

      const response = await fetch(
        `http://localhost:${process.env.PORT || 3000}/paymentDB/addDelegatees`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({ delegateeAddresses }),
        },
      );

      const result = await response.json();

      verboseLog(result);

      expect(response.status).toBe(200);
      expect(result).toHaveProperty('success', true);
    });

    it('should fail without proper authentication', async () => {
      const delegateeAddresses = ['0x058f76DF266E7ef79791261BA21C99D98F125564'];

      const response = await fetch(
        `http://localhost:${process.env.PORT || 3000}/paymentDB/addDelegatees`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ delegateeAddresses }),
        },
      );

      expect(response.status).toBe(401);
    });

    it('should handle empty delegatee addresses array', async () => {
      const delegateeAddresses: string[] = [];

      const jwt = await generateJWT(defaultWallet);

      const response = await fetch(
        `http://localhost:${process.env.PORT || 3000}/paymentDB/addDelegatees`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({ delegateeAddresses }),
        },
      );

      const result = await response.json();

      verboseLog(result);

      expect(response.status).toBe(200);
      expect(result).toHaveProperty('success', true);
    });

    it('should handle multiple delegatee addresses', async () => {
      const delegateeAddresses = [
        '0x058f76DF266E7ef79791261BA21C99D98F125564',
        '0x1234567890abcdef1234567890abcdef12345678',
        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      ];

      const jwt = await generateJWT(defaultWallet);

      const response = await fetch(
        `http://localhost:${process.env.PORT || 3000}/paymentDB/addDelegatees`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({ delegateeAddresses }),
        },
      );

      const result = await response.json();

      verboseLog(result);

      expect(response.status).toBe(200);
      expect(result).toHaveProperty('success', true);
    });
  });
});
