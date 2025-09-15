@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ================================
echo 🔧 Git 身份配置工具
echo ================================
echo.

echo 這個工具會幫您配置Git身份，讓GitHub能夠識別您
echo.

echo 請輸入您的Git配置資訊：
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

echo.
echo ================================
echo 正在配置Git身份...
echo ================================
echo.

echo 配置用戶姓名...
git config --global user.name "%git_name%"
if errorlevel 1 (
    echo ❌ 配置姓名失敗
    pause
    exit
)
echo ✅ 用戶姓名已設置: %git_name%

echo.
echo 配置用戶Email...
git config --global user.email "%git_email%"
if errorlevel 1 (
    echo ❌ 配置Email失敗
    pause
    exit
)
echo ✅ 用戶Email已設置: %git_email%

echo.
echo 檢查Git配置...
echo.
echo 當前Git配置：
echo ================================
git config --global --list | findstr user
echo ================================

echo.
echo ================================
echo 🎉 Git身份配置完成！
echo ================================
echo.

echo 接下來您需要配置GitHub認證：
echo.
echo 方法一：使用Personal Access Token (推薦)
echo 1. 前往 https://github.com/settings/tokens
echo 2. 點擊 "Generate new token (classic)"
echo 3. 選擇 "repo" 權限
echo 4. 複製生成的token
echo 5. 在推送時使用token作為密碼
echo.

echo 方法二：使用SSH Key
echo 1. 生成SSH Key: ssh-keygen -t rsa -b 4096 -C "%git_email%"
echo 2. 將公鑰添加到GitHub: https://github.com/settings/keys
echo 3. 測試連接: ssh -T git@github.com
echo.

echo 配置完成後，您就可以使用部署工具了！
echo.

pause
