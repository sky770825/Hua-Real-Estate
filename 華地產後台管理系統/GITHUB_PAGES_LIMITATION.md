# ⚠️ GitHub Pages 限制說明

## 問題

**GitHub Pages 只支持靜態網站**，而您的專案是 Next.js 應用，包含：
- API 路由（需要服務器端運行）
- 服務器端渲染
- 動態功能

這些功能在 GitHub Pages 上**無法運行**。

## 解決方案

### 方案 1: 使用 Vercel（強烈推薦 ⭐⭐⭐⭐⭐）

**優點**：
- ✅ 完全免費
- ✅ 完美支持 Next.js（包括 API 路由）
- ✅ 自動部署（推送到 GitHub 自動部署）
- ✅ 自動 HTTPS
- ✅ 全球 CDN
- ✅ 與 GitHub 完美集成

**步驟**：
1. 訪問 https://vercel.com
2. 使用 GitHub 登入
3. 導入 `sky770825/Hua-Sign-PRI` 倉庫
4. 點擊 "Deploy"
5. 幾分鐘後獲得網址（例如：`hua-sign-pri.vercel.app`）

### 方案 2: 使用 Netlify

類似 Vercel，也支持 Next.js 完整功能。

### 方案 3: 使用 GitHub Actions + 其他平台

可以設置 GitHub Actions 自動部署到其他平台。

## ❌ 不推薦：GitHub Pages

如果強制使用 GitHub Pages，需要：
1. 將 Next.js 導出為靜態網站
2. **失去所有 API 路由功能**
3. **失去服務器端功能**
4. 需要重寫所有 API 調用為直接調用 Insforge

這會導致大量代碼需要修改，且功能受限。

## 🎯 建議

**強烈建議使用 Vercel**，因為：
- 您的代碼已經在 GitHub 上
- Vercel 與 GitHub 完美集成
- 一鍵部署，無需修改代碼
- 完全免費
- 支持所有 Next.js 功能

---

**結論**：GitHub Pages 不適合 Next.js 應用，請使用 Vercel 或其他支持 Next.js 的平台。

