-- ============================================
-- Supabase 邀請活動圖片表
-- ============================================
-- 用於存儲邀請活動的圖片 URL，替代 Google Sheets
-- ============================================

-- 創建表（如果不存在）
CREATE TABLE IF NOT EXISTS invite_event_images (
    id BIGSERIAL PRIMARY KEY,
    event_title TEXT,                    -- 活動標題（可選，用於識別）
    event_date DATE,                     -- 活動日期（用於自動選擇活動）
    image1_url TEXT NOT NULL,            -- 圖片 1 的 URL
    image2_url TEXT NOT NULL,            -- 圖片 2 的 URL
    created_at TIMESTAMPTZ DEFAULT NOW(), -- 創建時間
    updated_at TIMESTAMPTZ DEFAULT NOW() -- 更新時間
);

-- 創建索引以加快查詢
CREATE INDEX IF NOT EXISTS idx_invite_event_images_date ON invite_event_images(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_invite_event_images_created ON invite_event_images(created_at DESC);

-- 啟用 Row Level Security (RLS)
ALTER TABLE invite_event_images ENABLE ROW LEVEL SECURITY;

-- 允許匿名用戶讀取（SELECT）
CREATE POLICY "Allow public read from invite_event_images"
ON invite_event_images
FOR SELECT
TO public
USING (true);

-- 允許匿名用戶插入（INSERT）
CREATE POLICY "Allow public insert to invite_event_images"
ON invite_event_images
FOR INSERT
TO public
WITH CHECK (true);

-- 允許匿名用戶更新（UPDATE）
CREATE POLICY "Allow public update invite_event_images"
ON invite_event_images
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- 創建更新 updated_at 的觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invite_event_images_updated_at
    BEFORE UPDATE ON invite_event_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 使用說明：
-- ============================================
-- 1. 在 Supabase Dashboard 的 SQL Editor 中執行此腳本
-- 2. 表會自動創建，並設置好 RLS 策略
-- 3. 上傳圖片時，系統會自動將 URL 保存到此表
-- 4. 頁面會自動從此表讀取最新的圖片
-- ============================================
