-- ============================================
-- 添加 DELETE 策略到 invite_event_images 表
-- ============================================
-- 如果之前創建表時沒有添加 DELETE 策略，執行此腳本
-- ============================================

-- 允許匿名用戶刪除（DELETE）
CREATE POLICY IF NOT EXISTS "Allow public delete from invite_event_images"
ON invite_event_images
FOR DELETE
TO public
USING (true);

-- ============================================
-- 執行說明：
-- ============================================
-- 1. 打開 Supabase Dashboard
-- 2. 進入 SQL Editor
-- 3. 複製並執行此腳本
-- 4. 完成後，刪除功能即可正常使用
-- ============================================
