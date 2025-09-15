@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:start
echo ================================
echo 🏠 華地產專用網站 - GitHub 版本管理工具
echo ================================
echo.

echo 請選擇操作：
echo 1. 部署指定版本 (上架)
echo 2. 下架所有檔案
echo 3. 建立備份
echo 4. 查看可用版本
echo 5. 退出
echo.

set /p choice=請輸入選項 (1-5): 

if "%choice%"=="1" goto deploy_version
if "%choice%"=="2" goto cleanup_github
if "%choice%"=="3" goto create_backup
if "%choice%"=="4" goto show_versions
if "%choice%"=="5" goto exit
echo 無效選項
pause
goto start

:deploy_version
echo.
echo 可用的本地版本：
dir /b | findstr "^v" 2>nul
echo.

if errorlevel 1 (
    echo  沒有找到版本資料夾！
    echo.
    echo  建議操作：
    echo 1. 使用 "版本備份.bat" 建立版本
    echo 2. 或使用 "一鍵部署.bat" 部署當前版本
    echo.
    pause
    goto start
)

echo.
set /p version=請輸入要部署的版本號 (如 v1.5): 

if "%version%"=="" (
    echo 版本號不能為空！
    pause
    goto start
)

if not exist "%version%" (
    echo 版本資料夾不存在：%version%
    echo 可用的版本：
    dir /b | findstr "^v"
    echo.
    pause
    goto start
)

echo.
echo  正在部署版本：%version%
echo.

echo  步驟1: 備份當前檔案...
if not exist "backup_current" mkdir backup_current
copy index.html backup_current\ 2>nul
copy styles.css backup_current\ 2>nul
copy script.js backup_current\ 2>nul
copy *.txt backup_current\ 2>nul
copy *.md backup_current\ 2>nul
echo  當前檔案已備份

echo.
echo  步驟2: 下架GitHub舊檔案...
git rm -r --cached .
echo  GitHub舊檔案已下架

echo.
echo  步驟3: 複製版本檔案...
copy "%version%\index.html" . 2>nul
copy "%version%\styles.css" . 2>nul
copy "%version%\script.js" . 2>nul
copy "%version%\*.txt" . 2>nul
copy "%version%\*.md" . 2>nul
echo  版本檔案已複製

echo.
echo  步驟4: 檢查Git狀態...
git status
echo.

echo  步驟5: 添加新檔案到Git...
git add index.html styles.css script.js *.txt *.md
echo  新檔案已添加到Git

echo.
echo  步驟6: 提交變更...
set commit_msg=部署版本 %version% - %date% %time%
git commit -m "%commit_msg%"
echo  變更已提交

echo.
echo  步驟7: 上架到GitHub...
git push origin main
echo  版本 %version% 已上架到GitHub

echo.
echo ================================
echo  部署完成！
echo ================================
echo.
echo  部署資訊：
echo   版本：%version%
echo   時間：%date% %time%
echo   GitHub：https://github.com/sky770825/Hua-Real-Estate
echo   網站：https://sky770825.github.io/Hua-Real-Estate/
echo.

set /p restore=是否恢復到部署前的狀態？(y/n): 
if /i "%restore%"=="y" (
    echo.
    echo 🔄 正在恢復檔案...
    copy backup_current\index.html . 2>nul
    copy backup_current\styles.css . 2>nul
    copy backup_current\script.js . 2>nul
    copy backup_current\*.txt . 2>nul
    copy backup_current\*.md . 2>nul
    echo  檔案已恢復到部署前狀態
    echo.
    echo  提示：GitHub上仍然是 %version% 版本
    echo     只有本地檔案恢復了
)

echo.
echo  感謝使用GitHub版本管理工具！
echo.
echo 請選擇下一步操作：
echo 1. 回到主選單
echo 2. 退出程式
echo.
set /p next_action=請輸入選項 (1-2): 

if "%next_action%"=="1" (
    echo.
    echo 回到主選單...
    goto start
) else if "%next_action%"=="2" (
    echo.
    echo 感謝使用GitHub版本管理工具！
    pause
    exit
) else (
    echo.
    echo 無效選項，回到主選單...
    goto start
)

:cleanup_github
echo.
echo ================================
echo  下架所有檔案
echo ================================
echo.

