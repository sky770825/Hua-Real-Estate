@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:start
echo ================================
echo 📚 Git 圖解說明
echo ================================
echo.

echo 請選擇您想了解的內容：
echo.
echo 1. 什麼是Git？
echo 2. Git的基本概念
echo 3. 第一次使用Git
echo 4. 日常使用Git
echo 5. 常見問題解決
echo 6. 實際操作範例
echo 7. 退出
echo.

set /p choice=請輸入選項 (1-7): 

if "%choice%"=="1" goto what_is_git
if "%choice%"=="2" goto git_concepts
if "%choice%"=="3" goto first_time
if "%choice%"=="4" goto daily_use
if "%choice%"=="5" goto troubleshooting
if "%choice%"=="6" goto examples
if "%choice%"=="7" goto exit
echo 無效選項
pause
goto start

:what_is_git
echo.
echo ================================
echo 🤔 什麼是Git？
echo ================================
echo.

echo Git就像是一個「時光機」：
echo.
echo 📝 記錄每次修改
echo    - 就像拍照一樣，記錄代碼的每個狀態
echo    - 可以隨時回到任何一個版本
echo.
echo 🔄 版本控制
echo    - 可以比較不同版本的差異
echo    - 可以合併多人的修改
echo.
echo ☁️ 雲端同步
echo    - 把代碼存到GitHub
echo    - 多台電腦可以同步
echo    - 多人可以協作開發
echo.
echo 🛡️ 安全備份
echo    - 代碼不會丟失
echo    - 可以恢復到任何版本
echo.

pause
goto start

:git_concepts
echo.
echo ================================
echo 📖 Git的基本概念
echo ================================
echo.

echo 1. 倉庫 (Repository)
echo    📁 就像一個「資料夾」
echo    💻 本地倉庫：存在您的電腦上
echo    ☁️ 遠端倉庫：存在GitHub上
echo.

echo 2. 提交 (Commit)
echo    📸 就像「拍照」，記錄當前狀態
echo    💬 每次修改後都要「拍照」保存
echo    📝 可以加上說明文字
echo.

echo 3. 推送 (Push)
echo    ⬆️ 把本地的修改「上傳」到GitHub
echo    👥 讓其他人也能看到您的修改
echo.

echo 4. 拉取 (Pull)
echo    ⬇️ 從GitHub「下載」最新的修改
echo    🔄 保持本地和遠端同步
echo.

pause
goto start

:first_time
echo.
echo ================================
echo 🚀 第一次使用Git
echo ================================
echo.

echo 步驟1: 配置身份（只需要做一次）
echo ┌─────────────────────────────────┐
echo │ git config --global user.name   │
echo │ "您的姓名"                      │
echo └─────────────────────────────────┘
echo.
echo ┌─────────────────────────────────┐
echo │ git config --global user.email  │
echo │ "您的Email@example.com"         │
echo └─────────────────────────────────┘
echo.

echo 步驟2: 初始化倉庫
echo ┌─────────────────────────────────┐
echo │ git init                        │
echo └─────────────────────────────────┘
echo.

echo 步驟3: 添加檔案
echo ┌─────────────────────────────────┐
echo │ git add .                       │
echo └─────────────────────────────────┘
echo.

echo 步驟4: 提交修改
echo ┌─────────────────────────────────┐
echo │ git commit -m "第一次提交"      │
echo └─────────────────────────────────┘
echo.

echo 步驟5: 連接到GitHub
echo ┌─────────────────────────────────┐
echo │ git remote add origin           │
echo │ https://github.com/.../...git   │
echo └─────────────────────────────────┘
echo.

echo 步驟6: 推送到GitHub
echo ┌─────────────────────────────────┐
echo │ git push -u origin main         │
echo └─────────────────────────────────┘
echo.

echo 💡 提示：使用我們的工具可以自動完成這些步驟！
echo.

pause
goto start

:daily_use
echo.
echo ================================
echo 📅 日常使用Git
echo ================================
echo.

echo 修改檔案後的流程：
echo.
echo 1. 修改檔案
echo    ✏️ 用編輯器打開檔案，修改內容
echo.
echo 2. 添加修改
echo    ┌─────────────────────────────────┐
echo    │ git add .                       │
echo    └─────────────────────────────────┘
echo.
echo 3. 提交修改
echo    ┌─────────────────────────────────┐
echo    │ git commit -m "修改說明"        │
echo    └─────────────────────────────────┘
echo.
echo 4. 推送到GitHub
echo    ┌─────────────────────────────────┐
echo    │ git push                        │
echo    └─────────────────────────────────┘
echo.

echo 常用命令：
echo.
echo 📊 查看狀態
echo    git status
echo.
echo 📜 查看歷史
echo    git log --oneline
echo.
echo ⬇️ 下載最新版本
echo    git pull
echo.

pause
goto start

:troubleshooting
echo.
echo ================================
echo 🔧 常見問題解決
echo ================================
echo.

echo 問題1: 認證失敗
echo ❌ 錯誤: Authentication failed
echo ✅ 解決: 需要配置GitHub認證
echo    使用我們的配置工具
echo.

echo 問題2: 推送被拒絕
echo ❌ 錯誤: rejected
echo ✅ 解決: 先執行 git pull 再推送
echo.

echo 問題3: 忘記提交說明
echo ❌ 錯誤: Please enter a commit message
echo ✅ 解決: 按 Esc 然後輸入 :wq 退出
echo.

echo 問題4: 網路連接問題
echo ❌ 錯誤: 無法連接到GitHub
echo ✅ 解決: 檢查網路連接
echo.

echo 問題5: 檔案被鎖定
echo ❌ 錯誤: 檔案正在使用中
echo ✅ 解決: 關閉正在使用檔案的程式
echo.

echo 💡 提示：使用我們的工具可以避免大部分問題！
echo.

pause
goto start

:examples
echo.
echo ================================
echo 💡 實際操作範例
echo ================================
echo.

echo 範例：更新網站內容
echo.
echo 假設您要修改 index.html 檔案：
echo.
echo 1. 修改檔案
echo    ✏️ 用記事本打開 index.html
echo    ✏️ 修改標題為 "華地產鑽石分會"
echo    💾 儲存檔案
echo.
echo 2. 查看修改
echo    ┌─────────────────────────────────┐
echo    │ git status                      │
echo    └─────────────────────────────────┘
echo.
echo 3. 添加修改
echo    ┌─────────────────────────────────┐
echo    │ git add index.html              │
echo    └─────────────────────────────────┘
echo.
echo 4. 提交修改
echo    ┌─────────────────────────────────┐
echo    │ git commit -m "更新首頁標題"    │
echo    └─────────────────────────────────┘
echo.
echo 5. 推送到GitHub
echo    ┌─────────────────────────────────┐
echo    │ git push                        │
echo    └─────────────────────────────────┘
echo.
echo 完成！您的修改已經上傳到GitHub了！
echo.

pause
goto start

:exit
echo.
echo ================================
echo 👋 感謝使用Git圖解說明！
echo ================================
echo.
echo 記住：Git就像學習騎腳踏車，
echo 一開始可能會跌倒，但學會後就很簡單了！
echo.
echo 使用我們的工具可以讓Git操作變得更簡單！
echo.

pause
exit
