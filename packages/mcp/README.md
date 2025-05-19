# Vincent MCP Server

This package contains a Vincent App Server that can be used to serve Vincent Apps over the MCP protocol.

It leverages the `mcp` utils in `@lit-protocol/vincent-sdk` to build a server from a Vincent App definition and then exposing it over the STDIO or HTTP transport.

## Setup

- Copy `vincent-app.example.json` to `vincent-app.json` or any other name you want and configure your Vincent App definition in it.
- Copy `.env.example` to `.env` and fill in the values. Use absolute paths for the `VINCENT_APP_JSON_DEFINITION` value.

# Running

## STUDIO mode

- Build the package: `pnpm build`
- Add a config in your LLM client MCP config file to run the following command to run the server: `node /<ABSOLUTE_PATH_TO_VINCENT_MCP>/bin/stdio.js`.

# Local Development Configuration

## STDIO mode

When integrating with LLM tools or frameworks, you can configure the Vincent MCP server as a local development option. Here's an example configuration:

```json
{
    "mcpServers": {
        "uniswapSwap": {
          "command": "npx",
          "args": [
            "-y",
            "tsx",
            "--env-file=/<ABSOLUTE_PATH_TO_VINCENT_MCP>/vincent-mcp/.env",
            "/<ABSOLUTE_PATH_TO_VINCENT_MCP>/vincent-mcp/src/stdio.ts"
          ]
        }
    }
}
```

This configuration launches the Vincent MCP server in STDIO mode using the `tsx` runtime with a specified environment file. You have to adjust the paths to match your local development environment.

## HTTP mode

- Run `pnpm dev:http` to start the server in HTTP mode.
- The server will be available at `http://localhost:3000/mcp` (or the port you specified in the `.env` file)
- Connect your LLM client to `http://localhost:3000/mcp` to connect to the server.
