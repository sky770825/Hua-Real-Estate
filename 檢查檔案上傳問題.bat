@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ================================
echo 🔍 檢查檔案上傳問題
echo ================================
echo.

echo 正在檢查本地檔案...
echo.

echo 本地檔案列表：
echo ================================
dir /b *.html *.css *.js *.txt *.md 2>nul
echo ================================

echo.
echo 正在檢查Git狀態...
echo.

echo Git追蹤的檔案：
echo ================================
git ls-files
echo ================================

echo.
echo 正在檢查未追蹤的檔案...
echo ================================
git status --porcelain
echo ================================

echo.
echo 正在檢查GitHub上的檔案...
echo ================================
git ls-tree -r origin/main --name-only 2>nul
echo ================================

echo.
echo ================================
echo 🔧 修復檔案上傳問題
echo ================================
echo.

echo 步驟1: 添加所有檔案到Git...
git add .
echo ✅ 所有檔案已添加

echo.
echo 步驟2: 檢查添加的檔案...
git status
echo.

echo 步驟3: 提交檔案...
git commit -m "添加所有網站檔案 - %date% %time%"
echo ✅ 檔案已提交

echo.
echo 步驟4: 推送到GitHub...
git push origin main
if errorlevel 1 (
    echo ❌ 推送失敗
    echo 請檢查網路連接和認證
) else (
    echo ✅ 推送成功！
    echo 所有檔案已上傳到GitHub
)

echo.
echo 步驟5: 驗證上傳結果...
echo.
echo GitHub上的檔案：
echo ================================
git ls-tree -r origin/main --name-only
echo ================================

echo.
echo 您的網站地址：
echo https://sky770825.github.io/Hua-Real-Estate/
echo.

pause
