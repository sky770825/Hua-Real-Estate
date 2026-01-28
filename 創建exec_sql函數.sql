-- ============================================
-- 創建 exec_sql RPC 函數（用於執行任意 SQL）
-- ============================================
-- 此函數允許通過 API 執行 SQL 語句
-- ⚠️ 注意：此函數有安全風險，僅用於開發環境或受信任的環境
-- ============================================

-- 創建執行 SQL 的函數
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result TEXT;
BEGIN
  -- 執行 SQL（僅允許 DDL 和 DML，不允許危險操作）
  -- 這裡我們只允許創建/刪除策略
  IF sql_query ~* '(CREATE POLICY|DROP POLICY)' THEN
    EXECUTE sql_query;
    RETURN 'Success: Policy operation completed';
  ELSE
    RAISE EXCEPTION 'Only CREATE POLICY or DROP POLICY statements are allowed';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;

-- 授予執行權限
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;

-- ============================================
-- 使用說明：
-- ============================================
-- 1. 在 Supabase SQL Editor 中執行此腳本
-- 2. 完成後，API 就可以自動執行 CREATE POLICY 語句了
-- ============================================
