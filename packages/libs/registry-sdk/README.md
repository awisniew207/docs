# Vincent Registry API

This package contains the Vincent Registry API. It includes API definitions using Zod with OpenAPI extensions, and generated TypeScript clients for both NodeJS and React frontends, using RTK Query.

## Getting Started

Import the appropriate client for your environment, and call its `setBaseQueryFn()` function to configure your query function. See the [RTK Docs](https://redux-toolkit.js.org/rtk-query/api/fetchBaseQuery) for example usage.

#### React Client

```typescript
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { reactClient } from '@lit-protocol/vincent-registry-sdk';

const { vincentApiClientReact, setBaseQueryFn } = reactClient;

setBaseQueryFn(fetchBaseQuery({ baseUrl: `https://registry.heyvincent.ai` }));
// Use the API client per https://redux-toolkit.js.org/rtk-query/api/created-api/hooks
```

#### NodeJS Client

```typescript
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { nodeClient } from '@lit-protocol/vincent-registry-sdk';

const { vincentApiClientNode, setBaseQueryFn } = nodeClient;

setBaseQueryFn(fetchBaseQuery({ baseUrl: `http://localhost:3000` }));
// Use the API Client per https://redux-toolkit.js.org/rtk-query/usage/usage-without-react-hooks
```

### OpenAPI JSON Spec

The OpenAPI spec in JSON format is exported as `openApiJson`; you can import it if your JS environment supports parsing JSON, or read it directly from `dist/src/generated/openapi.json` in the package filesystem.

## Technologies

- [Zod](https://github.com/colinhacks/zod) - Schema validation
- [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi) - Convert Zod schemas to OpenAPI
- [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) - API client generation

## Development

Both generated clients _and_ the OpenAPI JSON file are re-generated every time you run `pnpm nx build`.
