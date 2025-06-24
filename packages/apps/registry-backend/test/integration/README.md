# Integration Tests with In-Memory MongoDB

This directory contains integration tests for the registry-backend API. The tests use an in-memory MongoDB server to avoid the need for a real MongoDB instance during testing.

## Setup

The tests are configured to:

1. Start an in-memory MongoDB server before running the tests
2. Start the API server with the in-memory MongoDB connection
3. Run the tests against the API server
4. Stop the API server and in-memory MongoDB server after the tests

## Running the Tests

To run the integration tests:

```bash
pnpm nx test registry-backend
```

## CI Configuration

The tests automatically use the in-memory MongoDB server, so no additional MongoDB setup is required in CI.

## How It Works

- `mongodb-memory-server.ts`: Manages the in-memory MongoDB server
- `global-setup.ts`: Starts the in-memory MongoDB server and API server
- `global-teardown.ts`: Stops the in-memory MongoDB server and API server
- `setup.ts`: Configures the OpenAPI-generated RTK client from `registry-sdk` that is used to integration test the API server

The in-memory MongoDB server is configured in `global-setup.ts` by setting the `MONGODB_URI` and `MONGO_DB_NAME` environment variables for the API server process.
