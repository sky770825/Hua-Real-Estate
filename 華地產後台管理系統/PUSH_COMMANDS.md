# 📤 推送到 GitHub 命令

## ✅ 遠程倉庫已設置

遠程倉庫已設置為：`https://github.com/sky770825/Hua-Sign-PRI.git`

## 🚀 推送方式

### 方式 1: 使用 Personal Access Token（推薦）

1. **創建 Personal Access Token**：
   - 訪問：https://github.com/settings/tokens
   - 點擊 "Generate new token" → "Generate new token (classic)"
   - 設置名稱：例如 "Hua-Sign-PRI"
   - 選擇過期時間
   - 勾選權限：`repo`（完整倉庫權限）
   - 點擊 "Generate token"
   - **複製 token**（只顯示一次，請保存好）

2. **推送代碼**：
```bash
cd "/Users/caijunchang/Desktop/程式專案資料夾/華地產簽到功能"
git push -u origin main
```

當提示輸入用戶名時：
- **Username**: `sky770825`
- **Password**: 貼上剛才複製的 **Personal Access Token**（不是 GitHub 密碼）

### 方式 2: 使用 SSH（如果您已設置 SSH 金鑰）

```bash
# 更改遠程 URL 為 SSH
git remote set-url origin git@github.com:sky770825/Hua-Sign-PRI.git

# 推送
git push -u origin main
```

### 方式 3: 使用 GitHub CLI

```bash
# 安裝 GitHub CLI（如果還沒有）
brew install gh

# 登入
gh auth login

# 推送
git push -u origin main
```

## ✅ 驗證推送成功

推送成功後，訪問 https://github.com/sky770825/Hua-Sign-PRI 應該能看到所有檔案。

## 🎯 下一步：部署到 Vercel

推送完成後，可以立即部署：

1. 訪問 [Vercel](https://vercel.com)
2. 使用 GitHub 帳號登入
3. 點擊 "New Project"
4. 選擇 `sky770825/Hua-Sign-PRI` 倉庫
5. 點擊 "Deploy"
6. 等待幾分鐘，獲得網址（例如：`hua-sign-pri.vercel.app`）

---

**提示**：推薦使用方式 1（Personal Access Token），最簡單快速。

