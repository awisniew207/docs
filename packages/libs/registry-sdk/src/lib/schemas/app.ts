import { z } from './openApiZod';

import { EXAMPLE_EMAIL_ADDRESS, EXAMPLE_WALLET_ADDRESS } from '../constants';
import { baseDocAttributes } from './base';

/** app describes all properties on an application that are NOT controlled by the DB backend
 *
 * Any schemas that use subsets of appVersion properties should be composed from this using builder functions
 * instead of `appDef`, which also includes MongoDB-maintained props and is the complete API response
 * */
export const app = z
  .object({
    appId: z.number().openapi({
      description: 'Application ID',
      example: 12345,
      readOnly: true,
    }),
    // Optional because a new app without any appVersion defined yet will have no activeVersion
    activeVersion: z
      .number()
      .optional()
      .openapi({
        description: 'Active version of the application',
        example: 1,
      })
      .optional(),
    name: z.string().openapi({
      description: 'The name of the application',
      example: 'Memecoin DCA App',
    }),
    description: z.string().optional().openapi({
      description: 'Description of the application',
      example: 'This is a memecoin DCA App.',
    }),
    contactEmail: z
      .string()
      .email()
      .openapi({
        description: 'Contact email for the application manager',
        example: EXAMPLE_EMAIL_ADDRESS,
      })
      .optional(),
    appUserUrl: z
      .string()
      .url()
      .openapi({
        description: 'This should be a landing page for the app.',
        example: 'https://myapplication.example.com/',
      })
      .optional(),
    logo: z
      .string()
      .optional()
      .openapi({
        description: 'Base64 encoded logo image',
        example:
          'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOvwAADr8BOAVTJAAAAA5JREFUGFdj/M+ACAAAAAD//wE7AnsAAAAAAElFTkSuQmCC',
      })
      .optional(),
    redirectUris: z
      .array(z.string().url())
      .openapi({
        description:
          'Redirect URIs users can be sent to after signing up for your application (with their JWT token).',
        example: ['https://myapp.example.com', 'https://myapp.example.com/subpage'],
      })
      .optional(),
    deploymentStatus: z.enum(['dev', 'test', 'prod']).optional().default('dev').openapi({
      description: 'Identifies if an application is in development, test, or production.',
      example: 'dev',
      default: 'dev',
    }),
    managerAddress: z.string().openapi({
      description: `App manager's wallet address. Derived from the authorization signature provided by the creator.`,
      example: EXAMPLE_WALLET_ADDRESS,
      readOnly: true,
    }),
  })
  .strict();

// Avoiding using z.omit() or z.pick() due to excessive TS type inference costs
function buildCreateAppSchema() {
  const { name, description } = app.shape;
  return z.object({ name, description }).strict();
}

/**
 * New apps must have a name and description; everything else can be defined later
 * - managerAddress is derived from the authorization signature provided by the creator
 */
export const createApp = buildCreateAppSchema();

function buildEditAppSchema() {
  // Avoiding using z.omit() or z.pick() due to excessive TS type inference costs
  const {
    appId,
    contactEmail,
    activeVersion,
    redirectUris,
    name,
    description,
    deploymentStatus,
    logo,
    appUserUrl,
  } = app.shape;

  return z
    .object({
      // Optional
      ...z
        .object({
          contactEmail,
          appUserUrl,
          logo,
          redirectUris,
          deploymentStatus,
          activeVersion,
        })
        .partial()
        .strict().shape,

      // Required
      appId: appId,
      name: name,
      description: description,
    })
    .strict();
}

/**
 * Editing an existing app can contain any combination of the optional parameters, but must include
 * the base props that are used during app creation.
 */
export const editApp = buildEditAppSchema();

/** appDef describes a complete application document, with all properties including those that are database-backend
 * specific like _id and updated/created at timestamps.
 *
 * Do not duplicate these definitions into other schemas like `edit` or `create`.
 *
 * All schemas that need to be composed as subsets of this schema
 * should be derived from `app` instead
 */
export const appDef = z.object({ ...baseDocAttributes.shape, ...app.shape }).strict();
