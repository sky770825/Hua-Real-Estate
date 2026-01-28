-- ============================================
-- 📦 新專案 Schema 模板
-- ============================================
-- 用途：為新專案建立專屬 schema
-- 使用方式：
--   1. 複製此檔案並重新命名為：app_{app_id}_schema.sql
--   2. 替換所有 {APP_ID} 為實際的 app_id
--   3. 替換所有 {SCHEMA_NAME} 為實際的 schema 名稱（例如：app_ai_commander）
-- ============================================

-- ============================================
-- 1. 建立專案專屬 schema
-- ============================================
create schema if not exists {SCHEMA_NAME};

-- ============================================
-- 2. 建立範例表（請根據實際需求修改）
-- ============================================
create table if not exists {SCHEMA_NAME}.items (
  id uuid primary key default gen_random_uuid(),
  app_id text not null references core.apps(app_id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 3. 建立索引（提升查詢效能）
-- ============================================
create index if not exists idx_{SCHEMA_NAME}_items_app_id 
  on {SCHEMA_NAME}.items(app_id);

create index if not exists idx_{SCHEMA_NAME}_items_owner_id 
  on {SCHEMA_NAME}.items(owner_id);

create index if not exists idx_{SCHEMA_NAME}_items_created_at 
  on {SCHEMA_NAME}.items(created_at desc);

-- ============================================
-- 4. 啟用 RLS
-- ============================================
alter table {SCHEMA_NAME}.items enable row level security;

-- ============================================
-- 5. RLS 政策模板
-- ============================================

-- 5.1 使用者只能看到自己建立的項目
create policy "select_own_items"
on {SCHEMA_NAME}.items
for select
to authenticated
using (owner_id = auth.uid());

-- 5.2 使用者只能插入自己的項目
create policy "insert_own_items"
on {SCHEMA_NAME}.items
for insert
to authenticated
with check (owner_id = auth.uid());

-- 5.3 使用者只能更新自己的項目
create policy "update_own_items"
on {SCHEMA_NAME}.items
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- 5.4 使用者只能刪除自己的項目
create policy "delete_own_items"
on {SCHEMA_NAME}.items
for delete
to authenticated
using (owner_id = auth.uid());

-- ============================================
-- 6. 更新時間自動更新函數（可選）
-- ============================================
create or replace function {SCHEMA_NAME}.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 建立 trigger
create trigger update_{SCHEMA_NAME}_items_updated_at
  before update on {SCHEMA_NAME}.items
  for each row
  execute function {SCHEMA_NAME}.update_updated_at_column();

-- ============================================
-- 7. 在 core.apps 中註冊此 app（如果還沒註冊）
-- ============================================
-- insert into core.apps (app_id, name) values
-- ('{APP_ID}', '你的專案名稱')
-- on conflict (app_id) do nothing;

-- ============================================
-- ✅ 完成！
-- ============================================
-- 接下來：
-- 1. 根據實際需求修改表結構
-- 2. 調整 RLS 政策（如果需要團隊協作，可能需要更複雜的政策）
-- 3. 建立其他需要的表
-- ============================================
