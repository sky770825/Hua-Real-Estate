# 🔗 完整整合指南

> **從 Supabase 設定到前端整合的完整流程**

---

## 📋 完整流程圖

```
1. Supabase 核心設定
   ↓
2. 建立第一個專案 Schema
   ↓
3. 部署 Cloudflare Worker
   ↓
4. 前端整合
   ↓
✅ 完成！
```

---

## 🏗️ 步驟 1：Supabase 核心設定

### 1.1 執行核心結構 SQL

在 Supabase SQL Editor 執行：

```sql
-- 檔案：supabase/init_core_structure.sql
-- 建立 core schema、apps 表、app_memberships 表
```

### 1.2 驗證設定

```sql
-- 檔案：supabase/verify_setup.sql
-- 確認所有結構都正確建立
```

### 1.3 記錄重要資訊

在 Supabase Dashboard → Settings → API 記下：

- `Project URL` → 例如：`https://xxxxx.supabase.co`
- `anon public key` → 用於前端
- `service_role key` → ⚠️ **只給 Worker 用，絕對不要放前端**

---

## 📦 步驟 2：建立第一個專案 Schema

### 2.1 執行 AI 指揮官 Schema

在 Supabase SQL Editor 執行：

```sql
-- 檔案：supabase/migrations/202601120003_app_ai_commander_schema.sql
-- 建立 app_ai_commander schema 和所有表
```

### 2.2 驗證

```sql
-- 檢查表是否建立
select table_name
from information_schema.tables
where table_schema = 'app_ai_commander';
```

---

## 🚀 步驟 3：部署 Cloudflare Worker

### 3.1 安裝依賴

```bash
cd worker
npm install
```

### 3.2 設定 Secrets

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

### 3.3 部署

```bash
npx wrangler deploy
```

### 3.4 記錄 Worker URL

部署成功後會顯示 Worker URL，例如：
```
https://junyang-api.your-subdomain.workers.dev
```

---

## 💻 步驟 4：前端整合

### 4.1 設定環境變數

在 `.env` 或 Cloudflare Pages 環境變數中設定：

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_APP_ID=ai_commander
VITE_API_BASE=https://junyang-api.your-subdomain.workers.dev
```

### 4.2 登入後自動 Onboard

在登入成功後呼叫：

```js
// 取得 session
const { data: { session } } = await supabase.auth.getSession();

if (session?.access_token) {
  // 自動 onboard
  const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/onboard`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
      "x-app-id": import.meta.env.VITE_APP_ID,
    },
    body: JSON.stringify({ role: "member" }),
  });

  const data = await response.json();
  
  if (data.ok) {
    console.log("Onboard 成功！", data);
    // data.user_id, data.workspace_id 等
  } else {
    console.error("Onboard 失敗：", data);
  }
}
```

### 4.3 完整範例（React）

```jsx
import { useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

function useAutoOnboard() {
  const supabase = useSupabaseClient();

  useEffect(() => {
    const handleOnboard = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/onboard`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "x-app-id": import.meta.env.VITE_APP_ID,
          },
          body: JSON.stringify({ role: "member" }),
        });

        const data = await response.json();
        
        if (data.ok) {
          console.log("✅ Onboard 成功", data);
        } else {
          console.error("❌ Onboard 失敗", data);
        }
      } catch (error) {
        console.error("Onboard 錯誤", error);
      }
    };

    // 監聽 auth 狀態變化
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        handleOnboard();
      }
    });

    // 如果已經登入，立即 onboard
    handleOnboard();
  }, [supabase]);
}

// 在 App 中使用
function App() {
  useAutoOnboard();
  // ...
}
```

---

## ✅ 驗證整合

### 1. 檢查資料庫

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

### 2. 測試前端存取

登入後，應該可以正常存取資料：

```js
// 應該可以正常查詢
const { data, error } = await supabase
  .from('app_ai_commander.workspaces')
  .select('*');

console.log(data); // 應該看到你的 workspace
```

---

## 🎯 多專案使用

### 建立新專案

1. **複製模板**：
   ```bash
   cp supabase/template_app_schema.sql supabase/migrations/app_{app_id}_schema.sql
   ```

2. **替換變數**：
   - `{APP_ID}` → 實際 app_id
   - `{SCHEMA_NAME}` → `app_{app_id}`
   - `{PREFIX}` → 簡短前綴

3. **執行 SQL**：在 Supabase SQL Editor 執行

4. **前端設定**：設定不同的 `VITE_APP_ID`

5. **自動 Onboard**：登入後呼叫 `/api/onboard`，Worker 會自動處理

---

## 🔐 安全檢查清單

- [ ] `service_role key` 只存在 Worker secrets，**不在前端**
- [ ] `INTERNAL_API_BEARER` 只給 admin 端點用
- [ ] 前端只使用 `anon key`
- [ ] RLS 政策已正確設定
- [ ] 所有表都有 `app_id` 和 `owner_id` 欄位

---

## 🐛 常見問題

### Q: Onboard 回傳 401？

**可能原因：**
1. access_token 無效或過期
2. SUPABASE_ANON_KEY 設定錯誤

**解決：**
- 確認 token 是否有效
- 檢查 Worker secrets 是否正確

### Q: Onboard 回傳 500？

**可能原因：**
1. SUPABASE_SERVICE_ROLE_KEY 錯誤
2. Schema 未建立
3. RLS 政策問題

**解決：**
- 檢查 Worker logs：`npx wrangler tail`
- 確認 schema 已建立
- 檢查資料庫權限

### Q: 前端看不到資料？

**可能原因：**
1. 未執行 onboard
2. RLS 政策不正確
3. app_id 不匹配

**解決：**
- 確認已執行 onboard
- 檢查 `core.app_memberships` 是否有記錄
- 確認 RLS 政策中的 `app_id` 正確

---

## 📚 相關文件

- `SUPABASE_SETUP.md` - Supabase 核心設定
- `supabase/NEW_APP_GUIDE.md` - 新專案建立指南
- `worker/README.md` - Worker 完整說明
- `worker/SETUP.md` - Worker 快速設定

---

**完成整合後，你的系統就具備了：**
- ✅ 多專案架構
- ✅ 自動 onboarding
- ✅ 完整安全政策
- ✅ 可擴展的基礎

**現在可以開始建立功能了！** 🎉
