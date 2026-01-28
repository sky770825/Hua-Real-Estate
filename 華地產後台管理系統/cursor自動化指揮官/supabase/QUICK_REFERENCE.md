# ⚡ Supabase 快速參考

> **重要資訊一頁看完**

---

## 🔑 三個關鍵 Key

```
Project URL: _________________________
anon public key: _____________________
service_role key: ___________________（⚠️ 保密！）
```

---

## 📋 核心結構

### Schema 層級

```
core/              # 核心架構（所有專案共用）
  ├── apps         # 專案註冊表
  └── app_memberships  # 使用者 × 專案關係

app_{app_id}/      # 專案專屬 schema
  └── 專案專屬表...

public/            # 通用功能（所有專案共用）
  └── 通用表...
```

### 已註冊的 App

- `ai_commander` - AI 指揮官
- `crm` - CRM 系統
- `linebot` - LINE Bot 系統
- `realestate` - 房產平台

---

## 🚀 新專案流程（5 步驟）

1. **決定 APP_ID**（從 `core.apps` 選或新增）
2. **複製模板**：`cp template_app_schema.sql app_{app_id}_schema.sql`
3. **替換變數**：`{APP_ID}`, `{SCHEMA_NAME}`, `{PREFIX}`
4. **執行 SQL** + **Onboarding 使用者**
5. **在 Cloudflare Pages 設定 env**

> 📖 詳細步驟：查看 `NEW_APP_GUIDE.md`

---

## 🔐 安全規則

### service_role key

- ✅ **可以放**：Workers、後端 API、.env（不 commit）
- ❌ **絕對不要**：前端程式碼、GitHub public repo

### RLS 政策模板

```sql
-- 必須是 app 成員 + 只能看到自己的資料
create policy "{prefix}_select"
on {schema}.{table}
for select
to authenticated
using (
  app_id = '{app_id}'
  and core.is_app_member(app_id)
  and owner_id = auth.uid()
);
```

> 💡 **使用 `core.is_app_member(app_id)` 確保多專案不打結**

---

## 📁 Storage 路徑規範

```
{app_id}/{user_id}/yyyy/mm/filename
```

**範例：**
```
ai_commander/550e8400-e29b-41d4-a716-446655440000/2025/01/document.pdf
```

---

## 🔍 常用查詢

### 檢查 app 是否存在

```sql
select * from core.apps where app_id = 'your_app_id';
```

### 查看所有 schema

```sql
select schema_name 
from information_schema.schemata
where schema_name not in ('pg_catalog', 'information_schema', 'pg_toast');
```

### 驗證設定

執行：`supabase/verify_setup.sql`

---

## 📝 檔案位置

### 核心設定
- 核心結構：`supabase/init_core_structure.sql`
- 驗證腳本：`supabase/verify_setup.sql`
- 完整指南：`SUPABASE_SETUP.md`

### 專案建立
- **新專案模板**：`supabase/template_app_schema.sql` ⭐
- **新專案指南**：`supabase/NEW_APP_GUIDE.md` ⭐
- **實戰範例**：`supabase/migrations/202601120003_app_ai_commander_schema.sql`
- **Onboarding 範例**：`supabase/onboarding_ai_commander.sql`

---

## ⚠️ 重要提醒

1. **這顆 Supabase = 唯一後端中樞**
2. **新專案 = 加 schema，不開新 Project**
3. **service_role key = 永不進前端**
4. **先建地基，再建功能**

---

**需要詳細說明？查看 `SUPABASE_SETUP.md`**
