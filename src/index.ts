import { AITuberKitMCP } from './aituberKitMcp';
 
// Durable Objects のエクスポート
export { AITuberKitMCP };
 
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    
    // AITuberKit MCP endpoints
    if (url.pathname === '/sse' || url.pathname === '/sse/message') {
      return AITuberKitMCP.serveSSE('/sse').fetch(request, env, ctx);
    }
    if (url.pathname === '/mcp') {
      return AITuberKitMCP.serve('/mcp').fetch(request, env, ctx);
    }
 
    return new Response('Not found', { status: 404 });
  },
};
