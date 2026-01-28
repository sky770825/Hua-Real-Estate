# 遷移到 Insforge 計劃

## ✅ 已完成

1. ✅ 創建獨立的資料表（使用 `checkin_` 前綴）
   - `checkin_members` - 會員表
   - `checkin_meetings` - 會議表
   - `checkin_checkins` - 簽到記錄表
   - `checkin_prizes` - 獎品表
   - `checkin_lottery_winners` - 抽獎中獎記錄表

2. ✅ 創建專用儲存桶
   - `checkin-prizes` - 用於儲存獎品圖片

## 🔄 待完成

### 步驟 1: 安裝 Insforge SDK
```bash
npm install @insforge/sdk@latest
```

### 步驟 2: 創建 Insforge 客戶端配置
- 創建 `lib/insforge.ts` 配置文件
- 使用後端 URL: `https://dsfp4gvz.us-east.insforge.app`
- 配置匿名金鑰

### 步驟 3: 遷移資料
- 從 SQLite 導出資料
- 匯入到 Insforge PostgreSQL
- 驗證資料完整性

### 步驟 4: 更新 API 路由
- 將所有 API 路由從 SQLite 改為使用 Insforge SDK
- 更新檔案上傳邏輯使用 Insforge Storage

### 步驟 5: 測試
- 測試所有功能
- 確保資料正確遷移

## 📋 表結構對照

| SQLite 表名 | Insforge 表名 | 說明 |
|------------|--------------|------|
| `members` | `checkin_members` | 會員資料 |
| `meetings` | `checkin_meetings` | 會議資料 |
| `checkins` | `checkin_checkins` | 簽到記錄 |
| `prizes` | `checkin_prizes` | 獎品資料 |
| `lottery_winners` | `checkin_lottery_winners` | 中獎記錄 |

## 🔒 隔離保證

- ✅ 所有表使用 `checkin_` 前綴，不會與其他專案衝突
- ✅ 專用儲存桶 `checkin-prizes`，獨立於其他專案
- ✅ 完全獨立的資料結構，不影響現有專案

