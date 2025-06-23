import { z } from './openApiZod';

export const baseDocAttributes = z.object({
  _id: z.string().openapi({ description: 'Document ID', readOnly: true }),
  updatedAt: z.string().datetime().openapi({
    description: 'Timestamp when this was last modified',
  }),
  createdAt: z.string().datetime().openapi({ description: 'Timestamp when this was created' }),
});

// Error response
export const errorResult = z.object({
  code: z.string().optional().openapi({
    description: 'Error code',
    example: 'VALIDATION_ERROR',
  }),
  message: z.string().openapi({
    description: 'Error message',
    example: 'Invalid input provided',
  }),
});

// Response body for deleting an application
export const deleteResult = z.object({
  message: z.string().openapi({
    description: 'Success message',
    example: 'Application successfully deleted',
  }),
});
