# ⚡ 快速開始（3 步驟）

> **最簡單的整合方式**

---

## 1️⃣ 複製檔案

```bash
# 在你的 Vite 專案根目錄執行
cp -r frontend-integration/src/lib src/
cp frontend-integration/env.example .env.example
```

---

## 2️⃣ 安裝依賴 + 設定環境變數

```bash
# 安裝
npm i @supabase/supabase-js

# 複製環境變數範例
cp .env.example .env

# 編輯 .env，填入實際值
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
# VITE_API_BASE=...
# VITE_APP_ID=ai_commander
```

---

## 3️⃣ 更新 main.tsx

在 `src/main.tsx` 中加入：

```tsx
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

## ✅ 完成！

現在登入後會自動 onboard，不需要手動處理。

**詳細說明：** 查看 `README.md` 和 `INSTALL.md`
