# 📊 專案總覽

> **Cursor 自動化指揮官 - 完整架構說明**

---

## 🎯 專案定位

這是一個**完整的後端架構系統**，包含：

- ✅ **Supabase** - 多專案資料庫架構
- ✅ **Cloudflare Workers** - 自動 onboarding API
- ✅ **前端整合** - Vite 專案自動 onboard
- ✅ **自動化工具** - Cursor 指令執行系統

---

## 📁 專案結構

```
cursor自動化指揮官/
│
├── 📦 核心系統
│   ├── core/                    # 自動化核心模組
│   ├── scripts/                 # 執行腳本
│   └── automation_commands.json # 指令資料庫
│
├── 🗄️ Supabase
│   ├── supabase/
│   │   ├── init_core_structure.sql          # 核心結構
│   │   ├── migrations/                      # 專案遷移檔案
│   │   ├── template_app_schema.sql          # 新專案模板
│   │   └── *.md                            # 指南文件
│   └── SUPABASE_SETUP.md                    # 設定指南
│
├── 🚀 Cloudflare Worker
│   ├── worker/
│   │   ├── src/index.ts         # Worker 主程式
│   │   ├── wrangler.toml        # 配置
│   │   └── *.md                # 指南文件
│
├── 💻 前端整合
│   ├── frontend-integration/
│   │   ├── src/lib/             # Supabase + Onboard
│   │   ├── env.example          # 環境變數範例
│   │   └── *.md                # 指南文件
│
├── 🌐 Web 工具
│   └── web/                     # API 快捷中心
│
├── 📚 文件
│   ├── README.md                # 主文件
│   ├── GETTING_STARTED.md       # 快速開始 ⭐
│   ├── INTEGRATION_GUIDE.md     # 整合指南
│   ├── SUPABASE_SETUP.md        # Supabase 設定
│   └── *.md                     # 其他文件
│
└── 🔧 其他
    ├── rag/                     # RAG 功能
    └── 執行時複製文字用.md      # 臨時文件
```

---

## 🏗️ 系統架構

### 1. Supabase（資料庫層）

```
core/                    # 核心架構
  ├── apps              # 專案註冊表
  └── app_memberships   # 使用者 × 專案關係

app_{app_id}/           # 專案專屬 schema
  ├── workspaces        # 工作空間
  ├── workflows         # 流程定義
  ├── documents         # 文件
  └── runs              # 執行紀錄

public/                 # 通用功能
  └── rag_*             # RAG 相關表
```

**特色：**
- ✅ 多專案架構（一個 Supabase = 所有專案）
- ✅ 完整的 RLS 安全政策
- ✅ 可重複使用的模板

### 2. Cloudflare Worker（API 層）

```
/api/onboard            # 自動 onboarding
/api/health             # 健康檢查
/api/admin/*            # Admin 端點
```

**特色：**
- ✅ JWT 驗證（使用 Supabase access_token）
- ✅ 自動建立 membership 和 workspace
- ✅ 不需要前端知道 service_role key

### 3. 前端整合（應用層）

```
src/lib/
  ├── supabase.ts       # Supabase client
  └── onboard.ts        # Onboard helper
```

**特色：**
- ✅ 登入後自動 onboard
- ✅ 防止重複呼叫（localStorage）
- ✅ 失敗不會卡 UI

---

## 🔄 完整流程

### 使用者登入流程

```
1. 使用者登入 Supabase
   ↓
2. 前端取得 access_token
   ↓
3. 呼叫 /api/onboard（帶 access_token）
   ↓
4. Worker 驗證 token → 取得 user_id
   ↓
5. Worker 寫入 core.app_memberships
   ↓
6. Worker 建立 default workspace（ai_commander）
   ↓
7. 前端記錄 onboard 狀態（localStorage）
   ↓
✅ 完成！使用者可以存取資料
```

---

## 📚 文件導覽

### 🚀 快速開始

- **`GETTING_STARTED.md`** ⭐ - 完整快速開始指南
- **`QUICKSTART.md`** - 5 分鐘上手
- **`SIMPLE_DEPLOY.md`** - 超簡單部署

### 🏗️ 設定指南

- **`SUPABASE_SETUP.md`** - Supabase 核心設定
- **`worker/SETUP.md`** - Worker 設定
- **`frontend-integration/INSTALL.md`** - 前端整合

### 📖 詳細指南

- **`INTEGRATION_GUIDE.md`** - 完整整合流程
- **`supabase/NEW_APP_GUIDE.md`** - 建立新專案
- **`DEPLOY.md`** - 詳細部署步驟

### 📋 參考文件

- **`CHECKLIST.md`** - 部署檢查清單
- **`STRUCTURE.md`** - 專案結構說明
- **`supabase/QUICK_REFERENCE.md`** - Supabase 快速參考

---

## 🎯 使用情境

### 情境 1：建立新專案

1. 執行 Supabase 核心設定
2. 複製 `template_app_schema.sql` 並替換變數
3. 執行 SQL 建立新專案 schema
4. 前端設定不同的 `VITE_APP_ID`
5. 登入後自動 onboard

### 情境 2：整合現有專案

1. 複製 `frontend-integration/src/lib` 到專案
2. 更新 `main.tsx` 加入 onboard 邏輯
3. 設定環境變數
4. 完成！

---

## 🔐 安全架構

### 金鑰管理

| 金鑰 | 位置 | 用途 |
|------|------|------|
| `anon key` | 前端環境變數 | Supabase 公開存取 |
| `service_role key` | Worker secrets | 後端管理操作 |
| `INTERNAL_API_BEARER` | Worker secrets | Admin 端點保護 |

### RLS 政策

所有專案都遵循：

1. **必須是 app 成員**：`core.is_app_member(app_id)`
2. **只能存取自己的資料**：`owner_id = auth.uid()`
3. **app_id 必須匹配**：`app_id = '{APP_ID}'`

---

## 🚀 部署流程

### Supabase

1. 建立 Project
2. 執行核心結構 SQL
3. 執行專案 schema SQL
4. 設定 Auth Redirect URLs

### Cloudflare Worker

1. 安裝依賴
2. 設定 secrets
3. 部署

### Cloudflare Pages

1. 連接 GitHub repo
2. 設定環境變數（Production + Preview）
3. 部署

---

## 📊 專案統計

- **Supabase Schemas**: 3+ (core, app_ai_commander, public)
- **Worker Endpoints**: 3 (/api/onboard, /api/health, /api/admin/*)
- **前端檔案**: 3 (supabase.ts, onboard.ts, main.tsx)
- **SQL 遷移檔案**: 3+
- **文件**: 20+

---

## 🎯 下一步

1. **閱讀 `GETTING_STARTED.md`** - 開始設定
2. **執行 Supabase 設定** - 建立核心架構
3. **部署 Worker** - 建立 API
4. **整合前端** - 完成自動 onboard

---

**需要幫助？查看對應的詳細文件！**
