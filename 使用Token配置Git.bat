@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ================================
echo 🔐 使用GitHub Token配置Git
echo ================================
echo.

echo 請輸入您的GitHub資訊：
echo.

set /p git_name=請輸入您的姓名 (如: 蔡濬瑒): 
if "%git_name%"=="" (
    echo ❌ 姓名不能為空！
    pause
    exit
)

set /p git_email=請輸入您的Email (如: your.email@example.com): 
if "%git_email%"=="" (
    echo ❌ Email不能為空！
    pause
    exit
)

set /p github_username=請輸入您的GitHub用戶名: 
if "%github_username%"=="" (
    echo ❌ GitHub用戶名不能為空！
    pause
    exit
)

echo.
echo 正在配置Git身份...
git config --global user.name "%git_name%"
git config --global user.email "%git_email%"
git config --global init.defaultBranch main
git config --global credential.helper manager-core
echo ✅ Git身份配置完成

echo.
echo 正在檢查遠端倉庫...
git remote -v >nul 2>&1
if errorlevel 1 (
    echo 正在添加遠端倉庫...
    git remote add origin https://github.com/sky770825/Hua-Real-Estate.git
    echo ✅ 遠端倉庫已添加
) else (
    echo ✅ 遠端倉庫已配置
)

echo.
echo 正在初始化Git倉庫...
if not exist ".git" (
    git init
    echo ✅ Git倉庫已初始化
) else (
    echo ✅ Git倉庫已存在
)

echo.
echo 正在添加檔案到Git...
git add .
git commit -m "初始提交 - %date% %time%"
echo ✅ 檔案已提交

echo.
echo ================================
echo 🚀 準備推送到GitHub
echo ================================
echo.

echo 現在將嘗試推送到GitHub...
echo 當要求輸入密碼時，請使用您的GitHub Token
echo.

echo 正在推送到GitHub...
git push -u origin main
if errorlevel 1 (
    echo.
    echo ❌ 推送失敗！
    echo.
    echo 可能的原因：
    echo 1. Token無效或已過期
    echo 2. 網路連接問題
    echo 3. 倉庫權限問題
    echo.
    echo 請檢查：
    echo - Token是否正確
    echo - 網路連接是否正常
    echo - GitHub用戶名是否正確
    echo.
    echo 您可以手動執行以下命令：
    echo git push -u origin main
    echo.
) else (
    echo.
    echo ================================
    echo 🎉 配置成功！
    echo ================================
    echo.
    echo 您的網站已成功部署到：
    echo GitHub: https://github.com/sky770825/Hua-Real-Estate
    echo 網站: https://sky770825.github.io/Hua-Real-Estate/
    echo.
    echo 現在您可以使用部署工具了：
    echo - 華地產部署工具增強版.bat
    echo - 一鍵部署當前版本.bat
    echo.
)

pause
