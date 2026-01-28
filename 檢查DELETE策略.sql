-- ============================================
-- 檢查 invite_event_images 表的 DELETE 策略
-- ============================================

-- 查詢所有策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'invite_event_images'
ORDER BY policyname;

-- 如果沒有 DELETE 策略，執行以下 SQL 添加：
-- CREATE POLICY IF NOT EXISTS "Allow public delete from invite_event_images"
-- ON invite_event_images
-- FOR DELETE
-- TO public
-- USING (true);
