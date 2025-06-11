/**
 * Supabase MCP セキュリティ設定
 * 
 * このファイルでSQL実行の制限を設定できます。
 * 本番環境では必要最小限のアクセス権限のみを許可してください。
 */

// カスタムセキュリティ設定は別ファイルから読み込み
import { CUSTOM_SECURITY_CONFIG } from './custom-security';

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
  allowedColumns: {},
  
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
 * 最終的なセキュリティ設定
 * デフォルト設定にカスタム設定をマージ
 */
export const SECURITY_CONFIG: SecurityConfig = {
  ...DEFAULT_SECURITY_CONFIG,
  ...CUSTOM_SECURITY_CONFIG
}; 