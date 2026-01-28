# 🚀 啟動指南

## 開發環境啟動

### 1. 啟動開發服務器

```bash
npm run dev
```

### 2. 訪問網址

啟動成功後，訪問以下網址：

- **前端簽到頁面**: http://localhost:3000/checkin
- **抽獎轉盤頁面**: http://localhost:3000/lottery
- **後台登入頁面**: http://localhost:3000/admin/login
  - 密碼: `h123`
- **後台管理系統**: http://localhost:3000/admin/attendance_management

## 生產環境部署

### 方式 1: 使用 Vercel（推薦）

1. 將專案推送到 GitHub
2. 在 [Vercel](https://vercel.com) 中導入專案
3. 設置環境變數（可選）：
   - `INFORGE_ANON_KEY` - Insforge 匿名金鑰
4. 自動部署完成後，Vercel 會提供網址

### 方式 2: 傳統伺服器部署

```bash
# 1. 構建專案
npm run build

# 2. 啟動生產服務器
npm start
```

訪問：http://localhost:3000

### 方式 3: 使用 PM2（推薦用於生產環境）

```bash
# 安裝 PM2
npm install -g pm2

# 啟動應用
pm2 start npm --name "checkin-system" -- start

# 查看狀態
pm2 status

# 查看日誌
pm2 logs checkin-system
```

## 環境變數配置（可選）

創建 `.env.local` 文件：

```env
# Insforge 匿名金鑰（可選，已有預設值）
INFORGE_ANON_KEY=your_anon_key_here

# 資料庫路徑（已不使用，保留用於備份）
DATABASE_PATH=data/checkin.db
```

## 重要提示

- 開發環境使用 `npm run dev`
- 生產環境使用 `npm run build` + `npm start`
- 所有資料現在儲存在 Insforge 雲端資料庫
- 圖片上傳到 Insforge Storage

## 故障排除

### 端口被占用
如果 3000 端口被占用，可以：
```bash
# 使用其他端口
PORT=3001 npm run dev
```

### 無法連接 Insforge
檢查 `lib/insforge.ts` 中的配置是否正確。

