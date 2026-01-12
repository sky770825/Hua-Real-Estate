@echo off
REM Cloudflare Worker 自動部署腳本 (Windows)
REM 使用 Wrangler CLI 自動部署 R2 上傳 Worker

echo 🚀 Cloudflare R2 上傳 Worker 自動部署腳本
echo ==========================================
echo.

REM 檢查是否安裝了 Wrangler
where wrangler >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未檢測到 Wrangler CLI
    echo.
    echo 請先安裝 Wrangler：
    echo   npm install -g wrangler
    echo.
    echo 或者使用：
    echo   npx wrangler deploy
    echo.
    pause
    exit /b 1
)

echo ✅ 檢測到 Wrangler CLI
echo.

REM 檢查是否已登錄
echo 檢查登錄狀態...
wrangler whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  尚未登錄 Cloudflare
    echo.
    echo 請先登錄：
    echo   wrangler login
    echo.
    pause
    exit /b 1
)

echo ✅ 已登錄 Cloudflare
echo.

REM 創建 wrangler.toml 配置文件
echo 📝 創建 wrangler.toml 配置文件...
(
echo name = "r2-upload"
echo main = "r2-upload-worker.js"
echo compatibility_date = "2024-01-01"
echo.
echo [[r2_buckets]]
echo binding = "R2_BUCKET"
echo bucket_name = "hua-real-estate"
) > wrangler.toml

echo ✅ 配置文件已創建
echo.

REM 部署 Worker
echo 🚀 開始部署 Worker...
wrangler deploy

if %errorlevel% equ 0 (
    echo.
    echo ✅ 部署成功！
    echo.
    echo 📋 下一步：
    echo 1. 複製上面顯示的 Worker URL
    echo 2. 在 invite.html 中找到 R2_CONFIG
    echo 3. 設置 apiEndpoint 為 Worker URL
    echo.
) else (
    echo.
    echo ❌ 部署失敗，請檢查錯誤信息
)

pause
