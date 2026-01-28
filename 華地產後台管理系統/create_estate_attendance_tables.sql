-- 建立 estate_attendance 專案的所有資料表
-- 執行前請確認：1) 資料庫連接正常 2) 有創建表的權限

-- 1. 會員表 (estate_attendance_members)
CREATE TABLE IF NOT EXISTS estate_attendance_members (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    profession TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 會議表 (estate_attendance_meetings)
CREATE TABLE IF NOT EXISTS estate_attendance_meetings (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 簽到記錄表 (estate_attendance_checkins)
CREATE TABLE IF NOT EXISTS estate_attendance_checkins (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL,
    meeting_date DATE NOT NULL,
    checkin_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    message TEXT,
    status TEXT NOT NULL DEFAULT 'present',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (member_id) REFERENCES estate_attendance_members(id) ON DELETE CASCADE,
    UNIQUE(member_id, meeting_date)
);

-- 4. 獎品表 (estate_attendance_prizes)
CREATE TABLE IF NOT EXISTS estate_attendance_prizes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    remaining_quantity INTEGER NOT NULL DEFAULT 0,
    probability DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 中獎記錄表 (estate_attendance_lottery_winners)
CREATE TABLE IF NOT EXISTS estate_attendance_lottery_winners (
    id SERIAL PRIMARY KEY,
    meeting_date DATE NOT NULL,
    member_id INTEGER NOT NULL,
    prize_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (member_id) REFERENCES estate_attendance_members(id) ON DELETE CASCADE,
    FOREIGN KEY (prize_id) REFERENCES estate_attendance_prizes(id) ON DELETE CASCADE
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_checkins_member_id ON estate_attendance_checkins(member_id);
CREATE INDEX IF NOT EXISTS idx_checkins_meeting_date ON estate_attendance_checkins(meeting_date);
CREATE INDEX IF NOT EXISTS idx_lottery_winners_meeting_date ON estate_attendance_lottery_winners(meeting_date);
CREATE INDEX IF NOT EXISTS idx_lottery_winners_member_id ON estate_attendance_lottery_winners(member_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON estate_attendance_meetings(date);

-- 建立更新時間的自動更新觸發器函數（可選）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為需要的表添加更新時間觸發器
DROP TRIGGER IF EXISTS update_estate_attendance_members_updated_at ON estate_attendance_members;
CREATE TRIGGER update_estate_attendance_members_updated_at
    BEFORE UPDATE ON estate_attendance_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_estate_attendance_meetings_updated_at ON estate_attendance_meetings;
CREATE TRIGGER update_estate_attendance_meetings_updated_at
    BEFORE UPDATE ON estate_attendance_meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_estate_attendance_checkins_updated_at ON estate_attendance_checkins;
CREATE TRIGGER update_estate_attendance_checkins_updated_at
    BEFORE UPDATE ON estate_attendance_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_estate_attendance_prizes_updated_at ON estate_attendance_prizes;
CREATE TRIGGER update_estate_attendance_prizes_updated_at
    BEFORE UPDATE ON estate_attendance_prizes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 完成訊息
SELECT '所有 estate_attendance 資料表已成功建立！' AS message;
