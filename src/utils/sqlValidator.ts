import { SecurityConfig } from '../config/security.js';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * SQLクエリバリデーター
 * セキュリティ設定に基づいてSQLクエリの安全性を検証
 */
export class SqlValidator {
  constructor(private config: SecurityConfig) {}

  /**
   * SQLクエリを検証
   */
  validate(sql: string): ValidationResult {
    const trimmedSql = sql.trim();
    
    if (!trimmedSql) {
      return {
        isValid: false,
        error: 'SQLクエリが空です'
      };
    }

    // 1. 禁止キーワードチェック
    const forbiddenCheck = this.checkForbiddenKeywords(trimmedSql);
    if (!forbiddenCheck.isValid) {
      return forbiddenCheck;
    }

    // 2. 許可されたSQL操作チェック
    const operationCheck = this.checkAllowedOperations(trimmedSql);
    if (!operationCheck.isValid) {
      return operationCheck;
    }

    // 3. テーブルアクセス権限チェック
    const tableCheck = this.checkTableAccess(trimmedSql);
    if (!tableCheck.isValid) {
      return tableCheck;
    }

    // 4. カラムアクセス権限チェック
    const columnCheck = this.checkColumnAccess(trimmedSql);
    if (!columnCheck.isValid) {
      return columnCheck;
    }

    // 5. LIMIT句チェック
    const limitCheck = this.checkLimitClause(trimmedSql);
    
    return {
      isValid: true,
      warnings: limitCheck.warnings
    };
  }

  /**
   * 禁止キーワードをチェック
   */
  private checkForbiddenKeywords(sql: string): ValidationResult {
    const upperSql = sql.toUpperCase();
    
    for (const keyword of this.config.forbiddenKeywords) {
      const upperKeyword = keyword.toUpperCase();
      
      // 単語境界を考慮した検索
      const regex = new RegExp(`\\b${this.escapeRegex(upperKeyword)}\\b`, 'i');
      if (regex.test(upperSql)) {
        return {
          isValid: false,
          error: `禁止されたキーワードが含まれています: ${keyword}`
        };
      }
    }
    
    return { isValid: true };
  }

  /**
   * 許可されたSQL操作をチェック
   */
  private checkAllowedOperations(sql: string): ValidationResult {
    const upperSql = sql.toUpperCase().trim();
    
    // SQL文の最初の単語を取得
    const firstWord = upperSql.split(/\s+/)[0];
    
    if (!this.config.allowedSqlOperations.includes(firstWord)) {
      return {
        isValid: false,
        error: `許可されていないSQL操作です: ${firstWord}. 許可されている操作: ${this.config.allowedSqlOperations.join(', ')}`
      };
    }
    
    return { isValid: true };
  }

  /**
   * テーブルアクセス権限をチェック
   */
  private checkTableAccess(sql: string): ValidationResult {
    // 全テーブル許可の場合はスキップ
    if (this.config.allowAllTables) {
      return { isValid: true };
    }

    const tables = this.extractTableNames(sql);
    const allowedTables = Object.keys(this.config.allowedColumns);
    
    for (const table of tables) {
      if (!allowedTables.includes(table)) {
        return {
          isValid: false,
          error: `アクセス権限のないテーブルです: ${table}. 許可されているテーブル: ${allowedTables.join(', ')}`
        };
      }
    }
    
    return { isValid: true };
  }

  /**
   * カラムアクセス権限をチェック
   */
  private checkColumnAccess(sql: string): ValidationResult {
    const tables = this.extractTableNames(sql);
    const columns = this.extractColumnNames(sql);
    
    for (const table of tables) {
      const allowedColumns = this.config.allowedColumns[table];
      
      // テーブルのカラム制限が設定されていない場合はスキップ
      if (!allowedColumns || allowedColumns.length === 0) {
        continue;
      }
      
      for (const column of columns) {
        // ワイルドカード（*）の場合は許可されたカラムのみ取得されることを警告
        if (column === '*') {
          continue; // ワイルドカードは後でSupabase側で制限される
        }
        
        if (!allowedColumns.includes(column)) {
          return {
            isValid: false,
            error: `テーブル '${table}' でアクセス権限のないカラムです: ${column}. 許可されているカラム: ${allowedColumns.join(', ')}`
          };
        }
      }
    }
    
    return { isValid: true };
  }

  /**
   * LIMIT句をチェック
   */
  private checkLimitClause(sql: string): ValidationResult {
    const upperSql = sql.toUpperCase();
    const limitMatch = upperSql.match(/\bLIMIT\s+(\d+)/);
    
    if (limitMatch) {
      const limitValue = parseInt(limitMatch[1]);
      if (limitValue > this.config.maxResultRows) {
        return {
          isValid: false,
          error: `LIMIT値が最大許可行数を超えています: ${limitValue} > ${this.config.maxResultRows}`
        };
      }
    } else {
      // LIMIT句がない場合は警告
      return {
        isValid: true,
        warnings: [`LIMIT句が指定されていません。最大${this.config.maxResultRows}行まで取得されます。`]
      };
    }
    
    return { isValid: true };
  }

  /**
   * SQLからテーブル名を抽出（簡易版）
   */
  private extractTableNames(sql: string): string[] {
    const upperSql = sql.toUpperCase();
    const tables: string[] = [];
    
    // FROM句からテーブル名を抽出
    const fromMatches = upperSql.match(/\bFROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);
    if (fromMatches) {
      fromMatches.forEach(match => {
        const tableName = match.replace(/^FROM\s+/i, '').toLowerCase();
        if (!tables.includes(tableName)) {
          tables.push(tableName);
        }
      });
    }
    
    // JOIN句からテーブル名を抽出
    const joinMatches = upperSql.match(/\bJOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);
    if (joinMatches) {
      joinMatches.forEach(match => {
        const tableName = match.replace(/^JOIN\s+/i, '').toLowerCase();
        if (!tables.includes(tableName)) {
          tables.push(tableName);
        }
      });
    }
    
    return tables;
  }

  /**
   * SQLからカラム名を抽出（簡易版）
   */
  private extractColumnNames(sql: string): string[] {
    const upperSql = sql.toUpperCase();
    const columns: string[] = [];
    
    // SELECT句からカラム名を抽出
    const selectMatch = upperSql.match(/^SELECT\s+(.*?)\s+FROM/);
    if (selectMatch) {
      const columnsPart = selectMatch[1];
      
      if (columnsPart.includes('*')) {
        columns.push('*');
      } else {
        // カンマ区切りでカラム名を分割
        const columnList = columnsPart.split(',').map(col => {
          // エイリアス（AS）を除去
          const cleanCol = col.trim().replace(/\s+AS\s+\w+$/i, '');
          // テーブル名プレフィックスを除去
          const columnName = cleanCol.includes('.') ? 
            cleanCol.split('.')[1] : cleanCol;
          return columnName.toLowerCase();
        });
        
        columns.push(...columnList);
      }
    }
    
    return columns.filter(col => col && col !== '*');
  }

  /**
   * 正規表現用エスケープ
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
} 