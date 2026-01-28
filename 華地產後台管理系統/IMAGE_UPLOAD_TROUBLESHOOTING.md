# 🔍 圖片上傳問題排查指南

## 🎯 快速診斷步驟

### 步驟 1：檢查前端是否正確發送圖片

1. 打開瀏覽器開發者工具（F12）
2. 切換到 "Network" 標籤
3. 嘗試上傳圖片
4. 找到 `/api/prizes` 請求
5. 檢查：
   - **Request Payload** 中是否有 `image` 欄位
   - **Content-Type** 是否為 `multipart/form-data`
   - **檔案大小** 是否正確

### 步驟 2：查看 Vercel 函數日誌

1. 訪問 Vercel Dashboard：
   ```
   https://vercel.com/linebot/hua-sign-pri-j5js
   ```

2. 點擊 "Functions" 標籤

3. 找到 `/api/prizes` 函數

4. 查看日誌，尋找以下關鍵信息：
   - `開始上傳圖片:` - 確認上傳開始
   - `上傳結果:` - 查看上傳結果
   - `圖片上傳錯誤詳情:` - 查看詳細錯誤

### 步驟 3：檢查常見問題

## 🔍 常見問題和解決方法

### 問題 1：儲存桶不存在

**症狀**：
- 錯誤訊息包含 `bucket not found` 或 `404`
- 日誌顯示 `儲存桶不存在或無權限`

**解決方法**：
1. 登入 Insforge Dashboard
2. 進入 Storage 設置
3. 確認 `checkin-prizes` 儲存桶存在
4. 如果不存在，創建該儲存桶：
   - 名稱：`checkin-prizes`
   - 權限：公開（Public）或服務端 key 有權限

### 問題 2：環境變數未設置

**症狀**：
- 日誌顯示 `serviceKeySet: false`
- 錯誤訊息包含 `foreign key constraint`

**解決方法**：
1. 訪問 Vercel Dashboard：
   ```
   https://vercel.com/linebot/hua-sign-pri-j5js/settings/environment-variables
   ```

2. 確認以下環境變數已設置：
   - `INFORGE_ANON_KEY` ✅
   - `INFORGE_SERVICE_KEY` ⚠️ **重要！**

3. 如果 `INFORGE_SERVICE_KEY` 未設置：
   - 獲取服務端 key（見下方）
   - 添加到環境變數
   - 重新部署

### 問題 3：服務端 Key 無效

**症狀**：
- 錯誤訊息包含 `permission denied` 或 `403`
- 日誌顯示 `serviceKeySet: true` 但仍有錯誤

**解決方法**：
1. 確認服務端 key 是有效的
2. 確認 key 對應的用戶存在
3. 確認用戶有上傳權限
4. 重新生成服務端 key 並更新環境變數

### 問題 4：上傳成功但無 URL

**症狀**：
- 日誌顯示 `上傳成功` 但 `imageUrl` 為空
- 錯誤訊息：`上傳成功但無法獲取圖片 URL`

**解決方法**：
1. 查看日誌中的 `uploadData` 結構
2. 系統會自動嘗試手動構建 URL
3. 如果仍失敗，檢查 Insforge Storage 的 URL 格式

### 問題 5：速率限制

**症狀**：
- 錯誤訊息：`請求過於頻繁` 或 `429`
- 日誌顯示速率限制錯誤

**解決方法**：
- 等待 1-2 分鐘後再試
- 確認沒有其他程序在發送請求

## 🔑 如何獲取服務端 Key

### 方法 1：從 Insforge Dashboard

1. 登入 Insforge Dashboard
2. 進入專案設置
3. 找到 "API Keys" 或 "Service Keys"
4. 複製服務端 key（service key 或 admin key）

### 方法 2：創建系統用戶

1. 在 Insforge 後台創建一個系統用戶
2. 使用該用戶登入
3. 獲取 JWT Token（從瀏覽器 localStorage 或 API 響應）
4. 將此 token 設置為 `INFORGE_SERVICE_KEY`

### 方法 3：使用現有用戶

1. 使用現有有效用戶登入 Insforge
2. 獲取該用戶的 JWT Token
3. 設置為 `INFORGE_SERVICE_KEY`

## 📋 完整檢查清單

### 環境變數
- [ ] `INFORGE_ANON_KEY` 已設置
- [ ] `INFORGE_SERVICE_KEY` 已設置 ⚠️ **必須**
- [ ] 環境變數已應用到所有環境

### Insforge 設置
- [ ] `checkin-prizes` 儲存桶已創建
- [ ] 儲存桶權限設置正確
- [ ] 服務端 key 對應的用戶存在且有效

### 代碼檢查
- [ ] 使用 `insforgeService` 進行上傳
- [ ] 檔案已轉換為 Blob
- [ ] 檔案大小和類型驗證通過

## 🚀 測試步驟

1. **等待部署完成**（約 2-5 分鐘）

2. **打開瀏覽器開發者工具**（F12）

3. **切換到 Network 標籤**

4. **嘗試上傳圖片**：
   - 訪問後台管理頁面
   - 點擊「新增獎品」
   - 選擇圖片檔案（建議使用小於 1MB 的 JPG）
   - 點擊「儲存」

5. **查看 Network 請求**：
   - 找到 `/api/prizes` 請求
   - 檢查請求狀態碼
   - 查看響應內容

6. **查看 Vercel 日誌**：
   - 訪問 Vercel Dashboard
   - 查看函數日誌
   - 尋找診斷信息

## 📝 日誌示例

### 成功上傳的日誌

```
開始上傳圖片: {
  fileName: 'prizes/1234567890-abc123.jpg',
  fileSize: 123456,
  fileType: 'image/jpeg',
  bucket: 'checkin-prizes',
  serviceKeySet: true
}
上傳結果: {
  hasData: true,
  hasError: false,
  data: { url: 'https://...', key: 'prizes/...' }
}
上傳成功: {
  imageUrl: 'https://...',
  imageKey: 'prizes/...',
  uploadData: { ... }
}
```

### 失敗上傳的日誌

```
開始上傳圖片: { ... }
上傳結果: {
  hasData: false,
  hasError: true,
  error: { message: '...', code: '...' }
}
圖片上傳錯誤詳情: {
  error: { ... },
  message: 'bucket not found',
  code: '404',
  fileName: '...',
  bucket: 'checkin-prizes',
  serviceKeySet: false  // ⚠️ 這表示環境變數未設置
}
```

## 🔧 如果問題持續

請提供以下信息：

1. **Vercel 日誌**：
   - 完整的函數日誌
   - 包括所有診斷信息

2. **瀏覽器 Network 標籤**：
   - `/api/prizes` 請求的詳細信息
   - 請求狀態碼和響應內容

3. **錯誤訊息**：
   - 前端顯示的錯誤
   - 瀏覽器控制台的錯誤

4. **環境變數狀態**：
   - `serviceKeySet` 的值（從日誌中查看）
   - 是否已設置 `INFORGE_SERVICE_KEY`

---

**診斷工具已就緒**：現在上傳圖片時會記錄詳細的診斷信息，請按照上述步驟進行排查。

