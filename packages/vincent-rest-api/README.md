# Vincent Registry API

This package contains a mock implementation and tests for the Vincent Registry API. It includes API definitions using Zod and OpenAPI, a generated TypeScript client, and integration tests.

## Getting Started

### Generate API Client

To generate the OpenAPI specification and TypeScript client:

```bash
pnpm generate-api
```

This command:
1. Converts Zod schemas from `src/api/api.ts` to an OpenAPI specification
2. Generates the OpenAPI YAML file in `src/api/generated-openapi.yaml`
3. Creates a TypeScript client in the `src/common/api` directory

### Running Tests

To run the integration tests:

```bash
pnpm test
```

This command:
1. Starts the mock API server on port 3000
2. Runs integration tests against the server
3. Automatically cleans up the server process after tests complete

## Test Structure

The integration tests (`src/tests/integration.test.ts`) verify that the API works correctly by:

1. Creating application records
2. Retrieving and validating application data
3. Creating and managing application versions
4. Testing validation for incorrect inputs
5. Testing toggling functionality for application versions

All tests use the auto-generated TypeScript client to interact with the API, ensuring type safety and proper endpoint usage.

## API Structure

The API is defined using Zod schemas with OpenAPI extensions in `src/api/api.ts`. These schemas are used to:
- Validate API requests and responses
- Generate OpenAPI documentation
- Generate TypeScript client code
- Provide type safety throughout the application

## Directory Structure

```
vincent-rest-api/
├── scripts/            # Shell scripts for running tests
├── src/                # Source code
│   ├── api/            # API definitions and OpenAPI schema
│   │   ├── api.ts      # Zod schema definitions and OpenAPI path registration
│   │   └── generated-openapi.yaml # Generated OpenAPI specification
│   ├── common/         # Generated API client code
│   ├── server/         # Mock server implementation
│   ├── tests/          # Integration tests
│   └── utils/          # Utility scripts for generating API
├── project.json        # NX project configuration
└── package.json        # Project dependencies and scripts
``` 