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

### Wrangler設定

`wrangler.jsonc`ファイルにはWorkersの設定が含まれています：
- Durable Objectバインディング
- 互換性設定
- Node.js互換性フラグ

## プロジェクト構造

```
   src/
      index.ts          # メインワーカーエントリーポイント
      supabaseMcp.ts    # Durable Object MCP実装
   package.json
   tsconfig.json
   wrangler.jsonc        # Cloudflare Workers設定
   README.md
```

## APIエンドポイント

### SSEエンドポイント
- `GET /sse`: SSE接続を確立
- `POST /sse/message`: SSE接続を通じてメッセージを送信

### MCPエンドポイント
- `POST /mcp`: MCPプロトコル用のStreamable HTTPエンドポイント

## 開発スクリプト

- `npm run dev` - ホットリロード付きの開発サーバーを起動
- `npm run deploy` - Cloudflare Workersにデプロイ
- `npm run cf-typegen` - Cloudflareバインディング用のTypeScript型を生成

## 使用技術

- **Cloudflare Workers**: サーバーレスエッジコンピューティングプラットフォーム
- **Durable Objects**: 接続処理用のステートフルサーバーレスオブジェクト
- **TypeScript**: 型安全なJavaScript
- **MCP SDK**: Model Context Protocol実装
- **Zod**: ランタイム型検証
- **Supabase**: オープンソースのFirebase代替

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
