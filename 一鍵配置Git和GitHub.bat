@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ================================
echo 🚀 一鍵配置Git和GitHub
echo ================================
echo.

echo 這個工具會幫您完成所有必要的配置
echo.

echo 步驟1: 檢查Git是否已安裝...
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git未安裝
    echo 請先安裝Git: https://git-scm.com/download/win
    echo 安裝完成後重新執行此腳本
    pause
    exit
)
echo ✅ Git已安裝

echo.
echo 步驟2: 配置Git身份...
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
echo 正在配置Git身份...
git config --global user.name "%git_name%"
git config --global user.email "%git_email%"
git config --global init.defaultBranch main
git config --global credential.helper manager-core
echo ✅ Git身份配置完成

echo.
echo 步驟3: 檢查GitHub倉庫...
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
echo 步驟4: 初始化Git倉庫...
if not exist ".git" (
    echo 正在初始化Git倉庫...
    git init
    echo ✅ Git倉庫已初始化
) else (
    echo ✅ Git倉庫已存在
)

echo.
echo 步驟5: 添加檔案到Git...
git add .
git commit -m "初始提交 - %date% %time%"
echo ✅ 檔案已提交

echo.
echo ================================
echo 🎉 基本配置完成！
echo ================================
echo.

echo 接下來需要配置GitHub認證：
echo.
echo 📋 請按照以下步驟操作：
echo.
echo 1. 前往 https://github.com/settings/tokens
echo 2. 點擊 "Generate new token (classic)"
echo 3. 填寫以下資訊：
echo    - Note: 華地產網站部署
echo    - Expiration: 選擇合適的過期時間
echo    - Scopes: 勾選 "repo" 權限
echo 4. 點擊 "Generate token"
echo 5. 複製生成的token
echo.

echo 配置完成後，請執行以下命令測試：
echo git push -u origin main
echo.
echo 當要求輸入密碼時，使用您的GitHub用戶名和剛才生成的token
echo.

echo 或者，您也可以使用部署工具：
echo - 華地產部署工具增強版.bat
echo - 一鍵部署當前版本.bat
echo.

pause
