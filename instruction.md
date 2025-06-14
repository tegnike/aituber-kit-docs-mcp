あなたにはこれからMcpAgentを作成してもらいます。
次の方法に則って作成してください。

## 仕様

- これはAITuberKitというアプリのドキュメントを参照するためのMCPサーバーです。

## ファイル情報

- ドキュメント情報はgitsubmoduleで src/docs に格納されています。
- src/index.json には、src/docs/guide 直下のファイル情報がjsonで記載されています。

## ツールについて

- MCPツールは、1つのみ作成してください。
- このツールは、指定のクエリに基づき、AITuberKitのドキュメント情報を返答します。

1. クエリを受け取ったら、上記のjsonファイルの中身とともにOpenAIのAPIを呼び出し、最も関連性の高いドキュメントを3つまで選択させます。
2. 選択されたドキュメントの内容をファイルからそのまま全て取得します。
3. 取得したファイルの情報をツールの返答として返します。

## 参考情報

- OpenAIのTypescriptライブラリのリポジトリ: https://github.com/openai/openai-node
- MCPサーバーの実装サンプル: src/supabaseMcp.ts

まずはこれらファイルを確認し、不明な場合に以下のドキュメントも参照してください。

- MCPのTypescriptライブラリのリポジトリ: https://github.com/modelcontextprotocol/typescript-sdk
