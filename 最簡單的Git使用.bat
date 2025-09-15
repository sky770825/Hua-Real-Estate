@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:start
echo ================================
echo 🎯 最簡單的Git使用
echo ================================
echo.

echo 請選擇您要做的操作：
echo.
echo 1. 第一次使用Git（一鍵配置）
echo 2. 修改檔案後上傳到GitHub
echo 3. 從GitHub下載最新版本
echo 4. 查看當前狀態
echo 5. 退出
echo.

set /p choice=請輸入選項 (1-5): 

if "%choice%"=="1" goto first_time
if "%choice%"=="2" goto upload
if "%choice%"=="3" goto download
if "%choice%"=="4" goto status
if "%choice%"=="5" goto exit
echo 無效選項
pause
goto start

:first_time
echo.
echo ================================
echo 🚀 第一次使用Git
echo ================================
echo.

echo 請輸入您的資訊：
echo.

set /p git_name=請輸入您的姓名: 
if "%git_name%"=="" (
    echo ❌ 姓名不能為空！
    pause
    goto start
)

set /p git_email=請輸入您的Email: 
if "%git_email%"=="" (
    echo ❌ Email不能為空！
    pause
    goto start
)

echo.
echo 正在配置Git...
git config --global user.name "%git_name%"
git config --global user.email "%git_email%"
echo ✅ Git身份配置完成

echo.
echo 正在初始化倉庫...
if not exist ".git" (
    git init
    echo ✅ 倉庫已初始化
) else (
    echo ✅ 倉庫已存在
)

echo.
echo 正在添加檔案...
git add .
echo ✅ 檔案已添加

echo.
echo 正在提交...
git commit -m "初始提交 - %date% %time%"
echo ✅ 提交完成

echo.
echo 正在連接到GitHub...
git remote add origin https://github.com/sky770825/Hua-Real-Estate.git 2>nul
echo ✅ 已連接到GitHub

echo.
echo 正在推送到GitHub...
echo 注意：如果要求輸入密碼，請使用您的GitHub Token
git push -u origin main
if errorlevel 1 (
    echo ❌ 推送失敗，請檢查網路連接和認證
    echo 提示：您可能需要配置GitHub Token
) else (
    echo ✅ 推送成功！
    echo 您的網站已上線：https://sky770825.github.io/Hua-Real-Estate/
)

echo.
pause
goto start

:upload
echo.
echo ================================
echo ⬆️ 上傳修改到GitHub
echo ================================
echo.

echo 正在檢查修改...
git status
echo.

echo 正在添加修改的檔案...
git add .
echo ✅ 檔案已添加

echo.
set /p commit_msg=請輸入修改說明 (如: 更新首頁內容): 
if "%commit_msg%"=="" set commit_msg=更新內容

echo 正在提交修改...
git commit -m "%commit_msg%"
echo ✅ 提交完成

echo.
echo 正在推送到GitHub...
git push
if errorlevel 1 (
    echo ❌ 推送失敗，請檢查網路連接
) else (
    echo ✅ 推送成功！
    echo 您的修改已上傳到GitHub
)

echo.
pause
goto start

:download
echo.
echo ================================
echo ⬇️ 從GitHub下載最新版本
echo ================================
echo.

echo 正在從GitHub下載最新版本...
git pull
if errorlevel 1 (
    echo ❌ 下載失敗，請檢查網路連接
) else (
    echo ✅ 下載成功！
    echo 您的本地檔案已更新到最新版本
)

echo.
pause
goto start

:status
echo.
echo ================================
echo 📊 查看當前狀態
echo ================================
echo.

echo 當前Git狀態：
echo ================================
git status
echo ================================

echo.
echo 最近提交記錄：
echo ================================
git log --oneline -5
echo ================================

echo.
pause
goto start

:exit
echo.
echo ================================
echo 👋 感謝使用！
echo ================================
echo.
echo 記住：Git就是這麼簡單！
echo 修改檔案 → 上傳 → 完成！
echo.

pause
exit
