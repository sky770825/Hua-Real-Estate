# 🚀 部署到 Vercel 指南

## ✅ GitHub 推送完成

代碼已成功推送到：https://github.com/sky770825/Hua-Sign-PRI

## 🎯 部署到 Vercel 步驟

### 步驟 1: 訪問 Vercel

訪問 [Vercel](https://vercel.com) 並使用 GitHub 帳號登入

### 步驟 2: 創建新專案

1. 點擊右上角 **"Add New..."** → **"Project"**
2. 在 "Import Git Repository" 中選擇 **"sky770825/Hua-Sign-PRI"**
3. 如果看不到，點擊 **"Adjust GitHub App Permissions"** 授權

### 步驟 3: 配置專案

1. **Project Name**: `hua-sign-pri`（或您喜歡的名稱）
2. **Framework Preset**: Next.js（自動檢測）
3. **Root Directory**: `./`（預設）
4. **Build Command**: `npm run build`（預設）
5. **Output Directory**: `.next`（預設）
6. **Install Command**: `npm install`（預設）

### 步驟 4: 環境變數（可選）

如果需要，可以添加環境變數：
- **Key**: `INFORGE_ANON_KEY`
- **Value**: Insforge 匿名金鑰（已有預設值，可選）

### 步驟 5: 部署

1. 點擊 **"Deploy"**
2. 等待構建完成（約 2-5 分鐘）
3. 部署完成後，會獲得網址（例如：`hua-sign-pri.vercel.app`）

## 🌐 訪問網址

部署完成後，您會獲得：
- **生產環境網址**: `https://hua-sign-pri.vercel.app`（或類似）
- **前端簽到頁面**: `https://hua-sign-pri.vercel.app/checkin`
- **抽獎轉盤**: `https://hua-sign-pri.vercel.app/lottery`
- **後台登入**: `https://hua-sign-pri.vercel.app/admin/login`（密碼：`h123`）

## 🔄 自動部署

設置完成後，每次推送到 GitHub 的 `main` 分支，Vercel 會自動：
1. 檢測到新的推送
2. 自動構建
3. 自動部署新版本

## 📝 後續更新

以後要更新網站：

```bash
# 1. 修改代碼
git add .
git commit -m "更新說明"
git push

# 2. Vercel 自動檢測並部署（無需手動操作）
```

## 🔒 安全提示

⚠️ **重要**：您的 GitHub Personal Access Token 已使用過，建議：
1. 在 GitHub 設置中撤銷舊的 token
2. 創建新的 token 用於後續使用
3. 不要將 token 分享給他人

## ✨ Vercel 優勢

- ✅ **完全免費**（個人專案）
- ✅ **自動 HTTPS**
- ✅ **全球 CDN**
- ✅ **自動部署**
- ✅ **無限帶寬**（免費方案）

---

**現在就可以訪問 Vercel 開始部署了！** 🎉

