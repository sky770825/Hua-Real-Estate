@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ================================
echo 🔧 修復Git推送問題
echo ================================
echo.

echo 正在診斷問題...
echo.

echo 檢查Git狀態...
git status
echo.

echo 檢查分支...
git branch
echo.

echo 檢查提交記錄...
git log --oneline
echo.

echo ================================
echo 🚀 開始修復
echo ================================
echo.

echo 步驟1: 確保所有檔案都已添加...
git add .
echo ✅ 檔案已添加

echo.
echo 步驟2: 檢查是否有檔案需要提交...
git status --porcelain
if errorlevel 1 (
    echo 沒有檔案需要提交
) else (
    echo 發現未提交的檔案
)

echo.
echo 步驟3: 創建初始提交...
git commit -m "初始提交 - 華地產網站 v1.0 - %date% %time%"
if errorlevel 1 (
    echo ❌ 提交失敗，可能沒有變更
    echo 正在檢查是否有檔案...
    dir /b *.html *.css *.js 2>nul
    if errorlevel 1 (
        echo ❌ 沒有找到網站檔案！
        echo 請確保在正確的資料夾中執行此腳本
        pause
        exit
    )
) else (
    echo ✅ 提交成功
)

echo.
echo 步驟4: 檢查分支...
git branch
echo.

echo 步驟5: 確保有main分支...
git checkout -b main 2>nul
if errorlevel 1 (
    echo main分支已存在
) else (
    echo ✅ main分支已創建
)

echo.
echo 步驟6: 檢查遠端倉庫...
git remote -v
if errorlevel 1 (
    echo 正在添加遠端倉庫...
    git remote add origin https://github.com/sky770825/Hua-Real-Estate.git
    echo ✅ 遠端倉庫已添加
) else (
    echo ✅ 遠端倉庫已配置
)

echo.
echo 步驟7: 嘗試推送到GitHub...
echo 注意：如果要求輸入密碼，請使用您的GitHub Token
git push -u origin main
if errorlevel 1 (
    echo.
    echo ❌ 推送失敗！
    echo.
    echo 可能的原因：
    echo 1. GitHub認證問題
    echo 2. 網路連接問題
    echo 3. 倉庫權限問題
    echo.
    echo 解決方案：
    echo 1. 檢查網路連接
    echo 2. 確認GitHub Token是否正確
    echo 3. 確認倉庫權限
    echo.
    echo 手動執行以下命令：
    echo git push -u origin main
    echo.
    echo 當要求輸入密碼時，使用您的GitHub Token
) else (
    echo.
    echo ================================
    echo 🎉 修復成功！
    echo ================================
    echo.
    echo 您的網站已成功上線：
    echo GitHub: https://github.com/sky770825/Hua-Real-Estate
    echo 網站: https://sky770825.github.io/Hua-Real-Estate/
    echo.
    echo 現在您可以使用其他部署工具了！
)

echo.
pause
