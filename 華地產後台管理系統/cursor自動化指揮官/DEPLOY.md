# 🚀 新專案部署指南

> 將 Cursor 自動化指揮官整合到新專案的完整步驟

---

## 📦 需要複製的檔案

### ✅ 方式一：完整複製整個資料夾（最簡單，推薦！）

**所有檔案都已經統一放在 `cursor自動化指揮官` 資料夾中，直接複製整個資料夾即可！**

```bash
# 複製整個指揮官資料夾到你的專案
cp -r cursor自動化指揮官 /path/to/your/project/.cursor-commander
```

**就是這麼簡單！** 一個指令就完成，包含：
- ✅ 核心模組 (`core/`)
- ✅ 執行腳本 (`scripts/`)
- ✅ RAG 管線 (`rag/`)
- ✅ Supabase migrations (`supabase/`)
- ✅ API 快捷中心網頁 (`web/`)
- ✅ 所有配置檔案和文件

### 方式二：選擇性複製（進階）

如果只需要特定功能，可以選擇性複製：

#### 1. 核心自動化系統（必備）

```bash
# 核心模組
mkdir -p .cursor-commander/core
cp -r cursor自動化指揮官/core/* .cursor-commander/core/

# 執行腳本
mkdir -p .cursor-commander/scripts
cp cursor自動化指揮官/scripts/automate.mjs .cursor-commander/scripts/
cp cursor自動化指揮官/scripts/start.mjs .cursor-commander/scripts/

# 配置檔案
cp cursor自動化指揮官/automation_commands.json .cursor-commander/
cp cursor自動化指揮官/package.json .cursor-commander/
```

#### 2. RAG 功能（如果需要）

```bash
# RAG 管線
mkdir -p .cursor-commander/rag
cp -r cursor自動化指揮官/rag/* .cursor-commander/rag/

# Supabase migrations
mkdir -p .cursor-commander/supabase/migrations
cp -r cursor自動化指揮官/supabase/migrations/* .cursor-commander/supabase/migrations/

# 一鍵入口
cp cursor自動化指揮官/cmd .cursor-commander/
chmod +x .cursor-commander/cmd
```

#### 3. 網頁介面（可選）

```bash
# API 快捷中心網頁
cp -r cursor自動化指揮官/web .cursor-commander/
```

---

## 🎯 快速部署步驟（超簡單！）

### Step 1: 複製整個資料夾（一鍵完成）

```bash
# 進入你的專案目錄
cd /path/to/your/project

# 複製整個指揮官資料夾（所有檔案都在裡面）
cp -r /path/to/cursor自動化指揮官 .cursor-commander
```

**完成！** 所有檔案都已經複製好了，包括：
- 核心系統
- RAG 功能
- Supabase migrations
- API 快捷中心網頁
- 所有配置檔案

### Step 2: 設定環境變數

```bash
# 複製環境變數範例
cp .cursor-commander/rag/.env.example .cursor-commander/rag/.env

# 編輯並填入實際值
nano .cursor-commander/rag/.env
# 或
code .cursor-commander/rag/.env
```

**必填的環境變數：**

```bash
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxx
SUPABASE_ACCESS_TOKEN=xxxx

# 雙環境設定
SUPABASE_PROJECT_REF_STAGING=xxxx
SUPABASE_DB_PASSWORD_STAGING=xxxx
SUPABASE_PROJECT_REF_PROD=xxxx
SUPABASE_DB_PASSWORD_PROD=xxxx

# OpenAI
OPENAI_API_KEY=xxxx
OPENAI_EMBED_MODEL=text-embedding-3-small
```

### Step 3: 安裝依賴（如果需要 RAG 功能）

```bash
# 安裝 RAG pipeline 依賴
cd .cursor-commander/rag
npm install
cd ../..
```

### Step 4: 初始化並測試

