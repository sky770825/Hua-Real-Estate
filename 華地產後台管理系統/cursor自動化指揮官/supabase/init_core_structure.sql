-- ============================================
-- 🏗️ Supabase 核心結構初始化 SQL
-- ============================================
-- 用途：建立「唯一後端中樞」的基礎架構
-- 執行方式：在 Supabase SQL Editor 中分段執行
-- ============================================

-- ============================================
-- 2.1 建立 core schema（後端地基）
-- ============================================
create schema if not exists core;

-- ============================================
-- 2.2 專案註冊表（所有 App 都從這裡掛）
-- ============================================
create table if not exists core.apps (
  app_id text primary key,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================
-- 2.3 使用者 × 專案 關係表
-- ============================================
create table if not exists core.app_memberships (
  app_id text not null references core.apps(app_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (app_id, user_id)
);

-- ============================================
-- 2.4 啟用 RLS（先鎖起來）
-- ============================================
alter table core.apps enable row level security;
alter table core.app_memberships enable row level security;

-- ============================================
-- 2.5 基本安全政策（只能看到自己的 membership）
-- ============================================
create policy "select_own_memberships"
on core.app_memberships
for select
to authenticated
using (user_id = auth.uid());

-- ============================================
-- 第 3 步：註冊初始 app（一定會用到的）
-- ============================================
insert into core.apps (app_id, name) values
('ai_commander', 'AI 指揮官'),
('crm', 'CRM 系統'),
('linebot', 'LINE Bot 系統'),
('realestate', '房產平台')
on conflict (app_id) do nothing;

-- ============================================
-- ✅ 完成！核心結構已建立
-- ============================================
-- 接下來請：
-- 1. 檢查是否有錯誤
-- 2. 確認 core.apps 表中有 4 筆資料
-- 3. 繼續進行 Auth 和 Storage 設定
-- ============================================
