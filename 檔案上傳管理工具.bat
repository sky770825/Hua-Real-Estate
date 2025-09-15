@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:start
echo ================================
echo 📁 檔案上傳管理工具
echo ================================
echo.

echo 請選擇操作：
echo.
echo 1. 查看本地檔案
echo 2. 查看GitHub上的檔案
echo 3. 上傳指定檔案
echo 4. 上傳所有檔案
echo 5. 檢查檔案差異
echo 6. 強制同步所有檔案
echo 7. 退出
echo.

set /p choice=請輸入選項 (1-7): 

if "%choice%"=="1" goto view_local
if "%choice%"=="2" goto view_github
if "%choice%"=="3" goto upload_specific
if "%choice%"=="4" goto upload_all
if "%choice%"=="5" goto check_diff
if "%choice%"=="6" goto force_sync
if "%choice%"=="7" goto exit
echo 無效選項
pause
goto start

:view_local
echo.
echo ================================
echo 📂 本地檔案列表
echo ================================
echo.

echo 網站檔案：
echo ================================
dir /b *.html *.css *.js 2>nul
echo ================================

echo.
echo 文檔檔案：
echo ================================
dir /b *.txt *.md 2>nul
echo ================================

echo.
echo 所有檔案：
echo ================================
dir /b
echo ================================

echo.
pause
goto start

:view_github
echo.
echo ================================
echo ☁️ GitHub上的檔案
echo ================================
echo.

echo 正在獲取GitHub檔案列表...
git fetch origin main
echo.

echo GitHub上的檔案：
echo ================================
git ls-tree -r origin/main --name-only
echo ================================

echo.
pause
goto start

:upload_specific
echo.
echo ================================
echo 📤 上傳指定檔案
echo ================================
echo.

echo 可用的檔案：
echo ================================
dir /b *.html *.css *.js *.txt *.md 2>nul
echo ================================

echo.
set /p filename=請輸入要上傳的檔案名稱 (如: index.html): 
if "%filename%"=="" (
    echo ❌ 檔案名稱不能為空！
    pause
    goto start
)

if not exist "%filename%" (
    echo ❌ 檔案不存在：%filename%
    pause
    goto start
)

echo.
echo 正在上傳檔案：%filename%
echo.

echo 步驟1: 添加檔案到Git...
git add "%filename%"
echo ✅ 檔案已添加

echo.
echo 步驟2: 提交檔案...
git commit -m "上傳檔案: %filename% - %date% %time%"
echo ✅ 檔案已提交

echo.
echo 步驟3: 推送到GitHub...
git push origin main
if errorlevel 1 (
    echo ❌ 推送失敗
) else (
    echo ✅ 推送成功！
    echo 檔案 %filename% 已上傳到GitHub
)

echo.
pause
goto start

:upload_all
echo.
echo ================================
echo 📤 上傳所有檔案
echo ================================
echo.

echo 正在上傳所有檔案...
echo.

echo 步驟1: 添加所有檔案到Git...
git add .
echo ✅ 所有檔案已添加

echo.
echo 步驟2: 檢查要上傳的檔案...
git status
echo.

echo 步驟3: 提交所有檔案...
git commit -m "上傳所有檔案 - %date% %time%"
echo ✅ 所有檔案已提交

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
echo GitHub上的檔案：
git ls-tree -r origin/main --name-only
echo.

pause
goto start

:check_diff
echo.
echo ================================
echo 🔍 檢查檔案差異
echo ================================
echo.

echo 正在檢查本地和GitHub的差異...
echo.

echo 本地檔案：
echo ================================
dir /b *.html *.css *.js *.txt *.md 2>nul
echo ================================

echo.
echo GitHub檔案：
echo ================================
git ls-tree -r origin/main --name-only
echo ================================

echo.
echo Git狀態：
echo ================================
git status
echo ================================

echo.
pause
goto start

:force_sync
echo.
echo ================================
echo 🔄 強制同步所有檔案
echo ================================
echo.

echo 警告：這將強制同步所有檔案到GitHub
echo.

set /p confirm=確定要強制同步嗎？(y/n): 
if /i not "%confirm%"=="y" (
    echo 操作已取消
    pause
    goto start
)

echo.
echo 正在強制同步...
echo.

echo 步驟1: 添加所有檔案...
git add .
echo ✅ 所有檔案已添加

echo.
echo 步驟2: 提交所有檔案...
git commit -m "強制同步所有檔案 - %date% %time%"
echo ✅ 所有檔案已提交

echo.
echo 步驟3: 強制推送到GitHub...
git push origin main --force
if errorlevel 1 (
    echo ❌ 強制推送失敗
) else (
    echo ✅ 強制推送成功！
    echo 所有檔案已強制同步到GitHub
)

echo.
echo 步驟4: 驗證同步結果...
echo GitHub上的檔案：
git ls-tree -r origin/main --name-only
echo.

pause
goto start

:exit
echo 感謝使用檔案上傳管理工具！
pause
exit
