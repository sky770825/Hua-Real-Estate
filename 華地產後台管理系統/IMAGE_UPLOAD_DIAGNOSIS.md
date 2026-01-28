# 🔍 圖片上傳問題診斷指南

## 🔧 已添加的診斷功能

### 1. 詳細的日誌記錄

現在上傳圖片時會記錄：
- 檔案信息（名稱、大小、類型）
- 儲存桶名稱
- 上傳結果（成功/失敗）
- 詳細的錯誤信息（錯誤碼、錯誤訊息）

### 2. 改進的錯誤處理

- 檢測速率限制錯誤（429）
- 檢測儲存桶不存在或權限錯誤（404/403）
- 提供更詳細的錯誤訊息

### 3. 多種 URL 獲取方式

嘗試從多種可能的字段獲取圖片 URL：
- `uploadData.url`
- `uploadData.publicUrl`
- `uploadData.signedUrl`

## 🔍 如何診斷問題

### 步驟 1：查看 Vercel 日誌

1. 訪問 Vercel Dashboard：
   ```
   https://vercel.com/linebot/hua-sign-pri-j5js
   ```

2. 點擊 "Functions" 標籤

3. 找到 `/api/prizes` 函數

4. 查看日誌，尋找：
   - `開始上傳圖片:` - 確認上傳開始
   - `上傳結果:` - 查看上傳結果
   - `圖片上傳錯誤詳情:` - 查看詳細錯誤

### 步驟 2：檢查常見問題

#### 問題 1：儲存桶不存在

**錯誤訊息**：
- `bucket not found`
- `404` 錯誤碼
- `儲存桶不存在或無權限`

**解決方法**：
1. 登入 Insforge Dashboard
2. 確認 `checkin-prizes` 儲存桶存在
3. 如果不存在，創建該儲存桶

#### 問題 2：權限不足

**錯誤訊息**：
- `permission denied`
- `access denied`
- `403` 錯誤碼

**解決方法**：
1. 確認 `INFORGE_SERVICE_KEY` 已設置
2. 確認服務端 key 有上傳權限
3. 檢查儲存桶的權限設置

#### 問題 3：上傳成功但無 URL

**錯誤訊息**：
- `上傳成功但無法獲取圖片 URL`

**可能原因**：
- Insforge 返回的數據結構與預期不同
- 需要手動構建 URL

**解決方法**：
- 查看日誌中的 `uploadData` 結構
- 根據實際結構調整代碼

#### 問題 4：速率限制

**錯誤訊息**：
- `Too many requests`
- `429` 錯誤碼

**解決方法**：
- 等待 1-2 分鐘後再試
- 確認沒有其他程序在發送請求

## 📋 檢查清單

### 環境變數檢查

- [ ] `INFORGE_ANON_KEY` 已設置
- [ ] `INFORGE_SERVICE_KEY` 已設置（重要！）
- [ ] 環境變數已應用到所有環境（Production, Preview, Development）

### Insforge 設置檢查

- [ ] `checkin-prizes` 儲存桶已創建
- [ ] 儲存桶權限設置正確（公開或服務端 key 有權限）
- [ ] 服務端 key 對應的用戶存在且有效

### 代碼檢查

- [ ] 使用 `insforgeService` 而不是 `insforge` 進行上傳
- [ ] 檔案已轉換為 Blob 類型
- [ ] 檔案大小和類型驗證通過

## 🚀 測試步驟

1. **查看日誌**：
   - 嘗試上傳一張圖片
   - 查看 Vercel 函數日誌
   - 記錄所有錯誤訊息

2. **檢查儲存桶**：
   - 登入 Insforge Dashboard
   - 確認 `checkin-prizes` 儲存桶存在
   - 檢查儲存桶權限

3. **檢查環境變數**：
   - 確認 `INFORGE_SERVICE_KEY` 已設置
   - 確認 key 是有效的

4. **測試上傳**：
   - 使用小圖片（< 1MB）測試
   - 使用 JPG 格式測試
   - 查看日誌中的詳細信息

## 📝 日誌示例

### 成功上傳的日誌

```
開始上傳圖片: {
  fileName: 'prizes/1234567890-abc123.jpg',
  fileSize: 123456,
  fileType: 'image/jpeg',
  bucket: 'checkin-prizes'
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
  bucket: 'checkin-prizes'
}
```

## 🔧 如果還是無法上傳

請提供以下信息：

1. **Vercel 日誌**：
   - 複製完整的錯誤日誌
   - 包括 "開始上傳圖片" 和 "上傳結果" 的日誌

2. **錯誤訊息**：
   - 前端顯示的錯誤訊息
   - 瀏覽器控制台的錯誤

3. **Insforge 設置**：
   - 儲存桶是否存在
   - 儲存桶權限設置
   - 服務端 key 是否有效

---

**診斷工具已添加**：現在上傳圖片時會記錄詳細的診斷信息，請查看 Vercel 日誌以獲取更多信息。

