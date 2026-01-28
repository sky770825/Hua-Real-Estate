-- ============================================
-- 👤 app_ai_commander 使用者 Onboarding
-- ============================================
-- 用途：讓新使用者「第一次登入就能用」
-- 執行方式：
--   1. 手動版：在 Supabase SQL Editor 執行（替換 UUID）
--   2. 自動版：之後會搬到 Cloudflare Workers
-- ============================================

-- ============================================
-- D) 讓新使用者「第一次登入就能用」（必做 onboarding）
-- ============================================
-- 因為 RLS 很嚴格，使用者如果沒有 membership，就什麼都看不到。
-- 最穩做法：用 Cloudflare Worker（service_role）幫他寫入 membership + 建 default workspace。

-- ============================================
-- 手動版測試 SQL（用 Supabase SQL Editor、以管理者身份執行）
-- ============================================

-- 1) 確保 app 已註冊
insert into core.apps (app_id, name)
values ('ai_commander', 'AI 指揮官')
on conflict (app_id) do nothing;

-- 2) 把某個 user 加入 ai_commander（把 UUID 換成你的 auth.users.id）
-- ⚠️ 請替換 'PUT_USER_UUID_HERE' 為實際的 user UUID
insert into core.app_memberships (app_id, user_id, role)
values ('ai_commander', 'PUT_USER_UUID_HERE', 'owner')
on conflict (app_id, user_id) do nothing;

-- 3) 幫他建 default workspace（同樣換 UUID）
-- ⚠️ 請替換 'PUT_USER_UUID_HERE' 為實際的 user UUID
insert into app_ai_commander.workspaces (owner_id, name)
values ('PUT_USER_UUID_HERE', 'Default Workspace');

-- ============================================
-- 查詢你的 user UUID（執行這個來找到你的 UUID）
-- ============================================
-- select id, email, created_at from auth.users order by created_at desc;

-- ============================================
-- 驗證 onboarding 是否成功
-- ============================================
-- select 
--   u.email,
--   am.app_id,
--   am.role,
--   w.name as workspace_name
-- from auth.users u
-- join core.app_memberships am on u.id = am.user_id
-- left join app_ai_commander.workspaces w on u.id = w.owner_id
-- where am.app_id = 'ai_commander';
