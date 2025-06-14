# AITuberKit Documentation MCP サーバー

AITuberKitのドキュメント検索機能を提供するMCP（Model Context Protocol）サーバーのCloudflare Workers実装で、SSE（Server-Sent Events）とStreamable HTTP接続の両方をサポートします。

## 概要

このプロジェクトは、Cloudflare Workers上で動作するAITuberKit Documentation MCPサーバーを提供します。AITuberKitのドキュメントを検索・参照するためのツールとして、AIモデルがModel Context Protocolを通じてドキュメントにアクセスできるようにします。

こちらの記事でも紹介しています。

https://zenn.dev/nikechan/articles/10ba0e4fe21d49

## 機能

- **SSEサポート**: リアルタイム通信のためのServer-Sent Eventsエンドポイント
- **Streamable HTTP**: MCPプロトコル用の標準HTTPエンドポイント
- **Durable Objects**: CloudflareのDurable Objectsを使用したステートフルな接続処理
- **TypeScript**: TypeScriptによる完全な型安全性
- **ドキュメント検索**: 自然言語クエリに基づいてAITuberKitのドキュメントを検索
- **OpenAI統合**: 最も関連性の高いドキュメントを自動選択
- **複数ドキュメント取得**: 最大3つの関連ドキュメントを一度に取得

## 前提条件

- Node.js（v18以上）
- Cloudflareアカウント
- Wrangler CLIがグローバルまたはnpx経由でインストール済み
- OpenAI APIキー（AITuberKitドキュメント検索用）

## インストール

1. リポジトリをクローンします：
```bash
git clone https://github.com/tegnike/aituberkit-docs-mcp-server.git
cd aituberkit-docs-mcp-server
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
- Streamable HTTP: `http://localhost:8787/mcp`

### MCPクライアントの設定

以下はSSEの場合の設定例ですが、Streamable HTTPでも同じように設定できます。

#### Claude Desktop

```json
{
  "mcpServers": {
    "aituberkit-docs": {
      "command": "/Users/user/.volta/bin/npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse"
      ]
    }
  }
}
```

#### Cursor

```json
{
  "mcpServers": {
    "aituberkit-docs": {
      "url": "http://localhost:8787/sse"
    }
  }
}
```


## デプロイ

Cloudflare Workersにデプロイします：
```bash
npm run deploy
```

## 設定

### 環境変数

`.dev.vars`ファイルを作成し、以下の環境変数を設定します：

```env
OPENAI_API_KEY=sk-...
```

本番環境では、Cloudflare Workersのシークレットとして設定します：

```bash
npx wrangler secret put OPENAI_API_KEY
```

### Wrangler設定

`wrangler.jsonc`ファイルにはCloudflare Workersの設定が含まれています：
- **Durable Objectバインディング**: `AITuberKitMCP`クラスを`MCP_OBJECT`として定義
- **互換性設定**: `compatibility_date`で実行環境の日付を指定
- **Node.js互換性フラグ**: `nodejs_compat`でNode.js APIの使用を有効化
- **マイグレーション設定**: Durable Objectsのバージョン管理
- **監視機能**: `observability`でパフォーマンス監視を有効化

## プロジェクト構造

```
   src/
      index.ts              # メインワーカーエントリーポイント
      aituberKitMcp.ts      # AITuberKit Documentation MCP実装
      index.json            # AITuberKitドキュメントのインデックス
      documentContent.ts    # ビルド時に生成されるドキュメント内容
      docs/                 # AITuberKitドキュメント（git submodule）
   scripts/
      buildDocumentContent.js # ドキュメント内容をビルドするスクリプト
   package.json
   tsconfig.json
   wrangler.jsonc           # Cloudflare Workers設定
   README.md
```

## MCPツール

### search_aituberkit_docs

AITuberKitのドキュメントを検索し、関連する情報を取得します。

**パラメータ:**
- `query` (string): 検索クエリ

**動作:**
1. OpenAI APIを使用して、クエリに最も関連するドキュメントを最大3つ選択
2. 選択されたドキュメントの内容を取得
3. 結合されたドキュメント内容を返す

**使用例:**
- 「AITuberKitでYouTube配信を設定する方法は？」
- 「VRMキャラクターの設定について教えて」
- 「リアルタイムAPIの使い方」
