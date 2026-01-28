-- 為中獎記錄表添加領取狀態欄位
-- 如果欄位已存在，則不會報錯

-- 添加 claimed 欄位（布林值，默認為 false）
ALTER TABLE estate_attendance_lottery_winners 
ADD COLUMN IF NOT EXISTS claimed BOOLEAN NOT NULL DEFAULT false;

-- 添加 claimed_at 欄位（記錄領取時間）
ALTER TABLE estate_attendance_lottery_winners 
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE;

-- 添加索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_lottery_winners_claimed ON estate_attendance_lottery_winners(claimed);
CREATE INDEX IF NOT EXISTS idx_lottery_winners_meeting_date_claimed ON estate_attendance_lottery_winners(meeting_date, claimed);

-- 完成訊息
SELECT '中獎記錄表的領取狀態欄位已成功添加！' AS message;
