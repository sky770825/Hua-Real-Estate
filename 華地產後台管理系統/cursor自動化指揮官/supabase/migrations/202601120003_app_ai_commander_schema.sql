-- ============================================
-- 🚀 app_ai_commander 完整 Schema
-- ============================================
-- 用途：AI 指揮官專案的完整資料庫結構
-- 特性：可重複執行（idempotent）
-- 執行方式：在 Supabase SQL Editor 中直接執行
-- ============================================

-- ============================================
-- A) 補齊共用函數（如果前面已經有就會跳過）
-- ============================================
-- 用來讓 RLS 很乾淨：core.is_app_member(app_id) / core.app_role(app_id)

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

-- ============================================
-- B) 建立 app_ai_commander schema + 表
-- ============================================

create schema if not exists app_ai_commander;

-- 讓你有 updated_at
create or replace function core.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) 工作空間（先做個最小版：一個 workspace 預設屬於 owner）
create table if not exists app_ai_commander.workspaces (
  id uuid primary key default gen_random_uuid(),
  app_id text not null default 'ai_commander',
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Default Workspace',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_aic_workspaces_owner on app_ai_commander.workspaces(owner_id);

drop trigger if exists trg_aic_workspaces_updated_at on app_ai_commander.workspaces;
create trigger trg_aic_workspaces_updated_at
before update on app_ai_commander.workspaces
for each row execute function core.set_updated_at();


-- 2) 流程/任務（指揮官的流程定義）
create table if not exists app_ai_commander.workflows (
  id uuid primary key default gen_random_uuid(),
  app_id text not null default 'ai_commander',
  workspace_id uuid not null references app_ai_commander.workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'draft', -- draft|active|archived
  spec jsonb not null default '{}'::jsonb, -- 你的流程規格/節點圖/設定
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_aic_workflows_workspace on app_ai_commander.workflows(workspace_id);
create index if not exists idx_aic_workflows_owner on app_ai_commander.workflows(owner_id);

drop trigger if exists trg_aic_workflows_updated_at on app_ai_commander.workflows;
create trigger trg_aic_workflows_updated_at
before update on app_ai_commander.workflows
for each row execute function core.set_updated_at();


-- 3) 文件（RAG/筆記/PRD/指令庫）
create table if not exists app_ai_commander.documents (
  id uuid primary key default gen_random_uuid(),
  app_id text not null default 'ai_commander',
  workspace_id uuid not null references app_ai_commander.workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'manual', -- manual|upload|web|notion|drive...
  title text not null,
  content text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_aic_docs_workspace on app_ai_commander.documents(workspace_id);
create index if not exists idx_aic_docs_owner on app_ai_commander.documents(owner_id);

drop trigger if exists trg_aic_docs_updated_at on app_ai_commander.documents;
create trigger trg_aic_docs_updated_at
before update on app_ai_commander.documents
for each row execute function core.set_updated_at();


-- 4) 執行紀錄（每次指令/回覆/狀態）
create table if not exists app_ai_commander.runs (
  id uuid primary key default gen_random_uuid(),
  app_id text not null default 'ai_commander',
  workflow_id uuid references app_ai_commander.workflows(id) on delete set null,
  workspace_id uuid not null references app_ai_commander.workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  status text not null default 'queued', -- queued|running|success|failed
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_aic_runs_workspace on app_ai_commander.runs(workspace_id);
create index if not exists idx_aic_runs_owner on app_ai_commander.runs(owner_id);
create index if not exists idx_aic_runs_workflow on app_ai_commander.runs(workflow_id);

-- ============================================
-- C) RLS（保證多專案不打結）
-- ============================================
-- 規則設計：
-- * 必須是 ai_commander 的成員才能碰任何資料
-- * 只能讀寫自己的資料（owner_id = auth.uid）
-- * workspace 先做「一人一個 workspace」模式（未來要共享再擴充）

-- 開啟 RLS
alter table app_ai_commander.workspaces enable row level security;
alter table app_ai_commander.workflows enable row level security;
alter table app_ai_commander.documents enable row level security;
alter table app_ai_commander.runs enable row level security;

-- ========== workspaces ==========
drop policy if exists aic_ws_select on app_ai_commander.workspaces;
create policy aic_ws_select
on app_ai_commander.workspaces
for select to authenticated
using (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists aic_ws_insert on app_ai_commander.workspaces;
create policy aic_ws_insert
on app_ai_commander.workspaces
for insert to authenticated
with check (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists aic_ws_update on app_ai_commander.workspaces;
create policy aic_ws_update
on app_ai_commander.workspaces
for update to authenticated
using (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
)
with check (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists aic_ws_delete on app_ai_commander.workspaces;
create policy aic_ws_delete
on app_ai_commander.workspaces
for delete to authenticated
using (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);


-- ========== workflows ==========
drop policy if exists aic_wf_select on app_ai_commander.workflows;
create policy aic_wf_select
on app_ai_commander.workflows
for select to authenticated
using (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists aic_wf_insert on app_ai_commander.workflows;
create policy aic_wf_insert
on app_ai_commander.workflows
for insert to authenticated
with check (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists aic_wf_update on app_ai_commander.workflows;
create policy aic_wf_update
on app_ai_commander.workflows
for update to authenticated
using (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
)
with check (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists aic_wf_delete on app_ai_commander.workflows;
create policy aic_wf_delete
on app_ai_commander.workflows
for delete to authenticated
using (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);


-- ========== documents ==========
drop policy if exists aic_doc_select on app_ai_commander.documents;
create policy aic_doc_select
on app_ai_commander.documents
for select to authenticated
using (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists aic_doc_insert on app_ai_commander.documents;
create policy aic_doc_insert
on app_ai_commander.documents
for insert to authenticated
with check (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists aic_doc_update on app_ai_commander.documents;
create policy aic_doc_update
on app_ai_commander.documents
for update to authenticated
using (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
)
with check (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists aic_doc_delete on app_ai_commander.documents;
create policy aic_doc_delete
on app_ai_commander.documents
for delete to authenticated
using (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);


-- ========== runs ==========
drop policy if exists aic_run_select on app_ai_commander.runs;
create policy aic_run_select
on app_ai_commander.runs
for select to authenticated
using (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists aic_run_insert on app_ai_commander.runs;
create policy aic_run_insert
on app_ai_commander.runs
for insert to authenticated
with check (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists aic_run_update on app_ai_commander.runs;
create policy aic_run_update
on app_ai_commander.runs
for update to authenticated
using (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
)
with check (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

drop policy if exists aic_run_delete on app_ai_commander.runs;
create policy aic_run_delete
on app_ai_commander.runs
for delete to authenticated
using (
  app_id = 'ai_commander'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);

-- ============================================
-- ✅ 完成！
-- ============================================
-- 接下來請執行 onboarding SQL（見 onboarding 文件）
-- ============================================
