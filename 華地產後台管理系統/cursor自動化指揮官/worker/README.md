# 🚀 Cloudflare Worker API

> **自動化 Supabase onboarding 的 Worker**

---

## 📋 功能

- ✅ `/api/onboard` - 使用 Supabase JWT 自動 onboard 使用者
- ✅ `/api/health` - 健康檢查
- ✅ `/api/admin/sql` - Admin 端點範例（需要 INTERNAL_API_BEARER）

---

## 🚀 快速開始

### 1️⃣ 安裝依賴

```bash
cd worker
npm install
```

### 2️⃣ 設定 Secrets

在 `worker` 目錄執行：

```bash
# Supabase 設定
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# Admin 保護（只給 /api/admin/* 用）
npx wrangler secret put INTERNAL_API_BEARER
```

> 💡 **提示**：這些值可以在 Supabase Dashboard → API 中找到

### 3️⃣ 部署

```bash
npx wrangler deploy
```

---

## 📝 API 說明

### POST `/api/onboard`

自動 onboard 使用者到指定 app。

**Headers:**
- `Authorization: Bearer <supabase_access_token>` ⭐ **必填**
- `x-app-id: <app_id>` （可選，預設 `ai_commander`）

**Body (可選):**
```json
{
  "app_id": "ai_commander",
  "role": "member"
}
```

**行為：**
1. 驗證 Supabase access_token → 取得 `user_id`
2. 確保 app 存在（upsert `core.apps`）
3. 加入 membership（upsert `core.app_memberships`）
4. 如果是 `ai_commander`：建立 default workspace

**回應：**
```json
{
  "ok": true,
  "app_id": "ai_commander",
  "user_id": "uuid",
  "role": "member",
  "workspace_id": "uuid" // 只有 ai_commander 會有
}
```

---

### GET `/api/health`

健康檢查端點。

**回應：**
```json
{
  "ok": true,
  "name": "junyang-api",
  "ts": "2025-01-12T..."
}
```

---

### POST `/api/admin/sql`

Admin 端點範例（需要 `INTERNAL_API_BEARER`）。

**Headers:**
- `Authorization: Bearer <INTERNAL_API_BEARER>`

---

## 🧪 測試

### 1. curl 測試

```bash
# 先取得 access_token（從 Supabase 登入後取得）
curl -X POST https://junyang-api.<subdomain>.workers.dev/api/onboard \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "x-app-id: ai_commander" \
  -H "Content-Type: application/json" \
  -d '{"role":"owner"}'
```

### 2. 前端使用

```js
// 在登入後自動 onboard
const session = (await supabase.auth.getSession()).data.session;
const accessToken = session?.access_token;

const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/onboard`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
    "x-app-id": import.meta.env.VITE_APP_ID, // 例如 ai_commander
  },
  body: JSON.stringify({ role: "member" }),
});

const data = await response.json();
console.log(data); // { ok: true, user_id, workspace_id, ... }
```

---

## 🔐 安全說明

### JWT 驗證流程

1. 前端使用 Supabase 登入，取得 `access_token`
2. 前端呼叫 `/api/onboard`，帶上 `access_token`
3. Worker 使用 Supabase Auth API 驗證 token
4. 驗證成功後，使用 `service_role` key 寫入資料庫

### 為什麼這樣設計？

- ✅ **前端不需要知道 service_role key**（安全）
- ✅ **使用 Supabase 官方 API 驗證**（避免 JWT 算法差異）
- ✅ **自動化 onboarding**（不需要手動 SQL）

---

## 📁 檔案結構

```
worker/
├── src/
│   └── index.ts          # Worker 主程式
├── wrangler.toml         # Wrangler 配置
├── package.json          # 依賴管理
└── README.md            # 本文件
```

---

## 🔧 開發

### 本地開發

```bash
npx wrangler dev
```

### 查看 Logs

```bash
npx wrangler tail
```

### 更新 Secret

```bash
npx wrangler secret put SECRET_NAME
```

---

## ⚠️ 注意事項

1. **service_role key 絕對不要放在前端**
2. **INTERNAL_API_BEARER 只給 admin 端點用**
3. **onboard 端點使用 JWT，不需要 INTERNAL_API_BEARER**

---

## 🎯 多專案使用

每個前端專案只需要：

1. 設定不同的 `VITE_APP_ID`
2. 登入後呼叫一次 `/api/onboard`
3. 使用者會自動加入對應 app 的 membership

**就是這麼簡單！** 🎉

---

## 📚 相關文件

- `../SUPABASE_SETUP.md` - Supabase 核心設定
- `../supabase/NEW_APP_GUIDE.md` - 新專案建立指南
