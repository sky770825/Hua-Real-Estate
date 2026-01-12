# CORS 問題解決方案

## 問題說明

直接從前端上傳到 Cloudflare R2 會遇到 CORS（跨域資源共享）錯誤，因為 R2 存儲桶默認不允許跨域請求。

## 解決方案

### 方案 1：使用 Cloudflare Workers（推薦）⭐

這是最安全和推薦的方法，可以避免 CORS 問題。

#### 步驟：

1. **登錄 Cloudflare Dashboard**
   - 訪問 https://dash.cloudflare.com
   - 選擇您的帳戶

2. **創建 Worker**
   - 進入 "Workers & Pages"
   - 點擊 "Create application" → "Create Worker"
   - 給 Worker 命名（例如：`r2-upload`）

3. **配置 R2 綁定**
   - 在 Worker 編輯器中，點擊右上角的 "Settings"
   - 選擇 "Variables" 標籤
   - 在 "R2 Bucket Bindings" 部分，點擊 "Add binding"
   - Variable name: `R2_BUCKET`
   - R2 Bucket: 選擇 `hua-real-estate`
   - 點擊 "Save"

4. **部署代碼**
   - 將 `r2-upload-worker.js` 中的代碼複製到 Worker 編輯器
   - 點擊 "Save and Deploy"

5. **獲取 Worker URL**
   - 部署完成後，您會看到 Worker 的 URL
   - 格式類似：`https://r2-upload.your-subdomain.workers.dev`

6. **配置前端代碼**
   - 在 `invite.html` 中找到 `R2_CONFIG`（約第 3047 行）
   - 設置 `apiEndpoint` 為您的 Worker URL：
   ```javascript
   const R2_CONFIG = {
       endpoint: 'https://82ebeb1d91888e83e8e1b30eeb33d3c3.r2.cloudflarestorage.com',
       bucketName: 'hua-real-estate',
       uploadPath: 'invite-photo',
       apiEndpoint: 'https://r2-upload.your-subdomain.workers.dev', // 設置為您的 Worker URL
       accessKeyId: '',
       secretAccessKey: ''
   };
   ```

7. **測試上傳**
   - 現在應該可以正常上傳了！

---

### 方案 2：配置 R2 CORS（需要管理權限）

如果您有 Cloudflare Dashboard 的管理權限，可以配置 R2 存儲桶的 CORS 策略。

#### 步驟：

1. **登錄 Cloudflare Dashboard**
   - 訪問 https://dash.cloudflare.com
   - 選擇 "R2" → 選擇 `hua-real-estate` 存儲桶

2. **配置 CORS**
   - 進入存儲桶設置
   - 找到 "CORS Policy" 或 "Settings"
   - 添加以下 CORS 配置：

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**注意**：使用 `"AllowedOrigins": ["*"]` 允許所有來源，這在生產環境中可能不安全。建議指定具體的域名，例如：
```json
[
  {
    "AllowedOrigins": ["https://your-domain.com", "https://www.your-domain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

3. **保存配置**
   - 保存 CORS 配置後，前端應該可以正常上傳

---

## 推薦方案

**強烈推薦使用方案 1（Cloudflare Workers）**，因為：
- ✅ 更安全（訪問憑證不會暴露在前端）
- ✅ 避免 CORS 問題
- ✅ 可以添加額外的驗證和處理邏輯
- ✅ 更好的錯誤處理
- ✅ 可以記錄上傳日誌

## 快速測試

如果暫時無法配置 Worker，可以：
1. 使用瀏覽器擴展（如 CORS Unblock）來測試（僅用於開發）
2. 或者使用後端服務器作為代理

## 需要幫助？

如果遇到問題，請檢查：
- Worker 是否正確部署
- R2 綁定是否正確配置
- Worker URL 是否正確設置在 `R2_CONFIG.apiEndpoint` 中
