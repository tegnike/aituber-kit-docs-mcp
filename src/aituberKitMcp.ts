import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import documentIndexData from './index.json';
import { documentContent } from './documentContent.js';

interface DocumentIndex {
  [category: string]: {
    [file: string]: string;
  } | string;
}

export class AITuberKitMCP extends McpAgent<Env> {
  private _server: McpServer;
  private documentIndex: DocumentIndex;
  private _env: Env;
  
  get server() {
    return this._server;
  }

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this._env = env;
    this._server = new McpServer({
      name: 'AITuberKit Documentation MCP Server',
      version: '0.1.0',
    });
    
    // Load document index
    this.documentIndex = documentIndexData as DocumentIndex;
  }
  
  async init() {
    this._server.tool(
      'search_aituberkit_docs',
      'Search AITuberKit documentation based on a query',
      {
        query: z.string().describe('The search query for finding relevant AITuberKit documentation'),
      },
      async ({ query }) => {
        try {
          // Step 1: Use OpenAI to select the most relevant documents
          const documentList = this.formatDocumentList();
          
          const openaiApiKey = this._env.OPENAI_API_KEY;
          if (!openaiApiKey) {
            throw new Error('OPENAI_API_KEY is not configured');
          }
          
          const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: `You are a helpful assistant that selects the most relevant AITuberKit documentation files based on a user query. 
Here is the list of available documents with their descriptions:\n\n${documentList}\n\nPlease select up to 3 most relevant documents for the given query. Return only the file paths in JSON format like: {"files": ["category/filename", ...]}`
                },
                {
                  role: 'user',
                  content: query
                }
              ],
              temperature: 0.3,
              response_format: { type: 'json_object' }
            })
          });
          
          if (!openaiResponse.ok) {
            const error = await openaiResponse.text();
            throw new Error(`OpenAI API error: ${error}`);
          }
          
          const openaiData = await openaiResponse.json() as any;
          const response = openaiData.choices[0].message.content;
          if (!response) {
            throw new Error('No response from OpenAI');
          }
          
          const selectedFiles = JSON.parse(response).files as string[];
          
          // Step 2: Read the content of selected documents  
          const documentContents: string[] = [];
          
          for (const filePath of selectedFiles) {
            try {
              // Dynamically import the markdown file content
              const content = await this.loadDocumentContent(filePath);
              if (content) {
                documentContents.push(`\n\n# 📄 ${filePath}\n\n${content}`);
              }
            } catch (error) {
              console.error(`Error reading file ${filePath}:`, error);
            }
          }
          
          // Step 3: Return the combined content
          if (documentContents.length === 0) {
            return {
              content: [{
                type: 'text',
                text: '❌ No relevant documents found for your query.'
              }],
              isError: true,
            };
          }
          
          return {
            content: [{
              type: 'text',
              text: `✅ Found ${documentContents.length} relevant document(s) for: "${query}"\n${documentContents.join('\n\n---\n')}`
            }],
          };
          
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `❌ Error searching documentation: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true,
          };
        }
      }
    );
  }
  
  private formatDocumentList(): string {
    const lines: string[] = [];
    
    for (const [category, files] of Object.entries(this.documentIndex)) {
      if (typeof files === 'object' && files !== null) {
        for (const [filename, description] of Object.entries(files)) {
          lines.push(`- ${category}/${filename}: ${description}`);
        }
      } else {
        // Handle top-level files
        lines.push(`- ${category}: ${files}`);
      }
    }
    
    return lines.join('\n');
  }
  
  private async loadDocumentContent(filePath: string): Promise<string | null> {
    // Load from pre-built document content
    return documentContent[filePath] || null;
  }
}