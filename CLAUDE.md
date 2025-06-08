# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Cloudflare Workers project that implements an MCP (Model Context Protocol) server with Supabase integration. It uses Cloudflare Durable Objects to handle SSE (Server-Sent Events) and Streamable HTTP connections.

## Key Technologies

- **Cloudflare Workers**: Serverless runtime environment
- **Durable Objects**: Stateful serverless objects (SupabaseMCP class)
- **TypeScript**: Strongly typed JavaScript
- **MCP SDK**: Model Context Protocol SDK (`@modelcontextprotocol/sdk`)
- **Zod**: Runtime type validation
- **Wrangler**: Cloudflare Workers CLI tool

## Architecture

- `src/index.ts`: Main worker entry point that routes requests to:
  - `/sse` and `/sse/message`: Server-Sent Events endpoints
  - `/mcp`: Streamable HTTP endpoint
- `src/supabaseMcp.ts`: Durable Object class extending McpAgent that implements MCP server functionality
- The project uses Cloudflare's Durable Objects pattern for stateful connections

## Development Commands

```bash
# Start development server
npm run dev

# Deploy to Cloudflare Workers
npm run deploy

# Generate TypeScript types for Cloudflare bindings
npm run cf-typegen
```

## Configuration

- `wrangler.jsonc`: Cloudflare Workers configuration
  - Defines Durable Object bindings (MCP_OBJECT -> SupabaseMCP)
  - Enables nodejs_compat flag
  - Sets compatibility date to 2025-06-07