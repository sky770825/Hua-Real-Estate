# 🚀 GitHub 部署指南

## 📋 部署選項

### 選項 1: GitHub + Vercel（推薦 ⭐）

**優點**：
- ✅ 完全免費
- ✅ 自動部署（推送到 GitHub 自動部署）
- ✅ 支援 Next.js 完整功能
- ✅ 自動 HTTPS
- ✅ 全球 CDN

**步驟**：
1. 將代碼推送到 GitHub
2. 在 [Vercel](https://vercel.com) 註冊/登入
3. 點擊 "New Project"
4. 導入 GitHub 倉庫
5. 自動部署完成，獲得網址（例如：`your-project.vercel.app`）

### 選項 2: GitHub + Netlify

**步驟**：
1. 將代碼推送到 GitHub
2. 在 [Netlify](https://netlify.com) 註冊/登入
3. 點擊 "New site from Git"
4. 選擇 GitHub 倉庫
5. 構建設置：
   - Build command: `npm run build`
   - Publish directory: `.next`
6. 部署完成

### 選項 3: GitHub Pages（不推薦）

⚠️ **注意**：GitHub Pages 只支持靜態網站，Next.js 需要服務器端渲染，不適合。

## 🔧 設置步驟

### 1. 初始化 Git 倉庫（如果還沒有）

```bash
git init
git add .
git commit -m "Initial commit: 華地產簽到系統"
```

### 2. 在 GitHub 創建新倉庫

1. 登入 GitHub
2. 點擊右上角 "+" → "New repository"
3. 倉庫名稱：例如 `hua-checkin-system`
4. 選擇 Private（私有）或 Public（公開）
5. **不要**勾選 "Initialize with README"
6. 點擊 "Create repository"

### 3. 連接本地倉庫到 GitHub

```bash
# 替換 YOUR_USERNAME 和 YOUR_REPO_NAME
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 4. 設置環境變數（在 Vercel/Netlify）

在部署平台設置以下環境變數（可選）：
- `INFORGE_ANON_KEY` - Insforge 匿名金鑰（已有預設值，可選）

## 📝 重要檔案

以下檔案已配置好：
- ✅ `.gitignore` - 已排除 node_modules、.next、資料庫檔案等
- ✅ `package.json` - 已包含所有依賴
- ✅ `next.config.js` - 已優化生產環境配置

## 🔒 安全提示

1. **不要提交敏感資訊**：
   - `.env.local` 已在 `.gitignore` 中
   - 資料庫檔案不會被提交
   - Insforge 金鑰使用預設值（可選設置環境變數）

2. **使用環境變數**：
   - 在 Vercel/Netlify 設置環境變數
   - 不要將敏感資訊提交到 GitHub

## 🎯 自動部署流程

設置完成後：
1. 本地修改代碼
2. `git add .`
3. `git commit -m "更新說明"`
4. `git push`
5. Vercel/Netlify 自動檢測並部署
6. 幾分鐘後新版本上線

## 📚 相關文檔

- [Vercel 文檔](https://vercel.com/docs)
- [Netlify 文檔](https://docs.netlify.com)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**提示**：推薦使用 Vercel，因為它對 Next.js 有最好的支持，且完全免費。

