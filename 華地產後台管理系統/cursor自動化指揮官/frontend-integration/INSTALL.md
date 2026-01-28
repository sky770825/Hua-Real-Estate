# 📦 安裝步驟

> **5 分鐘完成前端整合**

---

## ✅ 步驟 1：複製檔案

### 1.1 複製環境變數範例

```bash
# 在你的 Vite 專案根目錄
cp frontend-integration/env.example .env.example
```

### 1.2 複製 lib 檔案

```bash
# 確保 src/lib 目錄存在
mkdir -p src/lib

# 複製檔案
cp frontend-integration/src/lib/supabase.ts src/lib/
cp frontend-integration/src/lib/onboard.ts src/lib/
```

---

## ✅ 步驟 2：安裝依賴

```bash
npm i @supabase/supabase-js
```

---

## ✅ 步驟 3：設定環境變數

### 3.1 本機開發

複製 `.env.example` 為 `.env`：

```bash
cp .env.example .env
```

編輯 `.env`，填入實際值：

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE=https://junyang-api.<subdomain>.workers.dev
VITE_APP_ID=ai_commander
```

### 3.2 Cloudflare Pages

1. 進入 Cloudflare Pages → 你的專案
2. Settings → Environment Variables
3. 新增以下變數（**Production 和 Preview 都要設**）：

| 變數名稱 | 值 |
|---------|-----|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `your_anon_key` |
| `VITE_API_BASE` | `https://junyang-api.<subdomain>.workers.dev` |
| `VITE_APP_ID` | `ai_commander` |

---

## ✅ 步驟 4：更新 main.tsx

### 4.1 如果專案已有 main.tsx

在現有的 `main.tsx` 中加入 onboard 邏輯：

```tsx
// 在檔案開頭加入 import
import { supabase } from "./lib/supabase";
import { ensureOnboarded, clearOnboardCacheForUser } from "./lib/onboard";

// 在 ReactDOM.createRoot 之前加入
async function runOnboardIfLoggedIn() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    const r = await ensureOnboarded();
    if (!r.ok) console.warn("ensureOnboarded failed:", r);
  }
}

// 首次載入
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

### 4.2 如果專案沒有 main.tsx

直接複製：

```bash
cp frontend-integration/src/main.tsx src/main.tsx
```

---

## ✅ 步驟 5：驗證

### 5.1 本機測試

```bash
npm run dev
```

1. 開啟瀏覽器 Console
2. 登入你的應用
3. 檢查 Console：
   - ✅ 沒有 `ensureOnboarded failed` 訊息
   - ✅ 只會呼叫一次 `/api/onboard`

### 5.2 檢查資料庫

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

## 🐛 故障排除

### 問題 1：`Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY`

**解決：**
- 確認 `.env` 檔案存在
- 確認環境變數名稱正確（必須是 `VITE_` 開頭）
- 重啟開發伺服器

### 問題 2：`ensureOnboarded failed`

**檢查：**
1. `VITE_API_BASE` 是否正確？
2. Worker 是否已部署？
3. 檢查 Network tab，看 `/api/onboard` 的回應

### 問題 3：一直重複呼叫 `/api/onboard`

**檢查：**
1. localStorage 是否正常運作？
2. 檢查 localStorage：開啟 DevTools → Application → Local Storage
3. 應該會看到 `onboarded:ai_commander:USER_ID` = `1`

### 問題 4：Cloudflare Pages 預覽環境失敗

**解決：**
- 確認 Preview 環境變數已設定
- 重新部署預覽

---

## 📋 檢查清單

完成後確認：

- [ ] `.env` 檔案已建立並填入正確值
- [ ] `src/lib/supabase.ts` 已複製
- [ ] `src/lib/onboard.ts` 已複製
- [ ] `main.tsx` 已更新（加入 onboard 邏輯）
- [ ] `@supabase/supabase-js` 已安裝
- [ ] Cloudflare Pages 環境變數已設定（Production + Preview）
- [ ] 本機測試通過（登入後沒有錯誤）
- [ ] 資料庫檢查通過（有 membership 和 workspace 記錄）

---

## 🎯 下一步

完成整合後：

1. **測試完整流程**：登入 → onboard → 存取資料
2. **建立新專案**：參考 `../supabase/NEW_APP_GUIDE.md`
3. **開始開發功能**：使用 Supabase client 存取資料

---

**需要幫助？查看 `README.md` 或相關文件！**
