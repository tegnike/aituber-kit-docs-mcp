# Supabase Simple HTTP MCP サーバー

注意: AIが生成したので間違っている可能性があります。

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
- SSEエンドポイント: `http://localhost:8787/sse`
- MCPエンドポイント: `http://localhost:8787/mcp`

## デプロイ

Cloudflare Workersにデプロイします：
```bash
npm run deploy
```

## 設定

### セキュリティ設定

**重要**: 本番環境では必ずセキュリティ設定を適切に構成してください。

#### 設定ファイルの場所
- `src/config/security.ts` - セキュリティ設定の管理

#### 設定項目

```typescript
// 📝 許可するSQL操作（安全のためSELECTのみ推奨）
allowedSqlOperations: ['SELECT']

// 📝 テーブル別許可カラム（オブジェクトのキーが許可テーブル名）
allowedColumns: {
  'users': ['id', 'name', 'email', 'created_at'],
  'posts': ['id', 'title', 'content', 'author_id', 'created_at'],
  'categories': ['id', 'name', 'description'],
  'comments': ['id', 'content', 'post_id', 'author_id', 'created_at']
}

// 📝 最大取得行数
maxResultRows: 1000
```

#### カスタム設定

`CUSTOM_SECURITY_CONFIG`でデフォルト設定を上書きできます：

```typescript
export const CUSTOM_SECURITY_CONFIG: Partial<SecurityConfig> = {
  // 開発環境でのみINSERT/UPDATEを許可
  allowedSqlOperations: ['SELECT', 'INSERT', 'UPDATE'],
  
  // 特定のテーブルのみアクセス許可（空配列で全カラム許可）
  allowedColumns: { 'public_data': [] },
  
  // 全テーブルアクセス許可（非推奨）
  // allowAllTables: true,
  
  // 最大行数を制限
  maxResultRows: 100
};
```

### Wrangler設定

`wrangler.jsonc`ファイルにはWorkersの設定が含まれています：
- Durable Objectバインディング
- 互換性設定
- Node.js互換性フラグ

## プロジェクト構造

```
   src/
      index.ts              # メインワーカーエントリーポイント
      supabaseMcp.ts        # Durable Object MCP実装（セキュリティ機能付き）
      config/
         security.ts        # セキュリティ設定ファイル
      utils/
         sqlValidator.ts    # SQLバリデーション機能
   package.json
   tsconfig.json
   wrangler.jsonc           # Cloudflare Workers設定
   README.md
```

## APIエンドポイント

### SSEエンドポイント
- `GET /sse`: SSE接続を確立
- `POST /sse/message`: SSE接続を通じてメッセージを送信

### MCPエンドポイント
- `POST /mcp`: MCPプロトコル用のStreamable HTTPエンドポイント

### Supabaseツール
- `supabase`: セキュリティ制限付きSQL実行ツール
  - SELECT文のみ実行可能
  - ホワイトリストに登録されたテーブル・カラムのみアクセス可能
  - 最大取得行数制限あり
  - 危険なキーワード（DELETE、DROP等）は自動的にブロック

#### 使用例

```sql
-- ✅ 許可される例
SELECT id, name, email FROM users LIMIT 10;
SELECT * FROM posts WHERE author_id = 1;

-- ❌ 拒否される例
DELETE FROM users WHERE id = 1;  -- DELETE文は禁止
DROP TABLE posts;                -- DROP文は禁止
SELECT * FROM secret_table;      -- ホワイトリストにないテーブル
```

## 開発スクリプト

- `npm run dev` - ホットリロード付きの開発サーバーを起動
- `npm run deploy` - Cloudflare Workersにデプロイ
- `npm run cf-typegen` - Cloudflareバインディング用のTypeScript型を生成

## 使用技術

- **Cloudflare Workers**: サーバーレスエッジコンピューティングプラットフォーム
- **Durable Objects**: 接続処理用のステートフルサーバーレスオブジェクト
- **TypeScript**: 型安全なJavaScript
- **MCP SDK**: Model Context Protocol実装
- **Zod**: ランタイム型検証とスキーマ定義
- **Supabase**: オープンソースのFirebase代替

## セキュリティ機能

このMCPサーバーには以下のセキュリティ機能が組み込まれています：

### 🛡️ SQL実行制限
- **操作制限**: SELECT文のみ許可（DELETE、UPDATE、DROP等を防止）
- **テーブル制限**: ホワイトリストに登録されたテーブルのみアクセス可能
- **カラム制限**: テーブル別に許可されたカラムのみアクセス可能
- **行数制限**: 一度に取得できる最大行数を制限

### 🚫 禁止キーワード検出
以下のキーワードを含むクエリは自動的にブロックされます：
- `DELETE`, `DROP`, `TRUNCATE`, `INSERT`, `UPDATE`
- `ALTER`, `CREATE`, `GRANT`, `REVOKE`
- `EXEC`, `EXECUTE`, `CALL`
- SQLインジェクション攻撃に使用される可能性のあるキーワード

### ⚙️ 設定のカスタマイズ
- `src/config/security.ts`で簡単に設定変更可能
- 開発環境と本番環境で異なる設定を適用可能
- デフォルト設定は最も安全な状態に設定

### 📊 詳細なエラーメッセージ
- セキュリティ違反時に具体的な理由を表示
- 許可されている操作・テーブル・カラムの一覧を提示
- 警告メッセージで潜在的な問題を通知

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
