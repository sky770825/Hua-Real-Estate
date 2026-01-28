# 🧠 Cursor 自動化指揮官

> **完整的自動化流程記錄與執行系統**
> 
> 當你把做好的專案建立好，把這個資料夾拉進去，讀取完畢之後就可以開始對現有專案資料夾內的所有檔案進行自動化加工。

---

## 📦 系統架構

### 核心模組 (`core/`)

- **`command-loader.mjs`** - 讀取指令資料庫和 SOP 文件
- **`project-scanner.mjs`** - 掃描專案結構和檔案
- **`automation-executor.mjs`** - 執行自動化任務
- **`commander.mjs`** - 主要指揮官類別，整合所有功能

### 執行腳本 (`scripts/`)

- **`automate.mjs`** - 主要執行入口
- **`start.mjs`** - RAG 全自動化流程（特定用途）

### 資料檔案

- **`automation_commands.json`** - 指令資料庫
- **`SOP_NOTION.md`** - Notion 標準作業頁面

---

## 🚀 快速開始（新專案）

### ✨ 最簡單的方式：直接複製整個資料夾

**所有檔案都已經統一放在 `cursor自動化指揮官` 資料夾中，直接複製即可！**

```bash
# 複製整個資料夾到你的專案（一鍵完成！）
cp -r cursor自動化指揮官 /path/to/your/project/.cursor-commander

# 進入專案目錄
cd /path/to/your/project

# 設定環境變數
cp .cursor-commander/rag/.env.example .cursor-commander/rag/.env
# 編輯 .cursor-commander/rag/.env 填入實際值

# 安裝依賴（如果需要 RAG 功能）
cd .cursor-commander/rag && npm install && cd ../..

# 測試
node .cursor-commander/scripts/automate.mjs analyze
```

**就是這麼簡單！** 一個 `cp -r` 指令就完成所有檔案的複製。

> 📖 **超簡單指南**：查看 `SIMPLE_DEPLOY.md`  
> 📖 **詳細指南**：查看 `DEPLOY.md` 了解完整步驟

### 2. 列出可用指令

```bash
node .cursor-commander/scripts/automate.mjs list
```

### 3. 執行特定指令

```bash
# 執行單一指令
node .cursor-commander/scripts/automate.mjs execute <command-id>

# 執行整個分類
node .cursor-commander/scripts/automate.mjs category <category-id>

# 自動化設定專案結構
node .cursor-commander/scripts/automate.mjs setup
```

### 4. 分析專案

```bash
node .cursor-commander/scripts/automate.mjs analyze
```

---

## 📋 命令參考

### `list` / `ls`
列出所有可用指令和分類

```bash
node automate.mjs list
```

### `execute` / `run <command-id>`
執行特定指令

```bash
node automate.mjs execute cmd-start
node automate.mjs run rag-ingest
```

### `category` / `cat <category-id>`
執行分類下的所有指令

```bash
node automate.mjs category rag-automation
node automate.mjs cat supabase-migrations
```

### `setup` / `auto`
自動化設定專案結構（根據 `file_structure`）

```bash
node automate.mjs setup
node automate.mjs auto --project /path/to/project
```

### `analyze`
顯示專案分析報告

```bash
node automate.mjs analyze
```

### `help`
顯示幫助訊息

```bash
node automate.mjs help
```

---

## 🎯 工作流程

1. **讀取指令** - 從 `automation_commands.json` 或 `SOP_NOTION.md` 載入指令
2. **掃描專案** - 分析專案結構、檔案類型、專案類型
3. **執行自動化** - 根據指令對專案檔案進行自動化加工
4. **產生報告** - 顯示執行摘要和結果

---

## 📁 專案結構範例

```
your-project/
├── .cursor-commander/          # 指揮官資料夾（從這裡複製）
│   ├── core/                   # 核心模組
│   ├── scripts/                # 執行腳本
│   ├── automation_commands.json
│   └── SOP_NOTION.md
├── package.json
├── src/
└── ...
```

---

## 🔧 開發指令資料庫

### 指令格式

在 `automation_commands.json` 中定義：

```json
{
  "commands": [
    {
      "id": "command-id",
      "category": "category-id",
      "name": "指令名稱",
      "description": "指令說明",
      "command": "實際要執行的命令",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

### 分類格式

```json
{
  "categories": [
    {
      "id": "category-id",
      "name": "分類名稱",
      "description": "分類說明"
    }
  ]
}
```

---

## 📝 資料格式

### 指令欄位

- `id` - 唯一識別碼（必填）
- `category` - 分類 ID（必填）
- `name` - 指令名稱（必填）
- `description` - 指令說明
- `command` - 實際指令內容
- `command_with_env` - 帶環境參數的指令
- `usage` - 使用方式說明
- `tags` - 標籤陣列

---

## 🧠 整合範例

### 在專案中使用

```javascript
import { Commander } from './.cursor-commander/core/commander.mjs';

const commander = new Commander('/path/to/project');
await commander.initialize();

// 列出指令
commander.listCommands();

// 執行指令
await commander.executeCommand('cmd-start');

// 自動化設定
await commander.autoSetup();
```

---

## ✅ 功能特色

- ✅ 讀取指令資料庫（JSON）
- ✅ 讀取 SOP 文件（Markdown）
- ✅ 自動掃描專案結構
- ✅ 偵測專案類型
- ✅ 執行自動化指令
- ✅ 檔案/資料夾自動建立
- ✅ 命令執行追蹤
- ✅ 錯誤處理和報告

---

## 🌐 API 快捷中心

現代化的 API 與 Token 管理網頁介面，參考 Lovable AI 設計風格：

```bash
# 開啟網頁
open web/index.html

