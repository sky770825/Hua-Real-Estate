# 📁 Supabase 資料庫文件

> **所有 Supabase 相關的 SQL 和指南都在這裡**

---

## 🚀 快速開始

### 第一次設定（60 分鐘內完成）

1. **核心結構** → `init_core_structure.sql`
2. **驗證設定** → `verify_setup.sql`
3. **完整指南** → 查看 `../SUPABASE_SETUP.md`

### 建立第一個專案

1. **執行 AI 指揮官 schema** → `migrations/202601120003_app_ai_commander_schema.sql`
2. **Onboarding 使用者** → `onboarding_ai_commander.sql`
3. **詳細指南** → 查看 `NEW_APP_GUIDE.md`

### 建立新專案（5 分鐘）

1. **複製模板** → `template_app_schema.sql`
2. **替換變數** → `{APP_ID}`, `{SCHEMA_NAME}`, `{PREFIX}`
3. **執行 SQL** + **Onboarding**
4. **詳細步驟** → 查看 `NEW_APP_GUIDE.md`

---

## 📂 檔案結構

```
supabase/
├── README.md                                    # 本文件
├── QUICK_REFERENCE.md                           # 快速參考卡片
├── NEW_APP_GUIDE.md                             # 新專案建立指南 ⭐
│
├── init_core_structure.sql                      # 核心結構（必做）
├── verify_setup.sql                             # 驗證設定
│
├── template_app_schema.sql                      # 新專案完整模板 ⭐
├── onboarding_ai_commander.sql                 # Onboarding 範例
│
└── migrations/                                  # 專案遷移檔案
    ├── 202601120001_rag_schema.sql             # RAG schema（現有）
    ├── 202601120002_match_rag_chunks_rpc.sql    # RAG RPC（現有）
    └── 202601120003_app_ai_commander_schema.sql # AI 指揮官 schema ⭐
```

---

## 📚 文件說明

### 🏗️ 核心設定

| 檔案 | 用途 | 何時使用 |
|------|------|----------|
| `init_core_structure.sql` | 建立 core schema 和基礎表 | **第一次設定時** |
| `verify_setup.sql` | 驗證核心結構是否正確 | 設定完成後 |
| `../SUPABASE_SETUP.md` | 完整設定指南 | 第一次設定時 |

### 🚀 專案建立

| 檔案 | 用途 | 何時使用 |
|------|------|----------|
| `template_app_schema.sql` | 新專案完整模板 | **每次建立新專案** |
| `NEW_APP_GUIDE.md` | 新專案建立指南 | 建立新專案時 |
| `migrations/202601120003_app_ai_commander_schema.sql` | AI 指揮官實戰範例 | 參考或直接使用 |

### 👤 使用者管理

| 檔案 | 用途 | 何時使用 |
|------|------|----------|
| `onboarding_ai_commander.sql` | Onboarding 範例 | 加入新使用者時 |

---

## 🎯 使用流程圖

```
第一次設定
    ↓
[init_core_structure.sql]
    ↓
[verify_setup.sql] ✅
    ↓
建立第一個專案（ai_commander）
    ↓
[migrations/202601120003_app_ai_commander_schema.sql]
    ↓
[onboarding_ai_commander.sql]
    ↓
✅ 完成！

未來新專案
    ↓
複製 [template_app_schema.sql]
    ↓
替換變數 → 執行
    ↓
Onboarding
    ↓
✅ 完成！
```

---

## 🔑 重要概念

### 1. 唯一後端中樞

**這顆 Supabase = 所有專案的唯一後端**

- ✅ 新專案 = 加 schema（`app_{app_id}`）
- ❌ 新專案 ≠ 開新 Supabase Project

### 2. 核心架構

```
core/                    # 核心（所有專案共用）
  ├── apps              # 專案註冊表
  └── app_memberships   # 使用者 × 專案關係

app_{app_id}/           # 專案專屬 schema
  └── 專案專屬表...

public/                 # 通用功能（所有專案共用）
  └── 通用表...
```

### 3. RLS 安全規則

所有專案都遵循：

1. **必須是 app 成員**：`core.is_app_member(app_id)`
2. **只能存取自己的資料**：`owner_id = auth.uid()`
3. **app_id 必須匹配**：`app_id = '{APP_ID}'`

---

## 📋 檢查清單

### 核心設定完成後

- [ ] `core` schema 已建立
- [ ] `core.apps` 表有 4 筆資料
- [ ] `core.app_memberships` 表已建立
- [ ] RLS 已啟用
- [ ] 共用函數已建立（`core.is_app_member`, `core.app_role`）

### 專案建立完成後

- [ ] `app_{app_id}` schema 已建立
- [ ] 所有表都有 `app_id` 和 `owner_id`
- [ ] RLS 已啟用且政策正確
- [ ] 使用者已加入 `core.app_memberships`
- [ ] Default workspace 已建立

---

## 🔍 常用查詢

### 查看所有 app

```sql
select * from core.apps order by created_at;
```

### 查看所有 schema

```sql
select schema_name 
from information_schema.schemata
where schema_name not in ('pg_catalog', 'information_schema', 'pg_toast')
order by schema_name;
```

### 查看特定專案的表

```sql
select table_name
from information_schema.tables
where table_schema = 'app_{app_id}'
order by table_name;
```

### 查看使用者 membership

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

## ⚠️ 常見問題

### Q: 如何找到我的 user UUID？

```sql
select id, email, created_at 
from auth.users 
order by created_at desc;
```

### Q: 執行 SQL 時出現錯誤？

1. 確認已執行 `init_core_structure.sql`
2. 確認共用函數已建立
3. 檢查變數是否正確替換

### Q: 使用者看不到資料？

1. 確認已執行 onboarding SQL
2. 確認 RLS 政策正確
3. 確認 `app_id` 匹配

---

## 📖 延伸閱讀

- `../SUPABASE_SETUP.md` - 完整設定指南
- `QUICK_REFERENCE.md` - 快速參考
- `NEW_APP_GUIDE.md` - 新專案建立指南

---

**需要幫助？查看對應的指南文件！**
