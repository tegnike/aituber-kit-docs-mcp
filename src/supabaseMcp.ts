import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
 
export class SupabaseMCP extends McpAgent {
	private authToken?: string;
	private projectRef?: string;
	
	server = new McpServer({
		name: 'SupabaseMCP Server',
		version: '0.1.0',
	});
 
	// Override fetch to extract headers before processing
	async fetch(request: Request): Promise<Response> {		
		// Extract headers from the incoming request
		this.authToken = request.headers.get('Authorization')?.replace('Bearer ', '') || undefined;
		this.projectRef = request.headers.get('X-Project-Ref') || undefined;
		
		// Call parent fetch method
		return super.fetch(request);
	}
	
	// Override onSSEMcpMessage to handle SSE POST messages
	async onSSEMcpMessage(sessionId: string, request: Request): Promise<Error | null> {
		
		// Extract headers from the SSE POST request
		this.authToken = request.headers.get('Authorization')?.replace('Bearer ', '') || undefined;
		this.projectRef = request.headers.get('X-Project-Ref') || undefined;
		
		// Call parent method
		return super.onSSEMcpMessage(sessionId, request);
	}
	
	async init() {
		this.server.tool(
			'supabase',
			'Execute SQL queries on Supabase using Management API',
			{
				sql: z.string().describe('The SQL query to execute'),
			},
			async ({ sql }) => {
				
				// Use the headers stored from the fetch method
				const access_token = this.authToken;
				const project_ref = this.projectRef;
				
				if (!access_token) {
					return {
						content: [{
							type: 'text',
							text: 'Missing access token'
						}],
						isError: true,
					};
				}
				if (!project_ref) {
					return {
						content: [{
							type: 'text',
							text: 'Missing project reference'
						}],
						isError: true,
					};
				}

				try {
					const url = `https://api.supabase.com/v1/projects/${project_ref}/database/query`;
					
					const headers: HeadersInit = {
						'Authorization': `Bearer ${access_token}`,
						'Content-Type': 'application/json',
					};

					const requestOptions: RequestInit = {
						method: 'POST',
						headers,
						body: JSON.stringify({ query: sql }),
					};

					const response = await fetch(url, requestOptions);
					const responseData = await response.json();

					if (!response.ok) {
						return {
							content: [{
								type: 'text',
								text: `Error: ${response.status} ${response.statusText}\n${JSON.stringify(responseData, null, 2)}`
							}],
							isError: true,
						};
					}

					return {
						content: [{
							type: 'text',
							text: JSON.stringify(responseData, null, 2)
						}],
					};
				} catch (error) {
					return {
						content: [{
							type: 'text',
							text: `Error executing Supabase query: ${error instanceof Error ? error.message : String(error)}`
						}],
						isError: true,
					};
				}
			}
		);
	}
}
