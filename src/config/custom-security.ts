/**
 * カスタムセキュリティ設定
 * 
 * 🛠️ 必要に応じてここでデフォルト設定を上書きできます
 * 例：開発環境では制限を緩和、本番環境では厳格化
 */

import type { SecurityConfig } from './security';

export const CUSTOM_SECURITY_CONFIG: Partial<SecurityConfig> = {
  // 例：特定の操作のみ許可
  // allowedSqlOperations: ['SELECT', 'INSERT', 'UPDATE'],
  
  // 例：特定のテーブルのみアクセス許可
  allowedColumns: {
    'public_data': [],
    'public_messages': [],
    'my_tweets': [],
    'local_messages': [],
  }, // 空配列で全カラム許可
  
  // 例：全テーブルアクセス許可（非推奨）
  // allowAllTables: true,
  
  // 例：最大行数を制限
  // maxResultRows: 100
}; 