echo   警告：這將刪除GitHub上的所有檔案！
echo.
echo 下架後的效果：
echo - GitHub Repository 會變成空白
echo - 網站會無法顯示
echo - 所有檔案都會被移除
echo.

set /p confirm=確定要下架所有檔案嗎？(y/n): 

if /i not "%confirm%"=="y" (
    echo 操作已取消
    pause
    goto start
)

echo.
echo  步驟1: 備份當前檔案...
if not exist "backup_before_cleanup" mkdir backup_before_cleanup
copy index.html backup_before_cleanup\ 2>nul
copy styles.css backup_before_cleanup\ 2>nul
copy script.js backup_before_cleanup\ 2>nul
copy *.txt backup_before_cleanup\ 2>nul
copy *.md backup_before_cleanup\ 2>nul
echo  檔案已備份到 backup_before_cleanup 資料夾

echo.
echo  步驟2: 下架GitHub檔案...
git rm -r --cached .
echo  GitHub檔案已從暫存區移除

echo.
echo  步驟3: 提交下架變更...
git commit -m "下架所有檔案 - %date% %time%"
echo  下架變更已提交

echo.
echo  步驟4: 推送到GitHub...
git push origin main
echo  下架完成，已推送到GitHub

echo.
echo ================================
echo  下架完成！
echo ================================
echo.
echo  下架資訊：
echo   時間：%date% %time%
echo   GitHub：https://github.com/sky770825/Hua-Real-Estate (現在是空白)
echo   網站：https://sky770825.github.io/Hua-Real-Estate/ (無法顯示)
echo.
echo  備份位置：backup_before_cleanup 資料夾
echo.
echo  提示：可以選擇 "1. 部署指定版本" 重新上架版本
echo.
echo 請選擇下一步操作：
echo 1. 回到主選單
echo 2. 退出程式
echo.
set /p next_action=請輸入選項 (1-2): 

if "%next_action%"=="1" (
    echo.
    echo 回到主選單...
    goto start
) else if "%next_action%"=="2" (
    echo.
    echo 感謝使用GitHub版本管理工具！
    pause
    exit
) else (
    echo.
    echo 無效選項，回到主選單...
    goto start
)

:show_versions
echo.
echo ================================
echo  版本資訊
echo ================================
echo.

echo 本地版本：
dir /b | findstr "^v" 2>nul
if errorlevel 1 (
    echo  沒有找到版本資料夾
) else (
    echo  找到以上版本
)
echo.

echo GitHub狀態：
git status 2>nul
if errorlevel 1 (
    echo  Git未初始化
) else (
    echo  Git已初始化
)
echo.

echo 最近提交記錄：
git log --oneline -5 2>nul
echo.

echo 請選擇下一步操作：
echo 1. 回到主選單
echo 2. 退出程式
echo.
set /p next_action=請輸入選項 (1-2): 

if "%next_action%"=="1" (
    echo.
    echo 回到主選單...
    goto start
) else if "%next_action%"=="2" (
    echo.
    echo 感謝使用GitHub版本管理工具！
    pause
    exit
) else (
    echo.
    echo 無效選項，回到主選單...
    goto start
)

:create_backup
echo.
echo ================================
echo 華地產專用網站 - 版本備份
echo ================================
echo.

set /p version=請輸入版本號 (如 v1.5): 

if "%version%"=="" (
    echo 版本號不能為空！
    pause
    goto start
)

echo 正在建立 %version% 資料夾...
mkdir %version% 2>nul

echo 正在複製檔案...
copy index.html %version%\index.html
copy styles.css %version%\styles.css  
copy script.js %version%\script.js
copy *.txt %version%\ 2>nul
copy *.md %version%\ 2>nul

echo.
echo 複製完成！
echo 版本資料夾：%version%
echo.

echo 請選擇下一步操作：
echo 1. 立即部署此版本
echo 2. 回到主選單
echo 3. 退出程式
echo.
set /p next_action=請輸入選項 (1-3): 

if "%next_action%"=="1" (
    echo 正在部署版本 %version%...
    goto deploy_version
) else if "%next_action%"=="2" (
    echo 回到主選單...
    goto start
) else if "%next_action%"=="3" (
    echo 感謝使用GitHub版本管理工具！
    pause
    exit
) else (
    echo 無效選項，回到主選單...
    goto start
)

:exit
echo 感謝使用GitHub版本管理工具！
pause
exit