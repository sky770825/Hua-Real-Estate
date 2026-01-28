# 🚀 新專案建立指南

> **複製模板，替換變數，5 分鐘開新專案**

---

## 📋 快速流程（5 步驟）

### 1️⃣ 決定 APP_ID

從 `core.apps` 選一個或新增：

```sql
-- 查看現有 app
select * from core.apps;

-- 或新增一個
insert into core.apps (app_id, name) values
('your_new_app', '你的專案名稱')
on conflict (app_id) do nothing;
```

### 2️⃣ 複製模板

```bash
cp supabase/template_app_schema.sql supabase/migrations/app_{app_id}_schema.sql
```

### 3️⃣ 替換變數

在檔案中全域替換：

- `{APP_ID}` → 實際的 app_id（例如：`crm`）
- `{SCHEMA_NAME}` → `app_{app_id}`（例如：`app_crm`）
- `{PREFIX}` → 簡短前綴（例如：`crm`）

**範例：**
- `{APP_ID}` → `crm`
- `{SCHEMA_NAME}` → `app_crm`
- `{PREFIX}` → `crm`

### 4️⃣ 執行 SQL

在 Supabase SQL Editor 中執行修改後的檔案。

### 5️⃣ Onboarding 使用者

執行 onboarding SQL（見下方）。

---

## 🔄 完整範例：建立 `crm` 專案

### 步驟 1：註冊 app

```sql
insert into core.apps (app_id, name) values
('crm', 'CRM 系統')
on conflict (app_id) do nothing;
```

### 步驟 2：複製並修改模板

複製 `template_app_schema.sql`，替換：

```
{APP_ID} → crm
{SCHEMA_NAME} → app_crm
{PREFIX} → crm
```

### 步驟 3：執行 SQL

在 Supabase SQL Editor 執行修改後的檔案。

### 步驟 4：Onboarding

```sql
-- 加入使用者到 crm
insert into core.app_memberships (app_id, user_id, role)
values ('crm', 'USER_UUID_HERE', 'owner')
on conflict (app_id, user_id) do nothing;

-- 建立 default workspace
insert into app_crm.workspaces (owner_id, name)
values ('USER_UUID_HERE', 'Default Workspace');
```

---

## 📝 模板變數說明

| 變數 | 說明 | 範例 |
|------|------|------|
| `{APP_ID}` | 專案識別碼（小寫、底線） | `crm`, `linebot`, `realestate` |
| `{SCHEMA_NAME}` | Schema 名稱 | `app_crm`, `app_linebot` |
| `{PREFIX}` | 簡短前綴（用於索引、trigger 名稱） | `crm`, `lb`, `re` |

---

## ✅ 檢查清單

建立新專案後，確認：

- [ ] `core.apps` 中有新 app 記錄
- [ ] Schema `app_{app_id}` 已建立
- [ ] 所有表都有 `app_id` 和 `owner_id` 欄位
- [ ] RLS 已啟用
- [ ] RLS 政策中 `app_id = '{APP_ID}'` 正確
- [ ] 使用者已加入 `core.app_memberships`
- [ ] Default workspace 已建立

---

## 🔍 驗證查詢

### 檢查 schema 是否建立

```sql
select schema_name 
from information_schema.schemata
where schema_name = 'app_{app_id}';
```

### 檢查表是否建立

```sql
select table_name
from information_schema.tables
where table_schema = 'app_{app_id}'
order by table_name;
```

### 檢查 RLS 是否啟用

```sql
select 
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'app_{app_id}';
```

### 檢查使用者 membership

```sql
select 
  am.app_id,
  a.name,
  am.role
from core.app_memberships am
join core.apps a on am.app_id = a.app_id
where am.user_id = 'USER_UUID_HERE';
```

---

## 🎯 最佳實踐

### 1. 命名規範

- **app_id**：小寫、底線分隔（`line_bot` 而非 `lineBot`）
- **schema**：`app_{app_id}`
- **表名**：複數形式（`workspaces`, `workflows`）

### 2. 必備欄位

每張表都應該有：

```sql
app_id text not null default '{APP_ID}',
owner_id uuid not null references auth.users(id) on delete cascade,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

### 3. RLS 政策模式

所有 RLS 政策都應該：

1. 檢查 `app_id = '{APP_ID}'`
2. 檢查 `core.is_app_member(app_id)`
3. 檢查 `owner_id = auth.uid()`（或根據需求調整）

### 4. 索引建議

至少建立這些索引：

```sql
create index idx_{prefix}_{table}_owner on {schema}.{table}(owner_id);
create index idx_{prefix}_{table}_created_at on {schema}.{table}(created_at desc);
```

---

## 📚 相關文件

- `supabase/template_app_schema.sql` - 完整模板
- `supabase/migrations/202601120003_app_ai_commander_schema.sql` - 實戰範例
- `supabase/onboarding_ai_commander.sql` - Onboarding 範例
- `SUPABASE_SETUP.md` - 核心設定指南

---

## ⚠️ 常見錯誤

### 錯誤 1：忘記替換變數

**症狀**：SQL 執行失敗，找不到 `{APP_ID}`

**解決**：確保所有 `{APP_ID}`, `{SCHEMA_NAME}`, `{PREFIX}` 都已替換

### 錯誤 2：RLS 政策中的 app_id 寫錯

**症狀**：使用者無法存取資料

**解決**：檢查所有 RLS 政策中的 `app_id = '{APP_ID}'` 是否正確

### 錯誤 3：忘記 onboarding

**症狀**：使用者登入後看不到任何資料

**解決**：執行 onboarding SQL，加入 membership 和建立 workspace

---

**需要幫助？查看 `SUPABASE_SETUP.md` 或檢查現有專案範例！**
