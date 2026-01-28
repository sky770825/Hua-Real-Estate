-- ============================================
-- ✅ Supabase 核心結構驗證 SQL
-- ============================================
-- 用途：檢查核心結構是否正確建立
-- 執行方式：在 Supabase SQL Editor 中執行
-- ============================================

-- 檢查 core schema 是否存在
select 
  schema_name,
  '✅ core schema 存在' as status
from information_schema.schemata
where schema_name = 'core';

-- 檢查 core.apps 表
select 
  'core.apps' as table_name,
  count(*) as app_count,
  case 
    when count(*) >= 4 then '✅ 至少有 4 個 app'
    else '⚠️ app 數量不足'
  end as status
from core.apps;

-- 列出所有 app
select 
  app_id,
  name,
  is_active,
  created_at
from core.apps
order by created_at;

-- 檢查 core.app_memberships 表
select 
  'core.app_memberships' as table_name,
  count(*) as membership_count,
  '✅ 表已建立' as status
from core.app_memberships;

-- 檢查 RLS 是否啟用
select 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  case 
    when rowsecurity then '✅ RLS 已啟用'
    else '⚠️ RLS 未啟用'
  end as status
from pg_tables
where schemaname = 'core'
order by tablename;

-- 檢查 RLS 政策
select 
  schemaname,
  tablename,
  policyname,
  '✅ 政策已建立' as status
from pg_policies
where schemaname = 'core'
order by tablename, policyname;

-- ============================================
-- 📊 總結報告
-- ============================================
select 
  '📋 設定檢查完成' as summary,
  '請確認以上所有項目都顯示 ✅' as note;