# 或使用 HTTP 伺服器
cd web && python3 -m http.server 8000
```

**功能特色：**
- ✅ 一鍵複製環境變數名稱
- ✅ 快捷連結到各服務控制台
- ✅ 詳細的註解說明
- ✅ 現代化漸層設計
- ✅ 響應式佈局

詳見：`web/README.md`

---

## 🚀 Cloudflare Worker API

自動化 Supabase onboarding 的 Worker，讓前端登入後自動加入 app membership。

```bash
cd worker
npm install
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put INTERNAL_API_BEARER
npx wrangler deploy
```

**功能：**
- ✅ `/api/onboard` - 使用 Supabase JWT 自動 onboard
- ✅ `/api/health` - 健康檢查
- ✅ `/api/admin/*` - Admin 端點（需要 INTERNAL_API_BEARER）

> 📖 **詳細說明**：查看 `worker/README.md` 和 `worker/SETUP.md`

---

## 🏗️ Supabase 核心架構

完整的 Supabase 多專案架構設定：

```bash
# 1. 建立核心結構
# 在 Supabase SQL Editor 執行：
supabase/init_core_structure.sql

# 2. 建立第一個專案（ai_commander）
supabase/migrations/202601120003_app_ai_commander_schema.sql

# 3. 驗證設定
supabase/verify_setup.sql
```

**特色：**
- ✅ 多專案架構（一個 Supabase = 所有專案）
- ✅ 完整的 RLS 安全政策
- ✅ 可重複使用的模板
- ✅ 自動 onboarding

> 📖 **詳細說明**：查看 `SUPABASE_SETUP.md` 和 `supabase/NEW_APP_GUIDE.md`

---

## 💻 前端整合（Vite）

自動 onboard 的前端整合檔案：

```bash
# 複製檔案到你的 Vite 專案
cp -r frontend-integration/src/lib your-vite-project/src/
cp frontend-integration/env.example your-vite-project/.env.example

# 安裝依賴
cd your-vite-project
npm i @supabase/supabase-js

# 更新 main.tsx（參考 frontend-integration/src/main.tsx）
```

**特色：**
- ✅ 登入後自動 onboard
- ✅ 防止重複呼叫（使用 localStorage）
- ✅ 失敗不會卡 UI
- ✅ 自動重試機制

> 📖 **詳細說明**：查看 `frontend-integration/README.md` 和 `frontend-integration/INSTALL.md`

---

## 📚 相關文件

### 🚀 快速開始（推薦先讀）

| 檔案 | 說明 | 用途 |
|------|------|------|
| **`GETTING_STARTED.md`** | 🎯 **完整快速開始** | **⭐ 必讀！** 從零到部署的完整流程 |
| **`PROJECT_OVERVIEW.md`** | 📊 **專案總覽** | **⭐ 推薦！** 了解完整架構和流程 |
| `QUICKSTART.md` | ⚡ 快速開始指南 | 5 分鐘上手 |
| `SIMPLE_DEPLOY.md` | ✨ 超簡單部署 | 一鍵複製部署 |

### 🏗️ 設定指南

| 檔案 | 說明 | 用途 |
|------|------|------|
| `SUPABASE_SETUP.md` | 🏗️ **Supabase 設定指南** | **必讀！** 核心架構設定 |
| `TROUBLESHOOTING.md` | 🚨 **故障排除指南** | **推薦！** Storage 配置檢查、常見錯誤診斷 |
| `worker/SETUP.md` | 🚀 Worker 快速設定 | Worker 部署指南 |
| `frontend-integration/INSTALL.md` | 💻 前端整合安裝 | 前端整合詳細步驟 |
| `INTEGRATION_GUIDE.md` | 🔗 **完整整合指南** | **推薦！** 從 Supabase 到前端 |

### 📖 詳細文件

| 檔案 | 說明 | 用途 |
|------|------|------|
| `DEPLOY.md` | 🚀 新專案部署指南 | 完整部署步驟和檔案清單 |
| `CHECKLIST.md` | ✅ 部署檢查清單 | 逐步檢查，確保不遺漏 |
| `STRUCTURE.md` | 📁 專案結構說明 | 了解完整檔案組織 |
| `supabase/NEW_APP_GUIDE.md` | 📦 新專案建立指南 | 建立新 Supabase 專案 |
| `SOP_NOTION.md` | 📋 Notion SOP | 可直接複製貼到 Notion |

### 🔧 工具和資源

| 檔案 | 說明 | 用途 |
|------|------|------|
| `worker/` | 🚀 Cloudflare Worker | 自動 onboarding API |
| `frontend-integration/` | 💻 前端整合檔案 | Vite 專案自動 onboard |
| `supabase/` | 📦 Supabase 遷移檔案 | SQL 遷移和模板 |
| `web/` | 🌐 API 快捷中心 | 網頁介面，管理所有 API Key |
| `automation_commands.json` | 💾 指令資料庫 | 所有自動化指令定義 |

---

## 🎯 新專案快速部署

### 最簡單的方式（一鍵部署）

```bash
# 從指揮官目錄執行
./scripts/deploy.sh /path/to/your/project

# 然後設定環境變數
cd /path/to/your/project
cp .cursor-commander/rag/.env.example .cursor-commander/rag/.env
# 編輯 .cursor-commander/rag/.env 填入實際值

# 安裝依賴
cd .cursor-commander/rag && npm install && cd ../..

# 測試
node .cursor-commander/scripts/automate.mjs analyze
```

> 💡 **提示**：使用 `CHECKLIST.md` 確保不遺漏任何步驟！