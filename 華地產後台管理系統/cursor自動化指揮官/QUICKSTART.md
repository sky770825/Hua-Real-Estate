# ⚡ 快速開始

> 5 分鐘內開始使用 Cursor 自動化指揮官

---

## 🎯 三步驟開始

### 步驟 1: 複製到專案

```bash
# 複製整個指揮官資料夾到你的專案
cp -r cursor自動化指揮官 /path/to/your/project/.cursor-commander
```

### 步驟 2: 設定環境變數

```bash
# 進入專案目錄
cd /path/to/your/project

# 複製環境變數範例
cp .cursor-commander/rag/.env.example .cursor-commander/rag/.env

# 編輯並填入實際值
nano .cursor-commander/rag/.env
# 或
code .cursor-commander/rag/.env
```

### 步驟 3: 執行

```bash
# 分析專案
node .cursor-commander/scripts/automate.mjs analyze

# 查看可用指令
node .cursor-commander/scripts/automate.mjs list

# 自動化設定
node .cursor-commander/scripts/automate.mjs setup
```

---

## 🔥 常用命令

```bash
# 列出所有指令
node .cursor-commander/scripts/automate.mjs list

# 執行特定指令
node .cursor-commander/scripts/automate.mjs execute cmd-start

# 執行整個分類
node .cursor-commander/scripts/automate.mjs category rag-automation

# 自動化設定專案結構
node .cursor-commander/scripts/automate.mjs setup

# 分析專案結構
node .cursor-commander/scripts/automate.mjs analyze

# 顯示幫助
node .cursor-commander/scripts/automate.mjs help
```

---

## 🚀 RAG 全自動流程

```bash
# 1. 準備 JSONL 檔案
# 放到 .cursor-commander/rag/rag_export/ 目錄

# 2. 執行一鍵流程
cd /path/to/your/project
./.cursor-commander/cmd start

# 或指定環境
./.cursor-commander/cmd start --env prod
```

---

## 📋 環境變數清單

編輯 `.cursor-commander/rag/.env`，填入以下值：

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

# OpenAI Embedding
OPENAI_API_KEY=xxxx
OPENAI_EMBED_MODEL=text-embedding-3-small
```

---

## ⚠️ 常見問題

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

### Q: Node.js 版本？

```bash
# 需要 Node.js >= 18
node --version

# 如果版本過舊，使用 nvm 升級
nvm install 18
nvm use 18
```

---

## 📚 更多資訊

- 完整文件：`README.md`
- 專案結構：`STRUCTURE.md`
- Notion SOP：`SOP_NOTION.md`
