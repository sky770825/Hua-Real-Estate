# 🚀 Vercel 部署步驟（詳細版）

## ✅ 準備工作已完成

- ✅ 代碼已推送到 GitHub
- ✅ 構建測試通過
- ✅ Vercel 配置文件已創建

## 📋 部署步驟

### 步驟 1: 訪問 Vercel

1. 打開瀏覽器，訪問：**https://vercel.com**
2. 點擊右上角 **"Sign Up"** 或 **"Log In"**
3. 選擇 **"Continue with GitHub"**（使用 GitHub 帳號登入）

### 步驟 2: 授權 GitHub 訪問

1. 如果首次使用，會要求授權 Vercel 訪問 GitHub
2. 點擊 **"Authorize Vercel"** 或 **"Install"**
3. 選擇要授權的倉庫（可以選擇 "All repositories" 或只選擇 `Hua-Sign-PRI`）

### 步驟 3: 創建新專案

1. 登入後，點擊右上角 **"Add New..."** → **"Project"**
2. 在 "Import Git Repository" 中，您應該能看到 **"sky770825/Hua-Sign-PRI"**
3. 如果看不到，點擊 **"Adjust GitHub App Permissions"** 重新授權
4. 點擊 **"Import"** 旁邊的倉庫名稱

### 步驟 4: 配置專案

Vercel 會自動檢測 Next.js，大部分設置已自動配置：

1. **Project Name**: `hua-sign-pri`（可以修改為您喜歡的名稱）
2. **Framework Preset**: `Next.js`（自動檢測，無需修改）
3. **Root Directory**: `./`（預設，無需修改）
4. **Build Command**: `npm run build`（預設，無需修改）
5. **Output Directory**: `.next`（預設，無需修改）
6. **Install Command**: `npm install`（預設，無需修改）

### 步驟 5: 環境變數（可選）

如果需要自定義 Insforge 金鑰，可以添加：
- **Key**: `INFORGE_ANON_KEY`
- **Value**: 您的 Insforge 匿名金鑰（已有預設值，可選）

**注意**：目前已有預設值，可以跳過這一步。

### 步驟 6: 部署

1. 確認所有設置無誤
2. 點擊右下角 **"Deploy"** 按鈕
3. 等待構建完成（約 2-5 分鐘）
4. 構建過程中可以看到實時日誌

### 步驟 7: 獲得網址

部署完成後，您會看到：
- ✅ **部署成功** 的提示
- 🌐 **網址**（例如：`https://hua-sign-pri.vercel.app`）

## 🌐 訪問網址

部署完成後，您可以使用以下網址：

- **主網址**: `https://hua-sign-pri.vercel.app`（或您設置的名稱）
- **前端簽到頁面**: `https://hua-sign-pri.vercel.app/checkin`
- **抽獎轉盤**: `https://hua-sign-pri.vercel.app/lottery`
- **後台登入**: `https://hua-sign-pri.vercel.app/admin/login`
  - 密碼: `h123`
- **後台管理**: `https://hua-sign-pri.vercel.app/admin/attendance_management`

## 🔄 自動部署

設置完成後，每次您推送到 GitHub 的 `main` 分支，Vercel 會自動：
1. 檢測到新的推送
2. 自動構建
3. 自動部署新版本

**無需手動操作！**

## 📝 後續更新

以後要更新網站：

```bash
# 1. 修改代碼
git add .
git commit -m "更新說明"
git push

# 2. Vercel 自動檢測並部署（無需手動操作）
```

## 🎯 快速連結

- **Vercel 首頁**: https://vercel.com
- **GitHub 倉庫**: https://github.com/sky770825/Hua-Sign-PRI
- **Vercel 文檔**: https://vercel.com/docs

## ✨ Vercel 優勢

- ✅ **完全免費**（個人專案）
- ✅ **自動 HTTPS**
- ✅ **全球 CDN**（快速訪問）
- ✅ **自動部署**（推送到 GitHub 自動部署）
- ✅ **無限帶寬**（免費方案）
- ✅ **實時日誌**（方便調試）

---

**現在就可以訪問 https://vercel.com 開始部署了！** 🎉

部署完成後，您就可以通過公開網址訪問您的簽到系統了！

