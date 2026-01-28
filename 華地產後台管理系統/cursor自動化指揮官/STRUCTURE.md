# 📁 專案結構說明

## 目錄樹

```
cursor自動化指揮官/
├── 📄 README.md                          # 主要說明文件
├── 📄 STRUCTURE.md                       # 本檔案：專案結構說明
├── 📄 SOP_NOTION.md                      # Notion 標準作業頁面
├── 📄 package.json                       # Node.js 專案配置
├── 📄 automation_commands.json           # 指令資料庫（JSON）
├── 📄 .gitignore                         # Git 忽略檔案清單
│
├── 🔧 cmd                                # 一鍵入口腳本（可執行）
│
├── 📂 core/                              # 核心模組（自動化系統核心）
│   ├── command-loader.mjs                # 讀取指令資料庫和 SOP
│   ├── project-scanner.mjs               # 掃描專案結構
│   ├── automation-executor.mjs           # 執行自動化任務
│   └── commander.mjs                     # 主指揮官類別
│
├── 📂 scripts/                           # 執行腳本
│   ├── automate.mjs                      # 主執行入口（通用自動化）
│   └── start.mjs                         # RAG 全自動化流程（特定用途）
│
├── 📂 rag/                               # RAG 資料處理管線
│   ├── package.json                      # RAG pipeline 依賴
│   ├── ingest.mjs                        # 資料擷取和 embedding 生成
│   ├── query.mjs                         # RAG 查詢測試工具
│   └── .env.example                      # 環境變數範例（需複製為 .env）
│
└── 📂 supabase/                          # Supabase 資料庫遷移
    └── migrations/
        ├── 202601120001_rag_schema.sql      # RAG 資料表結構
        └── 202601120002_match_rag_chunks_rpc.sql  # RAG 查詢 RPC 函數
```

---

## 檔案說明

### 📄 根目錄檔案

| 檔案 | 說明 |
|------|------|
| `README.md` | 主要說明文件，包含使用方式、命令參考、整合範例 |
| `STRUCTURE.md` | 專案結構說明文件（本檔案） |
| `SOP_NOTION.md` | Notion 標準作業頁面，可直接複製貼到 Notion |
| `package.json` | Node.js 專案配置，定義專案資訊和 npm scripts |
| `automation_commands.json` | 指令資料庫，包含所有可執行指令的定義 |
| `.gitignore` | Git 忽略檔案清單 |
| `cmd` | 一鍵入口腳本（bash），執行 `./cmd start` 啟動 RAG 流程 |

### 📂 core/ - 核心模組

| 檔案 | 說明 | 功能 |
|------|------|------|
| `command-loader.mjs` | 指令載入器 | 讀取 `automation_commands.json` 和 `SOP_NOTION.md` |
| `project-scanner.mjs` | 專案掃描器 | 掃描專案結構、偵測專案類型、讀取配置檔案 |
| `automation-executor.mjs` | 自動化執行器 | 執行命令、建立檔案/資料夾、追蹤執行狀態 |
| `commander.mjs` | 主指揮官類別 | 整合所有核心功能，提供統一的 API |

### 📂 scripts/ - 執行腳本

| 檔案 | 說明 | 用途 |
|------|------|------|
| `automate.mjs` | 通用自動化執行器 | 主執行入口，支援 list/execute/category/setup/analyze 命令 |
| `start.mjs` | RAG 全自動化流程 | 特定用途：執行完整的 RAG pipeline（DB push → ingest → test） |

### 📂 rag/ - RAG 資料處理

| 檔案 | 說明 |
|------|------|
| `package.json` | RAG pipeline 的依賴套件（@supabase/supabase-js, dotenv） |
| `ingest.mjs` | 讀取 JSONL 檔案，產生 embeddings，upsert 到 Supabase |
| `query.mjs` | RAG 查詢測試工具，執行向量相似度搜尋 |
| `.env.example` | 環境變數範例，需複製為 `.env` 並填入實際值 |

### 📂 supabase/ - 資料庫遷移

| 檔案 | 說明 |
|------|------|
| `migrations/202601120001_rag_schema.sql` | RAG 資料表結構（rag_documents, rag_chunks, indexes） |
| `migrations/202601120002_match_rag_chunks_rpc.sql` | RAG 查詢 RPC 函數（向量相似度搜尋） |

---

## 使用流程

### 1️⃣ 首次設定

```bash
# 1. 複製整個資料夾到專案
cp -r cursor自動化指揮官 /path/to/project/.cursor-commander

# 2. 進入專案目錄
cd /path/to/project

# 3. 設定環境變數（複製範例並填入實際值）
cp .cursor-commander/rag/.env.example .cursor-commander/rag/.env
# 編輯 .cursor-commander/rag/.env
```

### 2️⃣ 日常使用

```bash
# 分析專案
node .cursor-commander/scripts/automate.mjs analyze

# 列出可用指令
node .cursor-commander/scripts/automate.mjs list

# 執行自動化設定
node .cursor-commander/scripts/automate.mjs setup

# 執行特定指令
node .cursor-commander/scripts/automate.mjs execute cmd-start

# 執行整個分類
node .cursor-commander/scripts/automate.mjs category rag-automation
```

### 3️⃣ RAG 流程（特定用途）

```bash
# 準備 JSONL 檔案
# 放到 rag/rag_export/ 目錄

# 執行一鍵流程
./.cursor-commander/cmd start
```

---

## 資料流向

```
automation_commands.json / SOP_NOTION.md
         ↓
    command-loader.mjs
         ↓
    commander.mjs
         ↓
project-scanner.mjs (掃描專案)
         ↓
automation-executor.mjs (執行任務)
         ↓
      執行結果
```

---

## 擴充指南

### 新增指令

編輯 `automation_commands.json`，在 `commands` 陣列中加入新指令：

```json
{
  "id": "new-command-id",
  "category": "category-id",
  "name": "指令名稱",
  "description": "指令說明",
  "command": "要執行的命令",
  "tags": ["tag1", "tag2"]
}
```

### 新增分類

編輯 `automation_commands.json`，在 `categories` 陣列中加入新分類：

```json
{
  "id": "new-category-id",
  "name": "分類名稱",
  "description": "分類說明"
}
```

### 自訂自動化流程

1. 在 `core/automation-executor.mjs` 中擴充執行邏輯
2. 在 `scripts/automate.mjs` 中加入新命令
3. 在 `commander.mjs` 中整合新功能

---

## 注意事項

- ⚠️ `.env` 檔案包含敏感資訊，**不要提交到 Git**
- ⚠️ `rag/rag_export/*.jsonl` 是範例資料，實際使用時需自行準備
- ✅ 所有 `.mjs` 檔案使用 ES6 modules，需 Node.js >= 18
- ✅ `cmd` 腳本需有執行權限：`chmod +x cmd`
