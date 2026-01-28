# 📋 Estate Attendance 資料庫設置指南

## 🎯 概述

本文檔說明如何為 `estate_attendance` 專案設置完整的資料庫結構。

## 📊 需要建立的資料表

### 1. 會員表 (estate_attendance_members)
- `id` (INTEGER PRIMARY KEY) - 會員編號
- `name` (TEXT NOT NULL) - 會員姓名
- `profession` (TEXT) - 專業別
- `created_at` (TIMESTAMP) - 建立時間
- `updated_at` (TIMESTAMP) - 更新時間

### 2. 會議表 (estate_attendance_meetings)
- `id` (SERIAL PRIMARY KEY) - 會議 ID
- `date` (DATE NOT NULL UNIQUE) - 會議日期
- `status` (TEXT NOT NULL) - 會議狀態 (scheduled/completed/cancelled)
- `created_at` (TIMESTAMP) - 建立時間
- `updated_at` (TIMESTAMP) - 更新時間

### 3. 簽到記錄表 (estate_attendance_checkins)
- `id` (SERIAL PRIMARY KEY) - 簽到記錄 ID
- `member_id` (INTEGER NOT NULL) - 會員編號 (外鍵 → members.id)
- `meeting_date` (DATE NOT NULL) - 會議日期
- `checkin_time` (TIMESTAMP NOT NULL) - 簽到時間
- `message` (TEXT) - 留言
- `status` (TEXT NOT NULL) - 出席狀態 (present/early/late/early_leave/absent)
- `created_at` (TIMESTAMP) - 建立時間
- `updated_at` (TIMESTAMP) - 更新時間
- **唯一約束**: (member_id, meeting_date) - 每個會員每天只能有一筆簽到記錄

### 4. 獎品表 (estate_attendance_prizes)
- `id` (SERIAL PRIMARY KEY) - 獎品 ID
- `name` (TEXT NOT NULL) - 獎品名稱
- `image_url` (TEXT) - 圖片 URL
- `total_quantity` (INTEGER NOT NULL) - 總數量
- `remaining_quantity` (INTEGER NOT NULL) - 剩餘數量
- `probability` (DECIMAL(5,2) NOT NULL) - 中獎機率 (0-100)
- `created_at` (TIMESTAMP) - 建立時間
- `updated_at` (TIMESTAMP) - 更新時間

### 5. 中獎記錄表 (estate_attendance_lottery_winners)
- `id` (SERIAL PRIMARY KEY) - 中獎記錄 ID
- `meeting_date` (DATE NOT NULL) - 會議日期
- `member_id` (INTEGER NOT NULL) - 會員編號 (外鍵 → members.id)
- `prize_id` (INTEGER NOT NULL) - 獎品 ID (外鍵 → prizes.id)
- `created_at` (TIMESTAMP) - 建立時間

## 🗄️ 儲存桶設置

根據您的 Supabase 儲存桶 URL，您需要創建以下儲存桶：

- **儲存桶名稱**: `estate_attendance` 或 `estate-attendance-prizes`
- **用途**: 儲存獎品圖片
- **權限**: 公開讀取（Public）

**注意**: 如果您的儲存桶名稱是 `estate_attendance`，請更新 `lib/insforge.ts` 中的 `BUCKETS.PRIZES` 值。

## 📝 執行 SQL 腳本

### 方法 1: 使用 Supabase SQL Editor

1. 登入 Supabase Dashboard
2. 進入 SQL Editor
3. 複製 `create_estate_attendance_tables.sql` 的內容
4. 貼上並執行

### 方法 2: 使用 psql 命令列

```bash
psql -h your-database-host -U your-username -d your-database -f create_estate_attendance_tables.sql
```

### 方法 3: 使用 Insforge Dashboard

如果您使用 Insforge，可以在 SQL Editor 中執行相同的 SQL 腳本。

## ✅ 驗證設置

執行以下 SQL 查詢來驗證所有表是否已正確建立：

```sql
-- 檢查所有表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'estate_attendance_%'
ORDER BY table_name;

-- 應該看到以下表：
-- estate_attendance_checkins
-- estate_attendance_lottery_winners
-- estate_attendance_members
-- estate_attendance_meetings
-- estate_attendance_prizes
```

## 🔗 外鍵關係

- `checkins.member_id` → `members.id` (ON DELETE CASCADE)
- `lottery_winners.member_id` → `members.id` (ON DELETE CASCADE)
- `lottery_winners.prize_id` → `prizes.id` (ON DELETE CASCADE)

## 📌 索引

已自動建立以下索引以提升查詢效能：
- `idx_checkins_member_id` - 簽到記錄的會員索引
- `idx_checkins_meeting_date` - 簽到記錄的日期索引
- `idx_lottery_winners_meeting_date` - 中獎記錄的日期索引
- `idx_lottery_winners_member_id` - 中獎記錄的會員索引
- `idx_meetings_date` - 會議的日期索引

## 🚀 下一步

1. ✅ 執行 SQL 腳本建立所有表
2. ✅ 創建儲存桶（如果尚未創建）
3. ✅ 驗證表結構
4. ✅ 測試應用程式功能
