@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ================================
echo 🚀 一鍵修復並部署
echo ================================
echo.

echo 這個工具會修復Git問題並部署您的網站
echo.

echo 步驟1: 檢查當前狀態...
echo.
echo 檢查檔案...
if not exist "index.html" (
    echo ❌ 找不到 index.html 檔案！
    echo 請確保在正確的資料夾中執行此腳本
    pause
    exit
)
echo ✅ 找到網站檔案

echo.
echo 檢查Git狀態...
git status >nul 2>&1
if errorlevel 1 (
    echo 正在初始化Git倉庫...
    git init
    echo ✅ Git倉庫已初始化
) else (
    echo ✅ Git倉庫已存在
)

echo.
echo 步驟2: 配置Git身份...
set /p git_name=請輸入您的姓名 (如: 蔡濬瑒): 
if "%git_name%"=="" set git_name=華地產用戶

set /p git_email=請輸入您的Email: 
if "%git_email%"=="" set git_email=user@example.com

git config --global user.name "%git_name%"
git config --global user.email "%git_email%"
echo ✅ Git身份已配置

echo.
echo 步驟3: 添加所有檔案...
git add .
echo ✅ 檔案已添加

echo.
echo 步驟4: 創建提交...
git commit -m "華地產網站初始版本 - %date% %time%"
echo ✅ 提交已創建

echo.
echo 步驟5: 配置遠端倉庫...
git remote remove origin 2>nul
git remote add origin https://github.com/sky770825/Hua-Real-Estate.git
echo ✅ 遠端倉庫已配置

echo.
echo 步驟6: 推送到GitHub...
echo 注意：如果要求輸入密碼，請使用您的GitHub Token
echo.
git push -u origin main
if errorlevel 1 (
    echo.
    echo ❌ 推送失敗！
    echo.
    echo 請嘗試以下解決方案：
    echo.
    echo 1. 檢查網路連接
    echo 2. 確認GitHub Token是否正確
    echo 3. 手動執行：git push -u origin main
    echo.
    echo 當要求輸入密碼時：
    echo - 用戶名：您的GitHub用戶名
    echo - 密碼：您的GitHub Token
    echo.
) else (
    echo.
    echo ================================
    echo 🎉 部署成功！
    echo ================================
    echo.
    echo 您的網站已成功上線：
    echo.
    echo 📁 GitHub倉庫：
    echo    https://github.com/sky770825/Hua-Real-Estate
    echo.
    echo 🌐 網站地址：
    echo    https://sky770825.github.io/Hua-Real-Estate/
    echo.
    echo 現在您可以使用其他部署工具了：
    echo - 華地產部署工具增強版.bat
    echo - 一鍵部署當前版本.bat
    echo.
)

echo.
pause
