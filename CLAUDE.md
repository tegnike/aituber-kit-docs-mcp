# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server for AITuberKit documentation that runs on Cloudflare Workers. It enables AI models to search and retrieve AITuberKit documentation through a standardized HTTP interface.

## Development Commands

```bash
# Start development server
npm run dev

# Deploy to Cloudflare Workers
npm run deploy

# Generate Cloudflare types
npm run cf-typegen
```

## Architecture

### Request Flow
1. **HTTP Entry** (`src/index.ts`): Routes requests to either `/sse` (Server-Sent Events) or `/mcp` (standard HTTP) endpoints
2. **MCP Agent** (`src/aituberKitMcp.ts`): Core MCP implementation that:
   - Extends the `McpAgent` base class from the `agents` library
   - Implements the `search_aituberkit_docs` tool
   - Uses OpenAI API to find relevant documentation
   - Returns results in MCP protocol format

### Key Implementation Details
- Uses Cloudflare Durable Objects for stateful connections
- TypeScript with strict type checking
- Zod schemas for runtime validation
- Documentation content is built at compile time and imported as a module
- Environment bindings defined in `worker-configuration.d.ts`

## Documentation Search
The `search_aituberkit_docs` tool:
- Accepts natural language queries
- Uses OpenAI to select up to 3 most relevant documents
- Returns the combined content of selected documents