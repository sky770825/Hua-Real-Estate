-- ============================================
-- ✅ Estate Attendance 資料表驗證 SQL
-- ============================================
-- 用途：檢查所有 estate_attendance 表是否已正確建立
-- 執行方式：在 Supabase SQL Editor 中執行
-- ============================================

-- 1. 檢查所有表是否存在
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'estate_attendance_members',
      'estate_attendance_meetings',
      'estate_attendance_checkins',
      'estate_attendance_prizes',
      'estate_attendance_lottery_winners'
    ) THEN '✅ 已建立'
    ELSE '⚠️ 未建立'
  END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'estate_attendance_%'
ORDER BY table_name;

-- 2. 檢查每個表的結構
-- 會員表
SELECT 
  'estate_attendance_members' AS table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'estate_attendance_members'
ORDER BY ordinal_position;

-- 會議表
SELECT 
  'estate_attendance_meetings' AS table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'estate_attendance_meetings'
ORDER BY ordinal_position;

-- 簽到記錄表
SELECT 
  'estate_attendance_checkins' AS table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'estate_attendance_checkins'
ORDER BY ordinal_position;

-- 獎品表
SELECT 
  'estate_attendance_prizes' AS table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'estate_attendance_prizes'
ORDER BY ordinal_position;

-- 中獎記錄表
SELECT 
  'estate_attendance_lottery_winners' AS table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'estate_attendance_lottery_winners'
ORDER BY ordinal_position;

-- 3. 檢查外鍵約束
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  '✅ 外鍵已建立' AS status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name LIKE 'estate_attendance_%'
ORDER BY tc.table_name, kcu.column_name;

-- 4. 檢查索引
SELECT
  tablename,
  indexname,
  indexdef,
  '✅ 索引已建立' AS status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'estate_attendance_%'
ORDER BY tablename, indexname;

-- 5. 檢查觸發器
SELECT
  trigger_name,
  event_object_table AS table_name,
  action_timing,
  event_manipulation,
  '✅ 觸發器已建立' AS status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table LIKE 'estate_attendance_%'
ORDER BY event_object_table, trigger_name;

-- 6. 統計每個表的記錄數
SELECT 
  'estate_attendance_members' AS table_name,
  COUNT(*) AS record_count
FROM estate_attendance_members
UNION ALL
SELECT 
  'estate_attendance_meetings' AS table_name,
  COUNT(*) AS record_count
FROM estate_attendance_meetings
UNION ALL
SELECT 
  'estate_attendance_checkins' AS table_name,
  COUNT(*) AS record_count
FROM estate_attendance_checkins
UNION ALL
SELECT 
  'estate_attendance_prizes' AS table_name,
  COUNT(*) AS record_count
FROM estate_attendance_prizes
UNION ALL
SELECT 
  'estate_attendance_lottery_winners' AS table_name,
  COUNT(*) AS record_count
FROM estate_attendance_lottery_winners
ORDER BY table_name;

-- ============================================
-- 📊 總結報告
-- ============================================
SELECT 
  '📋 驗證檢查完成' AS summary,
  '請確認以上所有項目都顯示 ✅' AS note,
  '如果看到 ⚠️，請執行 create_estate_attendance_tables.sql' AS action;
