# 📤 推送到 GitHub 步驟

## ✅ 已完成

- ✅ Git 倉庫已初始化
- ✅ 所有檔案已提交
- ✅ `.gitignore` 已配置（不會提交 node_modules、資料庫等）

## 🚀 推送到 GitHub 步驟

### 步驟 1: 在 GitHub 創建新倉庫

1. 登入 [GitHub](https://github.com)
2. 點擊右上角 **"+"** → **"New repository"**
3. 填寫資訊：
   - **Repository name**: `hua-checkin-system`（或您喜歡的名稱）
   - **Description**: `華地產線上鑽石分會簽到系統`
   - **Visibility**: 選擇 **Private**（私有）或 **Public**（公開）
   - ⚠️ **不要**勾選 "Initialize with README"（我們已經有代碼了）
4. 點擊 **"Create repository"**

### 步驟 2: 連接本地倉庫到 GitHub

複製 GitHub 提供的命令，或執行以下命令（替換 YOUR_USERNAME 和 YOUR_REPO_NAME）：

```bash
# 方式 1: 使用 HTTPS（推薦）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main

# 方式 2: 使用 SSH（如果您已設置 SSH 金鑰）
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 步驟 3: 驗證

推送完成後，在 GitHub 網頁上應該能看到所有檔案。

## 🎯 部署到 Vercel（推薦）

推送完成後，可以立即部署：

### 快速部署步驟

1. 訪問 [Vercel](https://vercel.com)
2. 使用 GitHub 帳號登入
3. 點擊 **"New Project"**
4. 選擇您的 GitHub 倉庫
5. 點擊 **"Deploy"**
6. 等待幾分鐘，獲得網址（例如：`your-project.vercel.app`）

### 環境變數（可選）

如果需要，可以在 Vercel 設置環境變數：
- `INFORGE_ANON_KEY` - Insforge 匿名金鑰（已有預設值，可選）

## 📝 後續更新

以後要更新代碼：

```bash
# 1. 修改代碼後
git add .
git commit -m "更新說明"
git push

# 2. Vercel 會自動檢測並部署新版本
```

## 🔒 安全提示

- ✅ `.env.local` 已在 `.gitignore` 中，不會被提交
- ✅ 資料庫檔案不會被提交
- ✅ `node_modules` 不會被提交
- ✅ Insforge 金鑰使用預設值（可選設置環境變數）

## ❓ 常見問題

### Q: 推送時要求輸入帳號密碼？
A: 使用 Personal Access Token 代替密碼，或設置 SSH 金鑰。

### Q: 如何設置 SSH 金鑰？
A: 參考 [GitHub SSH 設置指南](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

### Q: 推送失敗怎麼辦？
A: 檢查網路連接，或使用 `git push -v` 查看詳細錯誤訊息。

---

**提示**：推送到 GitHub 後，建議立即部署到 Vercel，這樣就有線上網址可以使用了！

