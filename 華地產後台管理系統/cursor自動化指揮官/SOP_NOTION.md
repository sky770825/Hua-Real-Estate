# 🧠 Cursor 指揮官｜RAG 全自動化 SOP（1536）

> **用途**
> 當我把資料檔案（JSONL）與程式碼放進 Cursor 專案後，只需要 **一行指令**，即可自動完成：
> **資料庫建表 → SQL/RPC 套用 → Embedding → Upsert → 查詢驗證**

---

## 🎯 最終指令（唯一要記的）

```bash
./cmd start
```

* 在 `develop` 分支 → 自動對應 **staging**
* 在 `main` 分支 → 自動對應 **production**
* 可強制指定：

```bash
./cmd start --env prod
```

---

## 📦 專案必要結構（Cursor Repo）

```text
cmd
scripts/
  start.mjs
rag/
  ingest.mjs
  query.mjs
  package.json
  .env.example
  prompts/
    system_prompt.md
  rag_export/
    rag_documents.jsonl
    rag_chunks.jsonl
supabase/
  migrations/
    202601120001_rag_schema.sql
    202601120002_match_rag_chunks_rpc.sql
```

---

## ✅ 一鍵指揮官會自動做的事

* [x] 偵測目前 Git branch（develop / main）
* [x] 對應 Supabase 環境（staging / prod）
* [x] 使用 **Supabase CLI**

  * `supabase link`
  * `supabase db push`
* [x] 建立：

  * `rag_documents`
  * `rag_chunks`
  * `vector(1536)` index
  * `match_rag_chunks` RPC
* [x] 讀取 JSONL
* [x] 產生 **1536 維 embedding**
* [x] Upsert 至 Supabase
* [x] 執行一次 Smoke Test Query

---

## 🔐 環境變數（放在 `rag/.env`）

> ⚠️ **不要 commit**

```bash
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxx
SUPABASE_ACCESS_TOKEN=xxxx

# Dual Env
SUPABASE_PROJECT_REF_STAGING=xxxx
SUPABASE_DB_PASSWORD_STAGING=xxxx

SUPABASE_PROJECT_REF_PROD=xxxx
SUPABASE_DB_PASSWORD_PROD=xxxx

# OpenAI Embedding
OPENAI_API_KEY=xxxx
OPENAI_EMBED_MODEL=text-embedding-3-small
```

---

## 🧩 RAG 資料來源（你只要準備這兩個）

放到：

```text
rag/rag_export/
```

### 1️⃣ `rag_documents.jsonl`

* 主題級知識文件
* 已整理過、非原始聊天
* 一行一個 document

### 2️⃣ `rag_chunks.jsonl`

* Chunk 級檢索單位
* 含 metadata：

  * `stack: vite`
  * `env_strategy: dual`
  * `topic`
* **不含 embedding（由指揮官產生）**

---

## 🗄️ 資料庫 Schema（1536 向量）

### Tables

* `rag_documents`
* `rag_chunks (embedding vector(1536))`

### Index

* HNSW cosine index
* GIN(metadata)
* FTS(content)

---

## 🔍 RAG Query（系統內部使用）

```sql
select *
from match_rag_chunks(
  query_embedding := :embedding,
  match_count := 8,
  stack_filter := 'vite',
  env_strategy_filter := 'dual'
);
```

---

## 🧠 GPT 專屬 System Prompt（摘要）

> 角色：
> **Lovable × Vite × Supabase × Cloudflare × RAG 工程助理**

回答規則：

1. 只根據 RAG chunks 回答
2. 不猜、不補、不 hallucinate
3. 固定輸出結構：

   * 架構規劃
   * 代碼
   * 測試
   * 優化
4. 不輸出任何明文 token
5. Vite 一律用 `VITE_*`
6. DB 變更只走 migrations

---

## 🧪 驗證方式（你只需看這一行）

```bash
./cmd start
```

看到：

* `supabase db push` 成功
* `upserted chunks`
* `Smoke test query` 有結果
  👉 **代表整套 RAG Pipeline 可用**

---

## 🧠 使用情境（未來）

* Lovable 專案 SOP 問答
* DevOps / Supabase / Cloudflare 教學 AI
* Cursor 內部工程助理
* 團隊內部知識庫 GPT

---

## 🔁 後續擴充（Optional）

* [ ] `--mode ingest-only`
* [ ] reranker（cross-encoder）
* [ ] multi-collection（多專案）
* [ ] citation（chunk 引用標記）
* [ ] 接回 Web / Slack / Discord

---

## ✅ 結論（一句話）

> **這是一套「把 Cursor 變成會自己跑的 AI 工程指揮官」的標準作業頁。**
