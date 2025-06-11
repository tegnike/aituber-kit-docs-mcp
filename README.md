# Supabase Simple HTTP MCP サーバー

Supabase統合を備えたMCP（Model Context Protocol）サーバーのCloudflare Workers実装で、SSE（Server-Sent Events）とStreamable HTTP接続の両方をサポートします。

## 概要

このプロジェクトは、Cloudflare Workers上で動作するMCPサーバーを提供し、ステートフルな接続にDurable Objectsを活用します。Model Context Protocolを実装して、AIモデルが標準化されたインターフェースを通じてSupabaseデータベースと対話できるようにします。

## 機能

- **SSEサポート**: リアルタイム通信のためのServer-Sent Eventsエンドポイント
- **Streamable HTTP**: MCPプロトコル用の標準HTTPエンドポイント
- **Durable Objects**: CloudflareのDurable Objectsを使用したステートフルな接続処理
- **TypeScript**: TypeScriptによる完全な型安全性
- **Supabase統合**: データベース操作のためのSupabaseとの直接統合
- **🔒 セキュリティ機能**: SQL実行の制限とホワイトリスト機能
  - SELECT文のみ許可（DELETE、DROP等の危険な操作を防止）
  - テーブル・カラムのアクセス制限
  - 禁止キーワードの検出
  - 最大取得行数の制限

## 前提条件

- Node.js（v18以上）
- Cloudflareアカウント
- Wrangler CLIがグローバルまたはnpx経由でインストール済み
- Supabaseプロジェクト（統合用）

## インストール

1. リポジトリをクローンします：
```bash
git clone https://github.com/tegnike/supabase-simple-http-mcp-server.git
cd supabase-simple-http-mcp-server
```

2. 依存関係をインストールします：
```bash
npm install
```

3. Cloudflareアカウントを設定します：
```bash
npx wrangler login
```

## 開発

開発サーバーを起動します：
```bash
npm run dev
```

サーバーは以下で利用可能になります：
- SSE: `http://localhost:8787/sse`
- Stremable HTTP: `http://localhost:8787/mcp`

### MCPクライアントの設定

以下はSSEの場合の設定例ですが、Stremable HTTPでも同じように設定できます。

#### Claude Desktop

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "/Users/user/.volta/bin/npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse",
        "--header",
        "Authorization: Bearer ${SUPABASE_AUTH_TOKEN}",
        "--header",
        "X-Project-Ref: ${SUPABASE_PROJECT_REF}"
      ],
      "env": {
        "SUPABASE_AUTH_TOKEN": "supabase_access_token",
        "SUPABASE_PROJECT_REF": "supabase_project_ref"
      }
    }
  }
}
```

#### Cursor

```json
{
  "mcpServers": {
    "supabase": {
      "url": "http://localhost:8787/sse",
      "headers": {
        "Authorization": "supabase_access_token",
        "X-Project-Ref": "supabase_project_ref"
      }
    }
  }
}
```

#### Mastra

※ MastraはMCP SDKのバグによりrequestInitとeventSourceInitの両方を設定する必要があるそうです。

参考: [リファレンス: MCPClient | ツール管理 | Mastra ドキュメント](https://mastra.ai/ja/reference/tools/mcp-client#sse%E3%83%AA%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%E3%83%98%E3%83%83%E3%83%80%E3%83%BC%E3%81%AE%E4%BD%BF%E7%94%A8)

```
const mcp = new MCPClient({
  servers: {
    supabase: {
      url: new URL(process.env.SUPABASE_MCP_URL || ""),
      requestInit: {
        headers: {
          "Authorization": `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
          "X-Project-Ref": process.env.SUPABASE_PROJECT_REF || ""
        }
      },
      eventSourceInit: {
        fetch(input: Request | URL | string, init?: RequestInit) {
          const headers = new Headers(init?.headers || {});
          headers.set("Authorization", `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`);
          headers.set("X-Project-Ref", process.env.SUPABASE_PROJECT_REF || "");
          return fetch(input, {
            ...init,
            headers,
          });
        },
      },
    },
  },
});
```


## デプロイ

Cloudflare Workersにデプロイします：
```bash
npm run deploy
```

## 設定

### セキュリティ設定

**重要**: 本番環境では必ずセキュリティ設定を適切に構成してください。

#### 設定ファイルの場所
- `src/config/security.ts` - デフォルトセキュリティ設定と型定義
- `src/config/custom-security.ts` - カスタムセキュリティ設定（ユーザー編集用）

#### カスタム設定

**🔧 設定の変更方法**

セキュリティ設定をカスタマイズするには、`src/config/custom-security.ts`ファイルを編集してください。このファイルは可変設定専用で、デフォルト設定を上書きできます：

```typescript
// src/config/custom-security.ts
export const CUSTOM_SECURITY_CONFIG: Partial<SecurityConfig> = {
  // 開発環境でのみINSERT/UPDATEを許可
  allowedSqlOperations: ['SELECT', 'INSERT', 'UPDATE'],
  
  // 特定のテーブルのみアクセス許可（空配列で全カラム許可）
  allowedColumns: { 
  'users': ['id', 'name', 'email', 'created_at'],
  'posts': ['id', 'title', 'content', 'author_id', 'created_at'],
  'categories': ['id', 'name', 'description'],
  'comments': ['id', 'content', 'post_id', 'author_id', 'created_at']
  },
  
  // 全テーブルアクセス許可（非推奨）
  // allowAllTables: true,
  
  // 最大行数を制限
  maxResultRows: 100
};
```

### Wrangler設定

`wrangler.jsonc`ファイルにはCloudflare Workersの設定が含まれています：
- **Durable Objectバインディング**: `SupabaseMCP`クラスを`MCP_OBJECT`として定義
- **互換性設定**: `compatibility_date`で実行環境の日付を指定
- **Node.js互換性フラグ**: `nodejs_compat`でNode.js APIの使用を有効化
- **マイグレーション設定**: Durable Objectsのバージョン管理
- **監視機能**: `observability`でパフォーマンス監視を有効化

## プロジェクト構造

```
   src/
      index.ts              # メインワーカーエントリーポイント
      supabaseMcp.ts        # Durable Object MCP実装（セキュリティ機能付き）
      config/
         security.ts        # デフォルトセキュリティ設定と型定義
         custom-security.ts # カスタムセキュリティ設定（ユーザー編集用）
      utils/
         sqlValidator.ts    # SQLバリデーション機能
   package.json
   tsconfig.json
   wrangler.jsonc           # Cloudflare Workers設定
   README.md
```
