-- ============================================
-- 快速修復 RLS 策略 - 確保圖片可以公開訪問
-- 執行此 SQL 可以快速修復圖片無法顯示的問題
-- ============================================

-- 刪除所有現有策略
DROP POLICY IF EXISTS "Allow public read from hua-real-estate" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read all from hua-real-estate bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to hua-real-estate project" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update in hua-real-estate" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete in hua-real-estate" ON storage.objects;

-- 創建最寬鬆的讀取策略（允許讀取整個存儲桶的所有文件）
-- 這是最簡單的方式，確保所有圖片都可以訪問
CREATE POLICY "Allow public read all from hua-real-estate bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'hua-real-estate');

-- 創建上傳策略（允許上傳到項目目錄）
CREATE POLICY "Allow public uploads to hua-real-estate project"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'hua-real-estate' 
  AND (storage.foldername(name))[1] = 'hua-real-estate'
);

-- 創建刪除策略（允許刪除項目目錄下的文件）
CREATE POLICY "Allow public delete in hua-real-estate"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'hua-real-estate' 
  AND (storage.foldername(name))[1] = 'hua-real-estate'
);

-- ============================================
-- 執行說明：
-- 1. 訪問：https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc/sql/new
-- 2. 複製上面的 SQL 代碼
-- 3. 貼到 SQL 編輯器
-- 4. 點擊 "Run" 執行
-- 5. 等待執行完成
-- 
-- 重要：執行後還需要確保存儲桶設置為公開！
-- 訪問：https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc/storage/buckets
-- 找到 "hua-real-estate" 存儲桶，開啟 "Public bucket" 開關
-- ============================================
