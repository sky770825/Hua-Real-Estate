# ⚠️ 緊急：資料庫表尚未建立

## 🚨 問題

從服務器日誌看到錯誤：
```
relation "public.estate_attendance_members" does not exist
relation "public.estate_attendance_meetings" does not exist
relation "public.estate_attendance_checkins" does not exist
relation "public.estate_attendance_prizes" does not exist
```

**這表示資料庫表還沒有建立！**

## ✅ 解決方案

### 步驟 1：在 Supabase 中執行 SQL 腳本

1. **登入 Supabase Dashboard**
   - 訪問：https://supabase.com/dashboard
   - 選擇您的專案

2. **打開 SQL Editor**
   - 點擊左側選單的 "SQL Editor"
   - 點擊 "New query"

3. **執行 SQL 腳本**
   - 打開檔案：`create_estate_attendance_tables.sql`
   - 複製全部內容
   - 貼上到 SQL Editor
   - 點擊 "Run" 執行

4. **驗證表已建立**
   - 執行驗證腳本：`verify_estate_attendance_tables.sql`
   - 確認所有表都顯示 ✅

### 步驟 2：確認表在正確的 Schema

如果表建立後仍然出現錯誤，可能是 schema 問題：

1. **檢查表所在的 Schema**
   ```sql
   SELECT table_schema, table_name 
   FROM information_schema.tables 
   WHERE table_name LIKE 'estate_attendance_%'
   ORDER BY table_schema, table_name;
   ```

2. **如果表在 public schema**
   - 應該可以正常使用
   - 如果不行，檢查 RLS（Row Level Security）設置

3. **如果表在其他 schema**
   - 需要更新 `lib/insforge.ts` 中的表名
   - 或使用完整的表名：`schema_name.table_name`

## 🔍 快速檢查

執行以下 SQL 查詢來檢查表是否存在：

```sql
-- 檢查所有 estate_attendance 表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'estate_attendance_%'
ORDER BY table_name;
```

**應該看到 5 個表：**
- estate_attendance_members
- estate_attendance_meetings
- estate_attendance_checkins
- estate_attendance_prizes
- estate_attendance_lottery_winners

## 📝 如果表已建立但仍有錯誤

1. **檢查資料庫連接**
   - 確認 `lib/insforge.ts` 中的 `baseUrl` 正確
   - 確認環境變數 `INFORGE_ANON_KEY` 設置

2. **檢查權限**
   - 確認匿名 key 有讀寫權限
   - 檢查 RLS 政策是否正確

3. **重新啟動服務器**
   ```bash
   # 停止服務器
   # 清理緩存
   rm -rf .next
   # 重新啟動
   npm run dev
   ```

## 🚀 完成後

執行 SQL 腳本後，請：
1. 重新啟動開發服務器
2. 重新訪問後台
3. 嘗試匯入會員資料