```bash
# 分析專案結構
node .cursor-commander/scripts/automate.mjs analyze

# 列出可用指令
node .cursor-commander/scripts/automate.mjs list

# 測試自動化設定
node .cursor-commander/scripts/automate.mjs setup
```

### Step 5: 執行 RAG 流程（如果需要）

```bash
# 準備 JSONL 檔案
# 放到 .cursor-commander/rag/rag_export/ 目錄

# 執行一鍵流程
./.cursor-commander/cmd start
```

---

## 📁 最終專案結構

```
your-project/
├── .cursor-commander/          # 指揮官資料夾
│   ├── core/                   # 核心模組
│   │   ├── command-loader.mjs
│   │   ├── project-scanner.mjs
│   │   ├── automation-executor.mjs
│   │   └── commander.mjs
│   ├── scripts/                # 執行腳本
│   │   ├── automate.mjs
│   │   └── start.mjs
│   ├── rag/                    # RAG 管線（可選）
│   │   ├── ingest.mjs
│   │   ├── query.mjs
│   │   ├── package.json
│   │   ├── .env                # 環境變數（需自行建立）
│   │   └── rag_export/         # JSONL 檔案位置
│   ├── supabase/               # Supabase migrations（可選）
│   │   └── migrations/
│   ├── web/                    # API 快捷中心（可選）
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── script.js
│   ├── automation_commands.json
│   ├── package.json
│   └── cmd                     # 一鍵入口
├── package.json                # 你的專案配置
├── src/                        # 你的專案程式碼
└── ...
```

---

## ✅ 檢查清單

部署完成後，確認以下項目：

- [ ] `.cursor-commander` 資料夾已複製
- [ ] 環境變數檔案已建立（`rag/.env`）
- [ ] 所有必要的環境變數已填入
- [ ] RAG 依賴已安裝（`npm install` in `rag/`）
- [ ] `cmd` 腳本有執行權限（`chmod +x cmd`）
- [ ] 可以執行 `node .cursor-commander/scripts/automate.mjs analyze`
- [ ] JSONL 檔案已準備（如果需要 RAG 功能）

---

## 🔧 常用命令

```bash
# 分析專案
node .cursor-commander/scripts/automate.mjs analyze

# 列出所有指令
node .cursor-commander/scripts/automate.mjs list

# 執行特定指令
node .cursor-commander/scripts/automate.mjs execute cmd-start

# 執行整個分類
node .cursor-commander/scripts/automate.mjs category rag-automation

# 自動化設定
node .cursor-commander/scripts/automate.mjs setup

# RAG 一鍵流程
./.cursor-commander/cmd start

# 開啟 API 快捷中心
open .cursor-commander/web/index.html
```

---

## 🚨 常見問題

### Q: 找不到指令檔案？

```bash
# 確認路徑
ls -la .cursor-commander/automation_commands.json

# 如果不存在，檢查是否正確複製
```

### Q: 權限錯誤？

```bash
# 給 cmd 腳本執行權限
chmod +x .cursor-commander/cmd
```

### Q: 環境變數讀取不到？

```bash
# 確認 .env 檔案位置
ls -la .cursor-commander/rag/.env

# 確認格式正確（無空格、無引號）
cat .cursor-commander/rag/.env
```

### Q: Node.js 版本？

```bash
# 需要 Node.js >= 18
node --version

# 如果版本過舊，使用 nvm 升級
nvm install 18
nvm use 18
```

---

## 📝 .gitignore 建議

在你的專案 `.gitignore` 中加入：

```gitignore
# Cursor Commander
.cursor-commander/rag/.env
.cursor-commander/rag/rag_export/*.jsonl
.cursor-commander/rag/node_modules/
```

---

## 🎉 完成！

現在你可以開始使用 Cursor 自動化指揮官了！

- 查看 `QUICKSTART.md` 快速開始
- 查看 `STRUCTURE.md` 了解完整結構
- 查看 `web/index.html` 使用 API 快捷中心
