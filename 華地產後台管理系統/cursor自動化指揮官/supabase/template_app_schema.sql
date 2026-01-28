-- ============================================
-- 📦 新專案 Schema 完整模板（可重複執行版本）
-- ============================================
-- 用途：為新專案建立完整 schema（複製此檔案並替換 {APP_ID}）
-- 使用方式：
--   1. 複製此檔案並重新命名為：app_{app_id}_schema.sql
--   2. 全域替換：
--      - {APP_ID} → 實際的 app_id（例如：crm, linebot）
--      - {SCHEMA_NAME} → app_{app_id}（例如：app_crm, app_linebot）
--      - {PREFIX} → 簡短前綴（例如：crm, lb）
--   3. 在 Supabase SQL Editor 中執行
-- ============================================

-- ============================================
-- A) 共用函數（如果已經有就會跳過）
-- ============================================
-- 這些函數應該已經在 core schema 中，但為了確保可重複執行，這裡也包含

create schema if not exists core;

create or replace function core.is_app_member(p_app_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from core.app_memberships m
    where m.app_id = p_app_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function core.app_role(p_app_id text)
returns text
language sql
stable
as $$
  select coalesce(
    (select m.role
     from core.app_memberships m
     where m.app_id = p_app_id and m.user_id = auth.uid()),
    'none'
  );
$$;

create or replace function core.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================
-- B) 建立 {SCHEMA_NAME} schema + 表
-- ============================================

create schema if not exists {SCHEMA_NAME};

-- 範例表 1：工作空間（根據需求修改）
create table if not exists {SCHEMA_NAME}.workspaces (
  id uuid primary key default gen_random_uuid(),
  app_id text not null default '{APP_ID}',
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Default Workspace',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_{PREFIX}_workspaces_owner on {SCHEMA_NAME}.workspaces(owner_id);

drop trigger if exists trg_{PREFIX}_workspaces_updated_at on {SCHEMA_NAME}.workspaces;
create trigger trg_{PREFIX}_workspaces_updated_at
before update on {SCHEMA_NAME}.workspaces
for each row execute function core.set_updated_at();

-- 範例表 2：主要業務表（根據需求修改）
create table if not exists {SCHEMA_NAME}.items (
  id uuid primary key default gen_random_uuid(),
  app_id text not null default '{APP_ID}',
  workspace_id uuid not null references {SCHEMA_NAME}.workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text,
  status text not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_{PREFIX}_items_workspace on {SCHEMA_NAME}.items(workspace_id);
create index if not exists idx_{PREFIX}_items_owner on {SCHEMA_NAME}.items(owner_id);

drop trigger if exists trg_{PREFIX}_items_updated_at on {SCHEMA_NAME}.items;
create trigger trg_{PREFIX}_items_updated_at
before update on {SCHEMA_NAME}.items
for each row execute function core.set_updated_at();

-- ============================================
-- C) RLS（保證多專案不打結）
-- ============================================
-- 規則：必須是 {APP_ID} 的成員 + 只能讀寫自己的資料

-- 開啟 RLS
alter table {SCHEMA_NAME}.workspaces enable row level security;
alter table {SCHEMA_NAME}.items enable row level security;

-- ========== workspaces ==========
drop policy if exists {PREFIX}_ws_select on {SCHEMA_NAME}.workspaces;
create policy {PREFIX}_ws_select
on {SCHEMA_NAME}.workspaces
for select to authenticated
using (
  app_id = '{APP_ID}'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists {PREFIX}_ws_insert on {SCHEMA_NAME}.workspaces;
create policy {PREFIX}_ws_insert
on {SCHEMA_NAME}.workspaces
for insert to authenticated
with check (
  app_id = '{APP_ID}'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists {PREFIX}_ws_update on {SCHEMA_NAME}.workspaces;
create policy {PREFIX}_ws_update
on {SCHEMA_NAME}.workspaces
for update to authenticated
using (
  app_id = '{APP_ID}'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
)
with check (
  app_id = '{APP_ID}'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists {PREFIX}_ws_delete on {SCHEMA_NAME}.workspaces;
create policy {PREFIX}_ws_delete
on {SCHEMA_NAME}.workspaces
for delete to authenticated
using (
  app_id = '{APP_ID}'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

-- ========== items ==========
drop policy if exists {PREFIX}_item_select on {SCHEMA_NAME}.items;
create policy {PREFIX}_item_select
on {SCHEMA_NAME}.items
for select to authenticated
using (
  app_id = '{APP_ID}'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists {PREFIX}_item_insert on {SCHEMA_NAME}.items;
create policy {PREFIX}_item_insert
on {SCHEMA_NAME}.items
for insert to authenticated
with check (
  app_id = '{APP_ID}'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists {PREFIX}_item_update on {SCHEMA_NAME}.items;
create policy {PREFIX}_item_update
on {SCHEMA_NAME}.items
for update to authenticated
using (
  app_id = '{APP_ID}'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
)
with check (
  app_id = '{APP_ID}'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists {PREFIX}_item_delete on {SCHEMA_NAME}.items;
create policy {PREFIX}_item_delete
on {SCHEMA_NAME}.items
for delete to authenticated
using (
  app_id = '{APP_ID}'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

-- ============================================
-- D) 註冊 app（如果還沒註冊）
-- ============================================
insert into core.apps (app_id, name)
values ('{APP_ID}', '你的專案名稱')
on conflict (app_id) do nothing;

-- ============================================
-- ✅ 完成！
-- ============================================
-- 接下來：
-- 1. 根據實際需求修改表結構
-- 2. 執行 onboarding SQL 來加入使用者
-- 3. 測試 RLS 是否正常運作
-- ============================================
