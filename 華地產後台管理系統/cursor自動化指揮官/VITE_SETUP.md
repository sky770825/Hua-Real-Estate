# 🚀 Vite 前端專案設定指南

> 已整合 Supabase 登入與自動 onboard 功能

## 📁 已建立的檔案

```
專案根目錄/
├── env.example              # 環境變數範例（複製為 .env）
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
├── tsconfig.node.json       # Node.js TypeScript 配置
├── index.html              # HTML 入口
├── package.json            # 已更新，包含 Vite 和 React 依賴
└── src/
    ├── main.tsx            # App 入口，已整合自動 onboard
    ├── App.tsx              # 基本 App 組件
    └── lib/
        ├── supabase.ts     # Supabase client
        └── onboard.ts      # Onboard helper（不會重複呼叫）
```

## 🎯 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

```bash
# 複製環境變數範例
cp env.example .env

# 編輯 .env，填入實際值
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=your_anon_key
# VITE_API_BASE=https://junyang-api.<subdomain>.workers.dev
# VITE_APP_ID=ai_commander
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

## ✨ 功能特色

### ✅ 自動 Onboard
- 登入後自動觸發 onboard
- 使用 `localStorage` 記錄狀態，**不會重複呼叫**
- 失敗也不會卡 UI（只會在 console 警告）

### ✅ 登入狀態監聽
- 自動監聽 Supabase auth 狀態變化
- 登入時自動 onboard
- 登出時清理 cache

### ✅ 環境變數驗證
- 啟動時會檢查必要的環境變數
- 缺少時會在 console 顯示警告

## 🔧 Cloudflare Pages 部署

在 Cloudflare Pages 的 **Project Settings → Environment Variables** 設定：

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE=https://junyang-api.<subdomain>.workers.dev
VITE_APP_ID=ai_commander
```

**重要**：記得在 **Preview** 和 **Production** 環境都設定！

## 📝 驗證成功

1. 啟動開發伺服器：`npm run dev`
2. 登入後查看 Console：
   - 正常情況：不會一直打 `/api/onboard`（只第一次）
   - 若有 `ensureOnboarded failed` 才需要查
3. 檢查 Supabase 資料：
   - `core.app_memberships` 應該會有你的 `user_id + ai_commander`
   - `app_ai_commander.workspaces` 應該會有 Default Workspace

## ⚠️ 常見問題

### VITE_API_BASE 少了
- onboard 會失敗（console 會警告）
- 檢查 `.env` 和 Cloudflare Pages 環境變數

### Worker 沒設 SUPABASE_ANON_KEY
- token 驗證會失敗
- 檢查 Worker 的環境變數設定

### Supabase 沒建立 app_ai_commander schema
- 建 workspace 會失敗
- 執行第 1 套 SQL migration 即可

### Cloudflare Pages 的 env 沒設到 Preview
- 預覽環境登入會壞
- 記得 Preview/Production 都設

## 🎨 自訂 App.tsx

目前的 `App.tsx` 是基本範例，你可以：
- 加入 Supabase Auth UI 組件
- 加入你的路由系統
- 加入其他功能

所有 onboard 邏輯已經在 `main.tsx` 處理，不需要在 `App.tsx` 中重複。
