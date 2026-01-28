# ⚡ Worker 快速設定指南

> **5 分鐘完成設定和部署**

---

## 📋 檢查清單

### 前置需求

- [ ] 已建立 Supabase Project
- [ ] 已執行 `supabase/init_core_structure.sql`
- [ ] 已執行 `supabase/migrations/202601120003_app_ai_commander_schema.sql`
- [ ] 已安裝 Node.js 和 npm

---

## 🚀 步驟 1：安裝依賴

```bash
cd worker
npm install
```

---

## 🔐 步驟 2：設定 Secrets

在 `worker` 目錄執行以下指令，**依序輸入對應的值**：

### 2.1 Supabase URL

```bash
npx wrangler secret put SUPABASE_URL
```

**輸入值：** 你的 Supabase Project URL
- 格式：`https://xxxxx.supabase.co`
- 位置：Supabase Dashboard → Settings → API → Project URL

### 2.2 Supabase Anon Key

```bash
npx wrangler secret put SUPABASE_ANON_KEY
```

**輸入值：** 你的 Supabase anon public key
- 位置：Supabase Dashboard → Settings → API → anon public key

### 2.3 Supabase Service Role Key

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

**輸入值：** 你的 Supabase service_role key
- ⚠️ **這是敏感資訊，絕對不要放在前端**
- 位置：Supabase Dashboard → Settings → API → service_role key

### 2.4 Internal API Bearer（Admin 保護）

```bash
npx wrangler secret put INTERNAL_API_BEARER
```

**輸入值：** 自訂一個強密碼（例如：`your-secret-bearer-token-here`）
- 這個用來保護 `/api/admin/*` 端點
- onboard 端點不需要這個

---

## 🚀 步驟 3：部署

```bash
npx wrangler deploy
```

部署成功後，你會看到 Worker URL，例如：
```
https://junyang-api.your-subdomain.workers.dev
```

---

## ✅ 步驟 4：測試

### 4.1 健康檢查

```bash
curl https://junyang-api.your-subdomain.workers.dev/api/health
```

應該回傳：
```json
{"ok":true,"name":"junyang-api","ts":"2025-01-12T..."}
```

### 4.2 測試 Onboard（需要 access_token）

1. **先取得 access_token**：
   - 在 Supabase Dashboard → Authentication → Users 建立測試使用者
   - 或在前端登入後取得 `session.access_token`

2. **呼叫 onboard**：

```bash
curl -X POST https://junyang-api.your-subdomain.workers.dev/api/onboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "x-app-id: ai_commander" \
  -H "Content-Type: application/json" \
  -d '{"role":"owner"}'
```

成功會回傳：
```json
{
  "ok": true,
  "app_id": "ai_commander",
  "user_id": "uuid",
  "role": "owner",
  "workspace_id": "uuid"
}
```

---

## 🔍 驗證資料庫

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
select 
  id,
  owner_id,
  name,
  created_at
from app_ai_commander.workspaces;
```

---

## 🐛 常見問題

### Q: 部署失敗？

**檢查：**
1. 是否已設定所有 secrets？
2. `wrangler.toml` 是否正確？
3. TypeScript 編譯是否通過？

### Q: onboard 回傳 401？

**檢查：**
1. access_token 是否有效？
2. access_token 是否過期？（Supabase token 預設 1 小時）
3. SUPABASE_ANON_KEY 是否正確？

### Q: onboard 回傳 500？

**檢查：**
1. SUPABASE_SERVICE_ROLE_KEY 是否正確？
2. 資料庫 schema 是否已建立？
3. 查看 Worker logs：`npx wrangler tail`

---

## 📝 下一步

完成設定後：

1. **在前端整合**：登入後自動呼叫 `/api/onboard`
2. **設定環境變數**：`VITE_API_BASE` = Worker URL
3. **測試完整流程**：登入 → onboard → 存取資料

---

## 🔗 相關文件

- `README.md` - Worker 完整說明
- `../SUPABASE_SETUP.md` - Supabase 設定
- `../supabase/NEW_APP_GUIDE.md` - 新專案建立
