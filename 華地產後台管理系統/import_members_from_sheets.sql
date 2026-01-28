-- ============================================
-- 📥 從 Google Sheets 匯入會員資料到資料庫
-- ============================================
-- 說明：此 SQL 腳本用於批量匯入會員資料
-- 使用方式：
-- 1. 從 Google Sheets 或 CSV 匯出會員資料
-- 2. 將資料格式轉換為 INSERT 語句
-- 3. 在 Supabase SQL Editor 中執行
-- ============================================

-- 範例：匯入會員資料
-- 格式：id, name, profession

-- 範例 1：單筆匯入
INSERT INTO estate_attendance_members (id, name, profession)
VALUES (1, '張三', '房地產')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, profession = EXCLUDED.profession;

-- 範例 2：批量匯入（多筆）
INSERT INTO estate_attendance_members (id, name, profession)
VALUES 
  (1, '張三', '房地產'),
  (2, '李四', '建築'),
  (3, '王五', '室內設計')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, profession = EXCLUDED.profession;

-- ============================================
-- 📋 匯入步驟說明
-- ============================================
-- 
-- 方法 1：使用後台匯入功能（推薦）
-- 1. 訪問後台：http://localhost:3001/admin/attendance_management
-- 2. 切換到「會員管理」標籤
-- 3. 點擊「📤 匯入會員」按鈕
-- 4. 選擇 CSV 檔案（格式：id,name,profession）
-- 5. 系統會自動匯入
--
-- 方法 2：使用 Google Sheets 同步
-- 1. 確保 Google Sheets 中有會員資料
-- 2. 在後台點擊「同步到 Sheets」按鈕
-- 3. 系統會從資料庫同步到 Google Sheets
-- 4. 如果需要從 Google Sheets 匯入，需要先設置環境變數
--
-- 方法 3：使用 SQL 直接匯入
-- 1. 準備 CSV 檔案（格式：id,name,profession）
-- 2. 轉換為 INSERT 語句（參考上方範例）
-- 3. 在 Supabase SQL Editor 中執行
--
-- ============================================

-- 檢查目前有多少會員
SELECT COUNT(*) AS total_members FROM estate_attendance_members;

-- 查看所有會員
SELECT id, name, profession, created_at 
FROM estate_attendance_members 
ORDER BY id;
