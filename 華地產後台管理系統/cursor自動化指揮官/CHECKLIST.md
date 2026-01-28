# ✅ 新專案檢查清單

> 部署 Cursor 自動化指揮官到新專案的完整檢查清單

---

## 📦 部署前準備

- [ ] 確認目標專案目錄路徑
- [ ] 確認有 Node.js >= 18
- [ ] 確認有 Git（如果需要版本控制）

---

## 🚀 部署步驟

### Step 1: 複製檔案

- [ ] 執行部署腳本：`./scripts/deploy.sh /path/to/project`
- [ ] 或手動複製：`cp -r cursor自動化指揮官 /path/to/project/.cursor-commander`
- [ ] 確認 `.cursor-commander` 資料夾已建立

### Step 2: 設定環境變數

- [ ] 複製環境變數範例：`cp .cursor-commander/rag/.env.example .cursor-commander/rag/.env`
- [ ] 填入 Supabase 設定：
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `SUPABASE_ACCESS_TOKEN`
  - [ ] `SUPABASE_PROJECT_REF_STAGING`
  - [ ] `SUPABASE_DB_PASSWORD_STAGING`
  - [ ] `SUPABASE_PROJECT_REF_PROD`
  - [ ] `SUPABASE_DB_PASSWORD_PROD`
- [ ] 填入 OpenAI 設定：
  - [ ] `OPENAI_API_KEY`
  - [ ] `OPENAI_EMBED_MODEL` (預設: text-embedding-3-small)
- [ ] 確認所有環境變數格式正確（無多餘空格、引號）

### Step 3: 安裝依賴

- [ ] 進入 RAG 目錄：`cd .cursor-commander/rag`
- [ ] 安裝依賴：`npm install`
- [ ] 確認安裝成功

### Step 4: 權限設定

- [ ] 給 `cmd` 腳本執行權限：`chmod +x .cursor-commander/cmd`
- [ ] 確認可以執行：`ls -la .cursor-commander/cmd`

### Step 5: 測試

- [ ] 執行分析：`node .cursor-commander/scripts/automate.mjs analyze`
- [ ] 列出指令：`node .cursor-commander/scripts/automate.mjs list`
- [ ] 測試自動化設定：`node .cursor-commander/scripts/automate.mjs setup`

---

## 🎯 RAG 功能設定（可選）

### 準備資料

- [ ] 準備 `rag_documents.jsonl` 檔案
- [ ] 準備 `rag_chunks.jsonl` 檔案
- [ ] 將檔案放到 `.cursor-commander/rag/rag_export/` 目錄

### 測試 RAG 流程

- [ ] 執行一鍵流程：`./.cursor-commander/cmd start`
- [ ] 確認 Supabase migrations 已套用
- [ ] 確認 embeddings 已生成並 upsert
- [ ] 確認 smoke test 查詢成功

---

## 🌐 網頁介面（可選）

- [ ] 開啟 API 快捷中心：`open .cursor-commander/web/index.html`
- [ ] 或使用 HTTP 伺服器：`cd .cursor-commander/web && python3 -m http.server 8000`
- [ ] 測試複製功能
- [ ] 確認所有連結正常

---

## 🔒 安全性檢查

- [ ] `.env` 檔案已加入 `.gitignore`
- [ ] 確認 `.env` 不會被提交到 Git
- [ ] 確認敏感資訊不會出現在程式碼中
- [ ] 檢查 `.cursor-commander/rag/.env` 不在版本控制中

---

## 📝 專案整合

### Git 設定

- [ ] 在專案 `.gitignore` 中加入：
  ```gitignore
  .cursor-commander/rag/.env
  .cursor-commander/rag/rag_export/*.jsonl
  .cursor-commander/rag/node_modules/
  ```

### 專案文件

- [ ] 在專案 README 中說明如何使用指揮官
- [ ] 記錄必要的環境變數
- [ ] 說明部署流程

---

## 🎉 完成確認

- [ ] 所有測試通過
- [ ] 環境變數已正確設定
- [ ] 可以正常執行自動化指令
- [ ] 文件已更新
- [ ] 團隊成員知道如何使用

---

## 🆘 遇到問題？

查看以下文件：
- `DEPLOY.md` - 完整部署指南
- `QUICKSTART.md` - 快速開始
- `README.md` - 主要文件
- `web/index.html` - API 快捷中心（查看所有 API 取得位置）

---

## 📊 部署後檢查

執行以下命令確認一切正常：

```bash
# 檢查檔案結構
ls -la .cursor-commander/

# 檢查環境變數
cat .cursor-commander/rag/.env | grep -v "^#" | grep -v "^$"

# 測試自動化系統
node .cursor-commander/scripts/automate.mjs analyze

# 測試 RAG（如果有資料）
./.cursor-commander/cmd start
```

---

**完成所有項目後，你的 Cursor 自動化指揮官就準備好了！** 🎊
