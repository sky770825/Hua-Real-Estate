# 🏗️ Supabase 核心設定指南

> **建立後 60 分鐘內一定要做完的清單**

---

## ✅ 第 0 步｜確認 Supabase 定位

**這顆 Supabase 的定位：**

> **唯一後端中樞（All Projects Core）**

**不是：**
- ❌ 某個 Lovable 專案
- ❌ 某個 AI 專案
- ❌ 某個 LINE Bot

👉 **之後任何新專案，都只能加 schema／app_id，不能再開新 Project。**

---

## ✅ 第 1 步｜基本設定（立刻做）

### 進入 Supabase Dashboard

### 1️⃣ Project Settings → General

- **Region**：選 **離你最近**（通常是 Singapore / Tokyo）
- **Project name**：已經建好就不用動（這顆就是核心）

### 2️⃣ API → 記下三個值（先不要亂貼）

- `Project URL`
- `anon public key`
- `service_role key`（⚠️ **只能給 Workers / 後端**）

> 📌 **service_role key：現在就決定「永不進前端 repo」**

---

## ✅ 第 2 步｜立刻跑「核心結構 SQL」（最重要）

### 執行方式

1. 打開 **Supabase Dashboard → SQL Editor**
2. 打開檔案：`supabase/init_core_structure.sql`
3. **一次一段跑**（不要全貼）

### 或者直接複製以下 SQL：

#### 2.1 建立 core schema（後端地基）

```sql
create schema if not exists core;
```

#### 2.2 專案註冊表（所有 App 都從這裡掛）

