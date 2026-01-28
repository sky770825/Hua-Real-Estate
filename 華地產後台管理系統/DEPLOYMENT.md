# 部署指南

## 生產環境部署注意事項

### 1. 資料庫配置
- 資料庫檔案位置：`data/checkin.db`
- 確保 `data` 目錄有寫入權限
- 建議定期備份資料庫檔案

### 2. 環境變數（可選）
如需配置環境變數，可創建 `.env.local` 文件：
```
# 資料庫路徑（可選，預設為 data/checkin.db）
DATABASE_PATH=data/checkin.db

# 管理員密碼（可選，預設為 h123）
ADMIN_PASSWORD=h123
```

### 3. 部署步驟

#### 使用 Vercel 部署
1. 將專案推送到 GitHub
2. 在 Vercel 中導入專案
3. 注意：Vercel 是無伺服器環境，SQLite 可能不適合，建議使用外部資料庫

#### 使用傳統伺服器部署（推薦）
1. 安裝 Node.js 18+ 
2. 安裝依賴：`npm install`
3. 構建專案：`npm run build`
4. 啟動服務：`npm start`
5. 確保 `data` 目錄有寫入權限
6. 配置反向代理（Nginx/Apache）

### 4. 資料持久化
- 資料庫檔案：`data/checkin.db` 必須持久化
- 上傳的圖片：`public/uploads` 必須持久化
- 建議使用持久化儲存（如 Docker volume、雲端儲存）

### 5. 安全建議
- 修改預設管理員密碼
- 配置 HTTPS
- 定期備份資料庫
- 限制管理後台訪問（IP 白名單）

### 6. 性能優化
- 啟用 Next.js 生產模式
- 配置 CDN 用於靜態資源
- 考慮使用 Redis 快取（可選）

