/**
 * Supabase MCP セキュリティ設定
 * 
 * このファイルでSQL実行の制限を設定できます。
 * 本番環境では必要最小限のアクセス権限のみを許可してください。
 */

export interface SecurityConfig {
  // 許可するSQL操作の種類
  allowedSqlOperations: string[];
  
  // 許可するカラム（テーブル別、空配列の場合は全カラム許可）
  // このオブジェクトのキーが許可されるテーブル名になります
  allowedColumns: Record<string, string[]>;
  
  // 禁止キーワード（これらが含まれる場合は実行拒否）
  forbiddenKeywords: string[];
  
  // 最大結果行数
  maxResultRows: number;
  
  // 全テーブルアクセスを許可するかどうか（allowedColumnsを無視）
  allowAllTables?: boolean;
}

/**
 * デフォルトセキュリティ設定
 * 
 * 🔒 セキュリティ設定の説明：
 * - allowedSqlOperations: 許可するSQL操作（SELECT のみ推奨）
 * - allowedColumns: テーブル別のアクセス可能カラム（キーが許可テーブル名）
 * - forbiddenKeywords: 実行を禁止するキーワード
 * - maxResultRows: 一度に取得できる最大行数
 * - allowAllTables: 全テーブルアクセス許可（非推奨）
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  // 📝 許可するSQL操作（安全のためSELECTのみ）
  allowedSqlOperations: [
    'SELECT'
  ],
  
  // 📝 テーブル別許可カラム（オブジェクトのキーが許可されるテーブル名）
  // 空配列にすると該当テーブルの全カラムアクセス可能
  // テーブルをここに追加するだけで、そのテーブルへのアクセスが許可されます
  allowedColumns: {
    tweets: [],
    public_messages: [],
    my_tweets: [],
    local_messages: [],
  },
  
  // 📝 禁止キーワード（大文字小文字区別なし）
  forbiddenKeywords: [
    'DELETE',
    'DROP',
    'TRUNCATE',
    'INSERT',
    'UPDATE',
    'ALTER',
    'CREATE',
    'GRANT',
    'REVOKE',
    'EXEC',
    'EXECUTE',
    'CALL',
    '--',
    '/*',
    '*/',
    'UNION',
    'INFORMATION_SCHEMA',
    'pg_',
    'sys'
  ],
  
  // 📝 最大結果行数（大量データ取得を防ぐ）
  maxResultRows: 1000
};

/**
 * カスタムセキュリティ設定
 * 
 * 🛠️ 必要に応じてここでデフォルト設定を上書きできます
 * 例：開発環境では制限を緩和、本番環境では厳格化
 */
export const CUSTOM_SECURITY_CONFIG: Partial<SecurityConfig> = {
  // 例：開発環境でのみINSERT/UPDATEを許可
  // allowedSqlOperations: ['SELECT', 'INSERT', 'UPDATE'],
  
  // 例：特定のテーブルのみアクセス許可
  // allowedColumns: { 'public_data': [] }, // 空配列で全カラム許可
  
  // 例：全テーブルアクセス許可（非推奨）
  // allowAllTables: true,
  
  // 例：最大行数を制限
  // maxResultRows: 100
};

/**
 * 最終的なセキュリティ設定
 * デフォルト設定にカスタム設定をマージ
 */
export const SECURITY_CONFIG: SecurityConfig = {
  ...DEFAULT_SECURITY_CONFIG,
  ...CUSTOM_SECURITY_CONFIG
}; 