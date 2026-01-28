# 🚀 前端整合指南

> **Vite 專案的自動 onboard 整合**

---

## 📋 快速開始

### 1️⃣ 複製檔案到你的 Vite 專案

```bash
# 複製環境變數範例
cp env.example ../your-vite-project/.env.example

# 複製 lib 檔案
cp -r src/lib ../your-vite-project/src/

# 更新 main.tsx（或手動合併）
# 參考 src/main.tsx 的內容
```

### 2️⃣ 安裝依賴

```bash
cd your-vite-project
npm i @supabase/supabase-js
```

### 3️⃣ 設定環境變數

複製 `.env.example` 為 `.env` 並填入實際值：

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE=https://junyang-api.<subdomain>.workers.dev
VITE_APP_ID=ai_commander
```

### 4️⃣ 更新 main.tsx

如果專案已有 `main.tsx`，合併 onboard 邏輯：

```tsx
// 在現有的 main.tsx 中加入
import { supabase } from "./lib/supabase";
import { ensureOnboarded, clearOnboardCacheForUser } from "./lib/onboard";

// 首次載入
async function runOnboardIfLoggedIn() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    const r = await ensureOnboarded();
    if (!r.ok) console.warn("ensureOnboarded failed:", r);
  }
}
runOnboardIfLoggedIn();

// 監聽登入/登出
supabase.auth.onAuthStateChange((_event, session) => {
  if (session) {
    ensureOnboarded().then((r) => {
      if (!r.ok) console.warn("ensureOnboarded failed:", r);
    });
  } else {
    const lastUserId = localStorage.getItem("last_user_id");
    if (lastUserId) clearOnboardCacheForUser(lastUserId);
  }
  if (session?.user?.id) localStorage.setItem("last_user_id", session.user.id);
});
```

---

## 📁 檔案說明

### `env.example`
環境變數範例（複製為 `.env.example` 或 `.env`），包含：
- `VITE_SUPABASE_URL` - Supabase Project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon public key
- `VITE_API_BASE` - Cloudflare Worker URL
- `VITE_APP_ID` - 專案識別碼（例如：`ai_commander`）

### `src/lib/supabase.ts`
Supabase client 設定，包含：
- 自動檢查環境變數
- Session 持久化
- 自動刷新 token

### `src/lib/onboard.ts`
Onboard helper，包含：
- ✅ **防止重複呼叫**：使用 localStorage 記錄狀態
- ✅ **錯誤處理**：失敗不會卡 UI
- ✅ **自動重試**：登入狀態變更時自動觸發

### `src/main.tsx`
App 啟動時的 onboard 邏輯：
- 首次載入時檢查並 onboard
- 監聽登入/登出狀態
- 登出時清理 cache

---

## 🔧 Cloudflare Pages 設定

在 Cloudflare Pages → Project Settings → Environment Variables 設定：

### Production 環境
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE=https://junyang-api.<subdomain>.workers.dev
VITE_APP_ID=ai_commander
```

### Preview 環境
**記得也要設定 Preview 環境變數！** 否則預覽環境會失敗。

---

## ✅ 驗證整合

### 1. 本機測試

```bash
npm run dev
```

登入後檢查 Console：
- ✅ 沒有 `ensureOnboarded failed` 訊息
- ✅ 只會呼叫一次 `/api/onboard`（之後用 cache）

### 2. 檢查資料庫

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

### 3. 測試資料存取

登入後應該可以正常查詢：

```ts
const { data, error } = await supabase
  .from('app_ai_commander.workspaces')
  .select('*');

console.log(data); // 應該看到你的 workspace
```

---

## 🐛 常見問題

### Q: Console 顯示 `ensureOnboarded failed`？

**檢查：**
1. `VITE_API_BASE` 是否正確設定？
2. Worker 是否已部署？
3. Worker secrets 是否正確設定？

### Q: 一直重複呼叫 `/api/onboard`？

**檢查：**
1. localStorage 是否正常運作？
2. `onboardKey` 是否正確生成？
3. 檢查 localStorage：`localStorage.getItem('onboarded:ai_commander:USER_ID')`

### Q: 登入後看不到資料？

**檢查：**
1. 是否已執行 onboard？（檢查 `core.app_memberships`）
2. RLS 政策是否正確？
3. `app_id` 是否匹配？

### Q: Cloudflare Pages 預覽環境失敗？

**解決：**
- 確認 Preview 環境變數已設定
- 檢查環境變數名稱是否正確（必須是 `VITE_` 開頭）

---

## 🔐 安全提醒

- ✅ `VITE_SUPABASE_ANON_KEY` 可以放在前端（這是公開的）
- ❌ `service_role key` **絕對不要**放在前端
- ✅ Worker 使用 `service_role key`（在 secrets 中）

---

## 📚 相關文件

- `../worker/README.md` - Worker API 說明
- `../worker/SETUP.md` - Worker 設定指南
- `../INTEGRATION_GUIDE.md` - 完整整合流程
- `../SUPABASE_SETUP.md` - Supabase 設定

---

## 🎯 功能特色

- ✅ **自動 onboard**：登入後自動加入 membership
- ✅ **防止重複**：使用 localStorage 避免重複呼叫
- ✅ **錯誤處理**：失敗不會卡 UI，只會 console.warn
- ✅ **自動重試**：登入狀態變更時自動觸發
- ✅ **多專案支援**：透過 `VITE_APP_ID` 區分不同專案

---

**完成整合後，你的前端就具備了自動 onboarding 功能！** 🎉
