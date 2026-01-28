# 📥 匯入會員資料指南

## 🎯 概述

如果您之前有會員資料（在舊系統、Google Sheets 或 CSV 檔案中），可以使用以下方法匯入到新的 `estate_attendance_members` 表中。

## 📋 方法 1：使用後台匯入功能（最簡單）⭐

### 步驟：

1. **準備 CSV 檔案**
   - 格式：`id,name,profession`
   - 範例：
     ```csv
     id,name,profession
     1,張三,房地產
     2,李四,建築
     3,王五,室內設計
     ```

2. **訪問後台**
   - 網址：http://localhost:3001/admin/attendance_management
   - 登入密碼：`h123`

3. **匯入會員**
   - 切換到「會員管理」標籤
   - 點擊「📤 匯入會員」按鈕
   - 選擇 CSV 檔案
   - 系統會自動匯入所有會員

### 優點：
- ✅ 最簡單，不需要技術知識
- ✅ 自動驗證資料格式
- ✅ 顯示匯入結果（成功/失敗數量）

---

## 📋 方法 2：從 Google Sheets 匯入

### 前提條件：
- 已設置 Google Sheets API 環境變數
- Google Sheets 中有會員資料

### 步驟：

1. **準備 Google Sheets**
   - 格式：第一行為標題（介紹人、名字、專業別、VIP）
   - 從第二行開始是資料
   - 範例：
     ```
     介紹人 | 名字 | 專業別 | VIP
           | 張三 | 房地產 |
           | 李四 | 建築   |
     ```

2. **使用 API 匯入**
   - 目前系統支援從資料庫同步到 Google Sheets
   - 如需從 Google Sheets 匯入到資料庫，需要額外開發功能

---

## 📋 方法 3：使用 SQL 直接匯入

### 適用場景：
- 有大量會員資料需要一次性匯入
- 需要精確控制匯入過程

### 步驟：

1. **準備資料**
   - 將會員資料整理成 SQL INSERT 語句格式
   - 範例：
     ```sql
     INSERT INTO estate_attendance_members (id, name, profession)
     VALUES 
       (1, '張三', '房地產'),
       (2, '李四', '建築'),
       (3, '王五', '室內設計')
     ON CONFLICT (id) DO UPDATE 
     SET name = EXCLUDED.name, profession = EXCLUDED.profession;
     ```

2. **執行 SQL**
   - 在 Supabase SQL Editor 中執行
   - 或使用 `import_members_from_sheets.sql` 作為範本

### 優點：
- ✅ 適合大量資料匯入
- ✅ 可以精確控制每個欄位
- ✅ 支援批量操作

---

## 📋 方法 4：手動新增（少量資料）

### 適用場景：
- 只有少量會員（< 10 位）
- 需要逐步確認

### 步驟：

1. **訪問後台**
   - http://localhost:3001/admin/attendance_management

2. **新增會員**
   - 切換到「會員管理」標籤
   - 點擊「➕ 新增會員」
   - 輸入會員編號、姓名、專業別
   - 點擊「儲存」
   - 重複此步驟直到所有會員都新增完成

---

## 🔍 驗證匯入結果

### 檢查會員數量：

在 Supabase SQL Editor 中執行：
```sql
SELECT COUNT(*) AS total_members FROM estate_attendance_members;
```

### 查看所有會員：

```sql
SELECT id, name, profession, created_at 
FROM estate_attendance_members 
ORDER BY id;
```

### 在後台查看：

1. 訪問後台：http://localhost:3001/admin/attendance_management
2. 切換到「會員管理」標籤
3. 確認會員列表顯示正確

---

## ⚠️ 注意事項

1. **會員編號唯一性**
   - 每個會員編號必須唯一
   - 如果重複，系統會更新現有會員資料

2. **資料格式**
   - 會員編號：必須是正整數
   - 會員姓名：不能為空
   - 專業別：可選

3. **大量匯入**
   - 如果會員數量 > 100，建議使用 SQL 方法
   - 避免使用後台逐筆新增

---

## 🆘 常見問題

### Q: CSV 匯入失敗？
- 檢查 CSV 格式是否正確（id,name,profession）
- 確認第一行是標題行
- 確認會員編號是數字

### Q: 如何更新現有會員？
- 使用相同的會員編號匯入
- 系統會自動更新現有資料

### Q: 可以從舊資料庫匯入嗎？
- 如果舊資料庫是 SQLite，可以導出為 CSV
- 然後使用方法 1 匯入

---

## 📞 需要幫助？

如果遇到問題，請提供：
1. 會員資料的來源（Google Sheets、CSV、舊資料庫）
2. 會員數量
3. 錯誤訊息（如果有）

我可以協助您準備匯入腳本或解決問題。
