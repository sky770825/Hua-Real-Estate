-- ============================================
-- Supabase Storage 策略配置 SQL
-- 項目：hua-real-estate
-- 存儲桶：hua-real-estate
-- 目標：允許所有人公開讀取和上傳圖片
-- ============================================

-- 步驟 1：刪除現有策略（如果存在）
DROP POLICY IF EXISTS "Allow public uploads to hua-real-estate project" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from hua-real-estate" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read all from hua-real-estate bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update in hua-real-estate" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete in hua-real-estate" ON storage.objects;

-- 步驟 2：創建讀取策略（最重要！允許所有人讀取）
-- 策略 1：允許讀取 hua-real-estate 項目目錄下的文件
CREATE POLICY "Allow public read from hua-real-estate"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'hua-real-estate' 
  AND (storage.foldername(name))[1] = 'hua-real-estate'
);

-- 策略 2：更寬鬆的讀取策略（允許讀取整個存儲桶的所有文件）
-- 如果策略 1 不工作，使用這個更寬鬆的策略
CREATE POLICY "Allow public read all from hua-real-estate bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'hua-real-estate');

-- 步驟 3：創建上傳策略
-- 允許匿名用戶上傳到 hua-real-estate 項目目錄
CREATE POLICY "Allow public uploads to hua-real-estate project"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'hua-real-estate' 
  AND (storage.foldername(name))[1] = 'hua-real-estate'
);

-- 步驟 4：創建更新策略（可選，如果需要覆蓋文件）
CREATE POLICY "Allow public update in hua-real-estate"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'hua-real-estate' 
  AND (storage.foldername(name))[1] = 'hua-real-estate'
)
WITH CHECK (
  bucket_id = 'hua-real-estate' 
  AND (storage.foldername(name))[1] = 'hua-real-estate'
);

-- 步驟 5：創建刪除策略（可選，如果需要刪除文件）
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
-- ============================================
