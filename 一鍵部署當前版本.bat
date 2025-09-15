@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ================================
echo 🚀 華地產網站 - 一鍵部署當前版本
echo ================================
echo.

echo 正在檢查Git狀態...
git status >nul 2>&1
if errorlevel 1 (
    echo ❌ Git未初始化
    echo 請先執行 "華地產部署工具增強版.bat" 並選擇 "5. 初始化Git倉庫"
    pause
    exit
)
echo ✅ Git狀態正常

echo.
echo 正在備份當前檔案...
if not exist "backup_auto" mkdir backup_auto
copy index.html backup_auto\ 2>nul
copy styles.css backup_auto\ 2>nul
copy script.js backup_auto\ 2>nul
copy *.txt backup_auto\ 2>nul
copy *.md backup_auto\ 2>nul
echo ✅ 檔案已備份

echo.
echo 正在添加檔案到Git...
git add .
echo ✅ 檔案已添加

echo.
echo 正在提交變更...
set commit_msg=自動部署 - %date% %time%
git commit -m "%commit_msg%"
echo ✅ 變更已提交

echo.
echo 正在推送到GitHub...
git push origin main
if errorlevel 1 (
    echo ❌ 推送失敗，請檢查網路連接
    echo 提示：可能需要重新配置Git認證
    pause
    exit
)
echo ✅ 推送成功

echo.
echo ================================
echo 🎉 部署完成！
echo ================================
echo.
echo 部署資訊：
echo   時間：%date% %time%
echo   GitHub：https://github.com/sky770825/Hua-Real-Estate
echo   網站：https://sky770825.github.io/Hua-Real-Estate/
echo.
echo 備份位置：backup_auto 資料夾
echo.

pause
