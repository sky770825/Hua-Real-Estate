# 🚨 匯入沒看到資料 - 快速修復

## 問題原因

從錯誤訊息看到：
```
relation "public.estate_attendance_members" does not exist
```

**資料庫表還沒有建立！** 所以匯入的資料無法寫入。

## ✅ 解決方案

### 步驟 1：在 Supabase 建立資料表（必須先做！）

1. **登入 Supabase Dashboard**
   - https://supabase.com/dashboard
   - 選擇您的專案

2. **打開 SQL Editor**
   - 左側選單 → "SQL Editor"
   - 點擊 "New query"

3. **執行 SQL 腳本**
   - 打開檔案：`create_estate_attendance_tables.sql`
   - **複製全部內容**（102 行）
   - 貼上到 SQL Editor
   - 點擊右上角 "Run" 按鈕執行

4. **確認執行成功**
   - 應該看到訊息：`所有 estate_attendance 資料表已成功建立！`

### 步驟 2：驗證表已建立

執行驗證查詢：
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'estate_attendance_%'
ORDER BY table_name;
```

**應該看到 5 個表：**
- ✅ estate_attendance_checkins
- ✅ estate_attendance_lottery_winners
- ✅ estate_attendance_members
- ✅ estate_attendance_meetings
- ✅ estate_attendance_prizes

### 步驟 3：重新匯入會員資料

1. **重新整理後台頁面**
   - 訪問：http://localhost:3001/admin/attendance_management
   - 按 `Cmd+R` 或 `F5` 重新整理

2. **再次匯入 CSV**
   - 切換到「會員管理」標籤
   - 點擊「📤 匯入會員」
   - 選擇檔案：`BNI_華地產house123 - members.csv`
   - 等待匯入完成

3. **檢查結果**
   - 應該會看到 toast 通知顯示匯入結果
   - 會員列表應該會顯示所有會員

## 🔍 如果執行 SQL 後仍有問題

### 檢查 1：確認表在 public schema

```sql
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'estate_attendance_%';
```

如果 `table_schema` 不是 `public`，需要更新程式碼中的表名。

### 檢查 2：確認資料庫連接

檢查 `lib/insforge.ts` 中的：
- `baseUrl` 是否正確
- 環境變數 `INFORGE_ANON_KEY` 是否設置

### 檢查 3：檢查權限

確認匿名 key 有讀寫權限：
```sql
-- 測試插入
INSERT INTO estate_attendance_members (id, name, profession)
VALUES (999, '測試會員', '測試專業');
```

如果插入成功，表示權限正常。

## 📝 重要提醒

**必須先執行 SQL 腳本建立表，才能匯入資料！**

如果表不存在，匯入功能會失敗，資料不會寫入資料庫。
