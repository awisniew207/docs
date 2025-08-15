import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import { z } from '../schemas/openApiZod';
import { ErrorResponse, GenericResult, jwtAuth } from './baseRegistry';

export function addToRegistry(registry: OpenAPIRegistry) {
  const AddDelegateesToPaymentDB = registry.register(
    'AddDelegateesToPaymentDB',
    z.object({
      delegateeAddresses: z.array(z.string()),
    }),
  );
  // POST /paymentDB/addDelegatees - Add delegatee addresses to the payment DB contract via the relayer
  registry.registerPath({
    method: 'post',
    path: '/paymentDB/addDelegatees',
    tags: ['PaymentDB'],
    summary: 'Add delegatee addresses to the payment DB contract via the relayer',
    operationId: 'addDelegateesToPaymentDB',
    security: [{ [jwtAuth.name]: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: AddDelegateesToPaymentDB,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'OK - Delegatee addresses added to the payment DB contract via the relayer',
        content: {
          'application/json': {
            schema: GenericResult,
          },
        },
      },
      default: {
        description: 'Unexpected error',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  });
}
