# 🚀 完整快速開始指南

> **從零到部署的完整流程**

---

## 📋 完整流程（3 大階段）

```
階段 1：Supabase 核心設定
  ↓
階段 2：Cloudflare Worker 部署
  ↓
階段 3：前端整合
  ↓
✅ 完成！
```

---

## 🏗️ 階段 1：Supabase 核心設定（30 分鐘）

### 1.1 建立 Supabase Project

1. 前往 [Supabase Dashboard](https://app.supabase.com)
2. 建立新專案
3. 選擇 Region（建議：Singapore 或 Tokyo）
4. 記下 Project URL 和 API Keys

### 1.2 執行核心結構 SQL

在 Supabase SQL Editor 執行：

```sql
-- 檔案：supabase/init_core_structure.sql
-- 建立 core schema、apps 表、app_memberships 表
```

### 1.3 建立第一個專案 Schema

```sql
-- 檔案：supabase/migrations/202601120003_app_ai_commander_schema.sql
-- 建立 app_ai_commander schema 和所有表
```

### 1.4 驗證設定

```sql
-- 檔案：supabase/verify_setup.sql
-- 確認所有結構都正確建立
```

### 1.5 記錄重要資訊

在 Supabase Dashboard → Settings → API 記下：

- ✅ `Project URL` → 例如：`https://xxxxx.supabase.co`
- ✅ `anon public key` → 用於前端
- ✅ `service_role key` → ⚠️ **只給 Worker 用**

> 📖 **詳細步驟**：查看 `SUPABASE_SETUP.md`

---

## 🚀 階段 2：Cloudflare Worker 部署（15 分鐘）

### 2.1 安裝依賴

```bash
cd worker
npm install
```

### 2.2 設定 Secrets

```bash
# Supabase 設定
npx wrangler secret put SUPABASE_URL
# 輸入：你的 Supabase Project URL

npx wrangler secret put SUPABASE_ANON_KEY
# 輸入：你的 Supabase anon public key

npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# 輸入：你的 Supabase service_role key

# Admin 保護
npx wrangler secret put INTERNAL_API_BEARER
# 輸入：自訂強密碼
```

### 2.3 部署

```bash
npx wrangler deploy
```

### 2.4 記錄 Worker URL

部署成功後會顯示 Worker URL，例如：
```
https://junyang-api.your-subdomain.workers.dev
```

> 📖 **詳細步驟**：查看 `worker/SETUP.md`

---

## 💻 階段 3：前端整合（10 分鐘）

### 3.1 複製檔案到 Vite 專案

```bash
# 在你的 Vite 專案根目錄
cp -r frontend-integration/src/lib your-vite-project/src/
cp frontend-integration/env.example your-vite-project/.env.example
```

### 3.2 安裝依賴

```bash
cd your-vite-project
npm i @supabase/supabase-js
```

### 3.3 設定環境變數

複製 `.env.example` 為 `.env` 並填入：

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE=https://junyang-api.your-subdomain.workers.dev
VITE_APP_ID=ai_commander
```

### 3.4 更新 main.tsx

在 `src/main.tsx` 中加入 onboard 邏輯（參考 `frontend-integration/src/main.tsx`）

### 3.5 Cloudflare Pages 設定

在 Cloudflare Pages → Project Settings → Environment Variables 設定：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE`
- `VITE_APP_ID`

**⚠️ 重要：Preview 環境也要設定！**

> 📖 **詳細步驟**：查看 `frontend-integration/INSTALL.md`

---

## ✅ 驗證整合

### 1. 測試 Worker

```bash
curl https://junyang-api.your-subdomain.workers.dev/api/health
```

應該回傳：`{"ok":true,"name":"junyang-api",...}`

### 2. 測試前端

1. 啟動開發伺服器：`npm run dev`
2. 登入應用
3. 檢查 Console：不應該有 `ensureOnboarded failed` 錯誤

### 3. 檢查資料庫

在 Supabase SQL Editor 執行：

```sql
-- 檢查 membership
select 
  am.app_id,
  a.name,
  am.user_id,
  am.role
from core.app_memberships am
join core.apps a on am.app_id = a.app_id
where am.app_id = 'ai_commander';

-- 檢查 workspace
select * from app_ai_commander.workspaces;
```

應該會看到你的使用者記錄。

---

## 🎯 下一步

完成整合後：

1. **開始開發功能**：使用 Supabase client 存取資料
2. **建立新專案**：參考 `supabase/NEW_APP_GUIDE.md`
3. **擴充功能**：參考 `INTEGRATION_GUIDE.md`

---

## 📚 相關文件

| 文件 | 說明 |
|------|------|
| `SUPABASE_SETUP.md` | Supabase 完整設定指南 |
| `worker/SETUP.md` | Worker 快速設定 |
| `frontend-integration/INSTALL.md` | 前端整合詳細步驟 |
| `INTEGRATION_GUIDE.md` | 完整整合流程 |
| `supabase/NEW_APP_GUIDE.md` | 建立新專案指南 |

---

## 🐛 常見問題

### Q: Worker 部署失敗？

**檢查：**
- 是否已設定所有 secrets？
- `wrangler.toml` 是否正確？

### Q: 前端 onboard 失敗？

**檢查：**
- 環境變數是否正確設定？
- Worker URL 是否正確？
- Supabase schema 是否已建立？

### Q: 看不到資料？

**檢查：**
- 是否已執行 onboard？
- RLS 政策是否正確？
- `app_id` 是否匹配？

---

**需要幫助？查看對應的詳細文件！**
