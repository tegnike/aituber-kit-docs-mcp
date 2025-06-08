import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
 
export class SupabaseMCP extends McpAgent {
	server = new McpServer({
		name: 'SupabaseMCP Server',
		version: '0.1.0',
	});
 
	async init() {
		this.server.tool(
			'supabase',
			'Execute SQL queries on Supabase using Management API',
			{
				sql: z.string().describe('The SQL query to execute'),
			},
			async ({ sql }, { request }) => {
				const access_token = request?.headers?.get('Authorization')?.replace('Bearer ', '');
				const project_ref = request?.headers?.get('X-Project-Ref');
				
				if (!access_token || !project_ref) {
					return {
						content: [{
							type: 'text',
							text: 'Missing Authorization header or X-Project-Ref header'
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
