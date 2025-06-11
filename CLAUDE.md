# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server for Supabase that runs on Cloudflare Workers. It enables AI models to interact with Supabase databases through a standardized HTTP interface with built-in security controls.

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
2. **MCP Agent** (`src/supabaseMcp.ts`): Core MCP implementation that:
   - Extends the `McpAgent` base class from the `agents` library
   - Extracts Supabase auth tokens from request headers (`supabase-anon-key` and `supabase-url`)
   - Implements the `execute_sql` tool with security validation
   - Returns results in MCP protocol format

### Security Architecture
The security system has three layers:
1. **Default Security** (`src/config/security.ts`): Defines base security rules and the `SecurityConfig` interface
2. **Custom Security** (`src/config/custom-security.ts`): User-modifiable file that overrides default settings
3. **SQL Validator** (`src/utils/sqlValidator.ts`): Enforces security rules by validating SQL queries against the active configuration

Security features include:
- Operation whitelisting (default: SELECT only)
- Table and column access control
- Forbidden keyword detection
- Automatic LIMIT clause enforcement

### Key Implementation Details
- Uses Cloudflare Durable Objects for stateful connections
- TypeScript with strict type checking
- Zod schemas for runtime validation
- Environment bindings defined in `worker-configuration.d.ts`

## Testing SQL Execution
When testing the `execute_sql` tool, remember:
- Default configuration only allows SELECT queries
- Queries are automatically limited to 1000 rows unless specified
- Table/column restrictions can be configured in `custom-security.ts`
- The validator will reject queries with forbidden keywords (DELETE, DROP, etc.)