# Google Sheets 同步功能設置指南

## 📋 功能說明

系統會自動將會員資料同步到 Google Sheets，方便查看和編輯。

### 同步時機
- ✅ **新增會員**：自動同步
- ✅ **更新會員**：自動同步
- ✅ **刪除會員**：自動同步
- ✅ **手動同步**：點擊「同步到 Sheets」按鈕

### 資料庫架構
- **主要資料庫**：Insforge PostgreSQL（SQL）
- **備份/查看**：Google Sheets（自動同步）

## 🔧 設置步驟

### 步驟 1：創建 Google Cloud 專案

1. 訪問 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新專案或選擇現有專案
3. 啟用 **Google Sheets API**：
   - 在「API 和服務」→「程式庫」中搜尋「Google Sheets API」
   - 點擊「啟用」

### 步驟 2：創建服務帳號

1. 在「API 和服務」→「憑證」中，點擊「建立憑證」→「服務帳號」
2. 填寫服務帳號資訊：
   - **服務帳號名稱**：例如 `checkin-sync`
   - **服務帳號 ID**：自動生成
   - **說明**：用於同步會員資料到 Google Sheets
3. 點擊「建立並繼續」
4. 跳過角色設定，直接點擊「完成」

### 步驟 3：創建服務帳號金鑰

1. 在服務帳號列表中，點擊剛創建的服務帳號
2. 切換到「金鑰」標籤
3. 點擊「新增金鑰」→「建立新金鑰」
4. 選擇「JSON」格式
5. 下載 JSON 檔案（會自動下載）

### 步驟 4：創建 Google Sheets

1. 在 [Google Sheets](https://sheets.google.com/) 創建新的試算表
2. 將試算表命名為「會員資料」或您喜歡的名稱
3. 複製試算表的 ID（從 URL 中獲取）：
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```
   例如：`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 步驟 5：分享試算表給服務帳號

1. 在 Google Sheets 中，點擊右上角的「共用」按鈕
2. 在「新增人員或群組」欄位中，貼上服務帳號的 Email（在 JSON 檔案中的 `client_email`）
3. 設定權限為「編輯者」
4. 點擊「傳送」（不需要勾選「通知人員」）

### 步驟 6：設置環境變數

在專案的 `.env.local` 檔案中添加以下環境變數：

```env
# Google Sheets 配置
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
```

**重要提示：**
- `GOOGLE_SHEETS_PRIVATE_KEY` 需要包含完整的私鑰，包括 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----`
- 如果私鑰中有 `\n`，需要保留（系統會自動處理）
- 可以從下載的 JSON 檔案中複製 `private_key` 欄位

### 步驟 7：在 Vercel 設置環境變數（生產環境）

1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇您的專案
3. 進入「Settings」→「Environment Variables」
4. 添加以下環境變數：
   - `GOOGLE_SHEETS_CLIENT_EMAIL`
   - `GOOGLE_SHEETS_PRIVATE_KEY`
   - `GOOGLE_SHEETS_SPREADSHEET_ID`
5. 點擊「Save」
6. 重新部署專案

## ✅ 驗證設置

### 方法 1：使用 API 測試

訪問以下 URL 測試連線：
```
GET /api/sync/sheets
```

如果設置正確，會返回：
```json
{
  "success": true,
  "message": "成功連接到 Google Sheets: 試算表名稱",
  "title": "試算表名稱"
}
```

### 方法 2：手動同步

1. 登入後台管理系統
2. 進入「會員管理」標籤
3. 點擊「📊 同步到 Sheets」按鈕
4. 如果成功，會顯示「成功同步 X 筆會員資料到 Google Sheets」
5. 檢查 Google Sheets 是否已更新

## 📊 Google Sheets 格式

同步後的 Google Sheets 格式：

| 編號 | 姓名 | 專業別 |
|------|------|--------|
| 1 | 洪怡芳Ruby | 包租代管平台 |
| 2 | 何青馨Eva | 人壽房產金融 |
| ... | ... | ... |

- 第一行為標題行（粗體、灰色背景）
- 資料從第二行開始
- 每次同步會清空現有資料並重新寫入

## 🔍 故障排除

### 問題 1：同步失敗，顯示「認證失敗」

**解決方法：**
- 檢查 `GOOGLE_SHEETS_CLIENT_EMAIL` 是否正確
- 檢查 `GOOGLE_SHEETS_PRIVATE_KEY` 是否完整（包括 BEGIN/END 標記）
- 確認服務帳號已分享試算表權限

### 問題 2：同步失敗，顯示「無法連接到 Google Sheets」

**解決方法：**
- 檢查 `GOOGLE_SHEETS_SPREADSHEET_ID` 是否正確
- 確認試算表已分享給服務帳號
- 確認 Google Sheets API 已啟用

### 問題 3：同步成功但資料沒有更新

**解決方法：**
- 檢查試算表的工作表名稱是否為「會員資料」
- 確認服務帳號有「編輯者」權限
- 查看瀏覽器 Console 是否有錯誤訊息

### 問題 4：環境變數設置後仍無法同步

**解決方法：**
- 確認 `.env.local` 檔案在專案根目錄
- 重新啟動開發服務器（`npm run dev`）
- 在 Vercel 中確認環境變數已設置並重新部署

## 📝 注意事項

1. **資料庫為主**：PostgreSQL 是主要資料庫，Google Sheets 只是備份/查看
2. **單向同步**：目前只支援 PostgreSQL → Google Sheets（不支援反向同步）
3. **自動同步**：新增/更新/刪除會員時會自動同步（背景執行，不影響操作速度）
4. **手動同步**：可以隨時點擊「同步到 Sheets」按鈕手動同步
5. **資料安全**：服務帳號金鑰請妥善保管，不要提交到 Git

## 🎯 使用建議

1. **定期檢查**：建議每週檢查一次 Google Sheets 是否正常同步
2. **備份用途**：Google Sheets 可以作為資料備份，但主要操作仍在後台系統
3. **多人協作**：可以將 Google Sheets 分享給其他需要查看的人員（只讀權限）

---

**設置完成後，系統會自動在每次新增/更新/刪除會員時同步到 Google Sheets！** 🎉