```sql
create table if not exists core.apps (
  app_id text primary key,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

#### 2.3 使用者 × 專案 關係表

```sql
create table if not exists core.app_memberships (
  app_id text not null references core.apps(app_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (app_id, user_id)
);
```

#### 2.4 啟用 RLS（先鎖起來）

```sql
alter table core.apps enable row level security;
alter table core.app_memberships enable row level security;
```

#### 2.5 基本安全政策（只能看到自己的 membership）

```sql
create policy "select_own_memberships"
on core.app_memberships
for select
to authenticated
using (user_id = auth.uid());
```

#### 2.6 註冊初始 app

```sql
insert into core.apps (app_id, name) values
('ai_commander', 'AI 指揮官'),
('crm', 'CRM 系統'),
('linebot', 'LINE Bot 系統'),
('realestate', '房產平台')
on conflict (app_id) do nothing;
```

✅ **到這一步，你已經有「多專案不打結的骨架」。**

---

## ✅ 第 3 步｜驗證核心結構

在 SQL Editor 執行：

```sql
-- 檢查 apps 表
select * from core.apps;

-- 應該看到 4 筆資料：
-- ai_commander, crm, linebot, realestate
```

---

## ✅ 第 4 步｜Auth 設定（避免之後一直撞牆）

### 進入 Authentication → Settings

### 4.1 Site URL

先填一個暫時的（之後再加）

```
https://*.pages.dev
```

### 4.2 Redirect URLs（很重要）

先加這些（之後再補）

```
https://*.pages.dev/**
http://localhost:*
```

> ⚠️ **不然你之後每接一個 Cloudflare Pages 都會登入失敗。**

---

## ✅ 第 5 步｜Storage（先開一個通用 bucket）

### 進入 Storage → New bucket

- **Bucket name**：`uploads`
- **Public**：❌ **不要勾**

### 路徑規範（之後一定照這個）

```
{app_id}/{user_id}/yyyy/mm/filename
```

**範例：**
```
ai_commander/550e8400-e29b-41d4-a716-446655440000/2025/01/document.pdf
```

> 📖 **遇到 Storage 問題？** 查看 `TROUBLESHOOTING.md` 的「Storage 配置檢查清單」和「常見錯誤快速診斷」

---

## ✅ 第 6 步｜現在「先不要做」的事（很重要）

### 🚫 先不要：

- ❌ 亂建 table
- ❌ 把 service_role key 塞進前端
- ❌ 為新專案再開 Supabase Project
- ❌ 開很多 bucket

**你現在是在「地基期」，不是功能期。**

---

## ✅ 第 7 步｜你接下來的正確流程

### 以後流程永遠是：

1. **Lovable 下載專案**
2. **決定 `APP_ID`**（從 `core.apps` 選一個或新增）
3. **GitHub → Cloudflare Pages 部署**
4. **Pages env 設：**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_ID`
   - `VITE_API_BASE`
5. **Supabase：**
   - 建 `app_xxx` schema（例如：`app_ai_commander`）
   - 建表（帶 app_id / owner_id）
   - 套 RLS 模板
6. **需要私密金鑰的功能 → 一律走 Cloudflare Workers**

---

## 📋 檢查清單

完成後請確認：

- [ ] Region 已設定（離你最近）
- [ ] 已記下 Project URL、anon key、service_role key
- [ ] `core` schema 已建立
- [ ] `core.apps` 表已建立，且有 4 筆資料
- [ ] `core.app_memberships` 表已建立
- [ ] RLS 已啟用
- [ ] Auth Redirect URLs 已設定
- [ ] Storage bucket `uploads` 已建立（非公開）
- [ ] service_role key **沒有**放在前端 repo

---

## 🔐 安全提醒

### service_role key 使用規則

- ✅ **可以放在：**
  - Cloudflare Workers
  - 後端 API（Node.js、Python 等）
  - 環境變數（.env，**不要 commit**）

- ❌ **絕對不要放在：**
  - 前端程式碼
  - GitHub public repo
  - 瀏覽器可存取的任何地方

---

## 📝 重要資訊記錄區

### 你的 Supabase 資訊

```
Project URL: _________________________
anon public key: _____________________
service_role key: ___________________（⚠️ 保密！）
Region: _____________________________
```

> 💡 **建議：把這些資訊存在密碼管理器或安全的筆記中**

---

## 🎯 下一步

完成以上設定後，你的 Supabase 已經：

- ✅ 具備多專案架構
- ✅ 有基本安全政策
- ✅ 準備好接新專案

**現在可以開始建立第一個專案的 schema 了！**

---

## 📚 相關文件

### 核心設定
- `supabase/init_core_structure.sql` - 核心結構 SQL
- `supabase/verify_setup.sql` - 驗證設定是否正確
- `supabase/QUICK_REFERENCE.md` - 快速參考卡片

### 專案建立
- **`supabase/NEW_APP_GUIDE.md`** ⭐ - 新專案建立完整指南
- **`supabase/template_app_schema.sql`** ⭐ - 可重複使用的完整模板
- `supabase/migrations/202601120003_app_ai_commander_schema.sql` - 實戰範例
- `supabase/onboarding_ai_commander.sql` - Onboarding 範例
- `supabase/migrations/` - 專案專屬遷移檔案

---

## 🎯 下一步：建立第一個專案

完成核心設定後，立即建立 `app_ai_commander`：

1. **執行**：`supabase/migrations/202601120003_app_ai_commander_schema.sql`
2. **Onboarding**：執行 `supabase/onboarding_ai_commander.sql`（替換 UUID）
3. **驗證**：確認可以正常存取資料

> 📖 **詳細步驟：查看 `supabase/NEW_APP_GUIDE.md`**

---

## 🔄 處理現有 Schema

如果你已經有使用 `public` schema 的資料表（例如 RAG schema），有兩種處理方式：

### 選項 1：保留在 public（適合通用功能）

如果這個功能是**所有專案都會用到的**（例如 RAG），可以保留在 `public` schema。

### 選項 2：遷移到專案專屬 schema（適合專案特定功能）

如果這個功能是**特定專案專用的**，應該遷移到 `app_{app_id}` schema。

**遷移步驟：**
1. 建立新的 schema：`create schema if not exists app_{app_id};`
2. 遷移表：`alter table public.{table_name} set schema app_{app_id};`
3. 更新相關的 RLS 政策和索引

---

## 🛠️ 實用 SQL 查詢

### 查看所有 app

```sql
select * from core.apps order by created_at;
```

### 查看特定 app 的成員

```sql
select 
  am.app_id,
  a.name as app_name,
  am.user_id,
  am.role,
  am.created_at
from core.app_memberships am
join core.apps a on am.app_id = a.app_id
where am.app_id = 'ai_commander';
```

### 查看所有 schema

```sql
select schema_name 
from information_schema.schemata
where schema_name not in ('pg_catalog', 'information_schema', 'pg_toast')
order by schema_name;
```

### 查看所有表（包含 schema）

```sql
select 
  table_schema,
  table_name
from information_schema.tables
where table_schema not in ('pg_catalog', 'information_schema', 'pg_toast')
order by table_schema, table_name;
```
