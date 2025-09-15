@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ================================
echo 🔧 修復推送衝突問題
echo ================================
echo.

echo 問題分析：
echo GitHub倉庫已經有內容，但您的本地倉庫沒有
echo 需要先下載GitHub的內容，然後合併您的修改
echo.

echo 請選擇解決方案：
echo.
echo 1. 合併GitHub內容（推薦）
echo 2. 強制覆蓋GitHub內容（危險）
echo 3. 查看GitHub內容
echo 4. 退出
echo.

set /p choice=請輸入選項 (1-4): 

if "%choice%"=="1" goto merge
if "%choice%"=="2" goto force
if "%choice%"=="3" goto view
if "%choice%"=="4" goto exit
echo 無效選項
pause
goto start

:merge
echo.
echo ================================
echo 🔄 合併GitHub內容
echo ================================
echo.

echo 步驟1: 下載GitHub內容...
git pull origin main --allow-unrelated-histories
if errorlevel 1 (
    echo ❌ 下載失敗，嘗試其他方法...
    echo.
    echo 步驟1.1: 先獲取遠端內容...
    git fetch origin main
    echo ✅ 遠端內容已獲取
    echo.
    echo 步驟1.2: 合併遠端內容...
    git merge origin/main --allow-unrelated-histories
    if errorlevel 1 (
        echo ❌ 合併失敗，請手動解決衝突
        echo 正在顯示衝突檔案...
        git status
        pause
        exit
    )
) else (
    echo ✅ GitHub內容已下載並合併
)

echo.
echo 步驟2: 檢查合併結果...
git status
echo.

echo 步驟3: 推送到GitHub...
git push origin main
if errorlevel 1 (
    echo ❌ 推送失敗，請檢查網路連接
) else (
    echo ✅ 推送成功！
    echo 您的網站已更新：https://sky770825.github.io/Hua-Real-Estate/
)

echo.
pause
goto start

:force
echo.
echo ================================
echo ⚠️ 強制覆蓋GitHub內容
echo ================================
echo.

echo 警告：這將覆蓋GitHub上的所有內容！
echo 請確認您要這樣做。
echo.

set /p confirm=確定要強制覆蓋嗎？(y/n): 
if /i not "%confirm%"=="y" (
    echo 操作已取消
    pause
    goto start
)

echo.
echo 正在強制推送...
git push origin main --force
if errorlevel 1 (
    echo ❌ 強制推送失敗
) else (
    echo ✅ 強制推送成功！
    echo GitHub內容已被覆蓋
)

echo.
pause
goto start

:view
echo.
echo ================================
echo 👀 查看GitHub內容
echo ================================
echo.

echo 正在獲取GitHub內容...
git fetch origin main
echo ✅ 遠端內容已獲取

echo.
echo 查看GitHub上的檔案...
git ls-tree -r origin/main --name-only
echo.

echo 查看GitHub上的提交記錄...
git log origin/main --oneline -5
echo.

pause
goto start

:exit
echo 感謝使用！
pause
exit
