import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SECURITY_CONFIG } from './config/security.js';
import { SqlValidator } from './utils/sqlValidator.js';
 
export class SupabaseMCP extends McpAgent {
	private authToken?: string;
	private projectRef?: string;
	private sqlValidator: SqlValidator;
	private _server: McpServer;
	
	get server() {
		return this._server;
	}

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.sqlValidator = new SqlValidator(SECURITY_CONFIG);
		this._server = new McpServer({
			name: 'SupabaseMCP Server',
			version: '0.1.0',
		});
	}
 
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
		this._server.tool(
			'supabase',
			'Execute SQL queries on Supabase using Management API (セキュリティ制限付き)',
			{
				sql: z.string().describe('実行するSQLクエリ（SELECT文のみ許可、ホワイトリストに登録されたテーブル・カラムのみアクセス可能）'),
			},
			async ({ sql }) => {
				
				// 🔒 セキュリティ検証
				const validationResult = this.sqlValidator.validate(sql);
				if (!validationResult.isValid) {
					const allowedTables = Object.keys(SECURITY_CONFIG.allowedColumns);
					return {
						content: [{
							type: 'text',
							text: `🚫 セキュリティエラー: ${validationResult.error}\n\n📋 許可されている設定:\n- 操作: ${SECURITY_CONFIG.allowedSqlOperations.join(', ')}\n- テーブル: ${allowedTables.join(', ')}\n- 最大行数: ${SECURITY_CONFIG.maxResultRows}`
						}],
						isError: true,
					};
				}

				// Use the headers stored from the fetch method
				const access_token = this.authToken;
				const project_ref = this.projectRef;
				
				if (!access_token) {
					return {
						content: [{
							type: 'text',
							text: '❌ 認証トークンが見つかりません'
						}],
						isError: true,
					};
				}
				if (!project_ref) {
					return {
						content: [{
							type: 'text',
							text: '❌ プロジェクト参照が見つかりません'
						}],
						isError: true,
					};
				}

				try {
					// LIMIT句が指定されていない場合は自動追加
					let finalSql = sql;
					if (!sql.toUpperCase().includes('LIMIT')) {
						finalSql = `${sql.trim()} LIMIT ${SECURITY_CONFIG.maxResultRows}`;
					}

					const url = `https://api.supabase.com/v1/projects/${project_ref}/database/query`;
					
					const headers: HeadersInit = {
						'Authorization': `Bearer ${access_token}`,
						'Content-Type': 'application/json',
					};

					const requestOptions: RequestInit = {
						method: 'POST',
						headers,
						body: JSON.stringify({ query: finalSql }),
					};

					const response = await fetch(url, requestOptions);
					const responseData = await response.json();

					if (!response.ok) {
						return {
							content: [{
								type: 'text',
								text: `❌ Supabaseエラー: ${response.status} ${response.statusText}\n${JSON.stringify(responseData, null, 2)}`
							}],
							isError: true,
						};
					}

					// 成功時のレスポンス（警告があれば表示）
					let resultText = JSON.stringify(responseData, null, 2);
					if (validationResult.warnings && validationResult.warnings.length > 0) {
						resultText = `⚠️ 警告:\n${validationResult.warnings.join('\n')}\n\n📊 クエリ結果:\n${resultText}`;
					} else {
						resultText = `✅ クエリ実行成功\n\n📊 結果:\n${resultText}`;
					}

					return {
						content: [{
							type: 'text',
							text: resultText
						}],
					};
				} catch (error) {
					return {
						content: [{
							type: 'text',
							text: `❌ クエリ実行エラー: ${error instanceof Error ? error.message : String(error)}`
						}],
						isError: true,
					};
				}
			}
		);
	}
}
