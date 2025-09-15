@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ================================
echo 🚀 簡單修復推送問題
echo ================================
echo.

echo 正在修復推送問題...
echo.

echo 步驟1: 下載GitHub內容...
echo 這會將GitHub上的內容下載到您的電腦
git pull origin main --allow-unrelated-histories
if errorlevel 1 (
    echo ❌ 下載失敗，嘗試其他方法...
    echo.
    echo 正在獲取遠端內容...
    git fetch origin main
    echo ✅ 遠端內容已獲取
    echo.
    echo 正在合併內容...
    git merge origin/main --allow-unrelated-histories
    if errorlevel 1 (
        echo ❌ 合併失敗
        echo 請手動解決衝突或選擇強制覆蓋
        pause
        exit
    )
) else (
    echo ✅ GitHub內容已下載
)

echo.
echo 步驟2: 檢查當前狀態...
git status
echo.

echo 步驟3: 推送到GitHub...
git push origin main
if errorlevel 1 (
    echo ❌ 推送失敗
    echo.
    echo 如果仍然失敗，請嘗試：
    echo 1. 檢查網路連接
    echo 2. 確認GitHub Token是否正確
    echo 3. 手動執行：git push origin main
) else (
    echo.
    echo ================================
    echo 🎉 修復成功！
    echo ================================
    echo.
    echo 您的網站已成功更新：
    echo GitHub: https://github.com/sky770825/Hua-Real-Estate
    echo 網站: https://sky770825.github.io/Hua-Real-Estate/
    echo.
    echo 現在您可以正常使用部署工具了！
)

echo.
pause
