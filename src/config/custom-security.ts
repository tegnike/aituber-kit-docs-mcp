/**
 * カスタムセキュリティ設定
 * 
 * 🛠️ 必要に応じてここでデフォルト設定を上書きできます
 * 例：開発環境では制限を緩和、本番環境では厳格化
 */

import type { SecurityConfig } from './security';

export const CUSTOM_SECURITY_CONFIG: Partial<SecurityConfig> = {
  // 特定の操作のみ許可
  // allowedSqlOperations: ['SELECT', 'INSERT', 'UPDATE'],
  
  // 特定のテーブルのみアクセス許可（空配列で全カラム許可）
  allowedColumns: {
    'users': ['id', 'name', 'email', 'created_at'],
    'posts': ['id', 'title', 'content', 'author_id', 'created_at'],
    'categories': ['id', 'name', 'description'],
    'comments': ['id', 'content', 'post_id', 'author_id', 'created_at']
  },
  
  // allowedColumns無視で全テーブルアクセス許可（非推奨）
  // allowAllTables: true,
  
  // 最大行数を制限
  // maxResultRows: 100
}; 