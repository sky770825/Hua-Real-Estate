# 🔍 圖片上傳問題深度排查

## 📋 當前狀況

您已經有 `checkin-prizes` 儲存桶，但圖片仍然無法上傳。

## 🔍 需要檢查的事項

### 1. 儲存桶名稱確認

**重要**：請確認儲存桶名稱**完全一致**

- ✅ **正確**：`checkin-prizes`（小寫，使用連字符）
- ❌ **錯誤**：`checkin-pizes`（拼寫錯誤）
- ❌ **錯誤**：`checkin_prizes`（使用底線）
- ❌ **錯誤**：`Checkin-Prizes`（大寫）

**檢查方法**：
1. 登入 Insforge Dashboard
2. 進入 Storage 設置
3. 查看儲存桶列表
4. 確認名稱是否為 `checkin-prizes`（完全一致）

### 2. 查看 Vercel 日誌獲取詳細錯誤

**這是最重要的步驟**，可以告訴我們確切的問題：

1. **訪問 Vercel Dashboard**：
   ```
   https://vercel.com/linebot/hua-sign-pri-j5js
   ```

2. **點擊 "Functions" 標籤**

3. **找到 `/api/prizes` 函數**

4. **查看最新的日誌**，尋找：
   - `開始上傳圖片:` - 確認上傳開始
   - `上傳結果:` - 查看上傳結果
   - `圖片上傳錯誤詳情:` - **查看詳細錯誤**（這是最重要的）

5. **複製完整的錯誤日誌**，包括：
   - 錯誤訊息（message）
   - 錯誤碼（code）
   - 狀態碼（status）
   - 詳細信息（details）

### 3. 檢查環境變數

確認 Vercel 環境變數已正確設置：

1. **訪問環境變數設置**：
   ```
   https://vercel.com/linebot/hua-sign-pri-j5js/settings/environment-variables
   ```

2. **確認以下環境變數**：
   - `INFORGE_ANON_KEY` ✅ 已設置
   - `INFORGE_SERVICE_KEY` ⚠️ **必須設置**（使用您提供的 `ik_f82f516f734aa3d618a67f51bb7a583d`）

3. **確認環境變數已應用到所有環境**：
   - Production ✅
   - Preview ✅
   - Development ✅

4. **如果修改了環境變數**：
   - 點擊 "Redeploy" 重新部署
   - 等待部署完成（約 2-5 分鐘）

### 4. 檢查儲存桶權限

確認儲存桶權限設置：

1. **登入 Insforge Dashboard**
2. **進入 Storage 設置**
3. **找到 `checkin-prizes` 儲存桶**
4. **檢查權限設置**：
   - **公開（Public）**：推薦，允許公開訪問
   - **私有（Private）**：需要認證才能訪問

5. **確認服務端 key 有上傳權限**：
   - 如果儲存桶是私有的，確認服務端 key 對應的用戶有上傳權限

### 5. 檢查 Insforge SDK 版本

確認 `@insforge/sdk` 版本是否最新：

```bash
npm list @insforge/sdk
```

如果版本過舊，可能需要更新：

```bash
npm install @insforge/sdk@latest
```

## 🚀 測試步驟

### 步驟 1：查看詳細錯誤

1. **嘗試上傳圖片**
2. **立即查看 Vercel 日誌**
3. **複製完整的錯誤信息**

### 步驟 2：檢查儲存桶

1. **確認儲存桶名稱**：`checkin-prizes`（完全一致）
2. **確認儲存桶狀態**：Active / 啟用
3. **確認儲存桶權限**：公開或服務端 key 有權限

### 步驟 3：檢查環境變數

1. **確認 `INFORGE_SERVICE_KEY` 已設置**
2. **確認 key 值正確**：`ik_f82f516f734aa3d618a67f51bb7a583d`
3. **確認已重新部署**（如果修改了環境變數）

## 📝 常見錯誤和解決方法

### 錯誤 1：儲存桶名稱不匹配

**症狀**：
- 錯誤訊息包含 `bucket not found` 或 `404`
- 日誌顯示儲存桶不存在

**解決方法**：
- 確認儲存桶名稱完全一致：`checkin-prizes`
- 檢查是否有拼寫錯誤

### 錯誤 2：權限不足

**症狀**：
- 錯誤訊息包含 `permission denied` 或 `403`
- 日誌顯示 `serviceKeySet: true` 但仍有錯誤

**解決方法**：
- 確認服務端 key 是有效的
- 確認 key 對應的用戶有上傳權限
- 檢查儲存桶權限設置

### 錯誤 3：外鍵約束錯誤

**症狀**：
- 錯誤訊息包含 `foreign key constraint`
- 日誌顯示 `serviceKeySet: false`

**解決方法**：
- 確認 `INFORGE_SERVICE_KEY` 已設置
- 確認環境變數已應用到所有環境
- 重新部署

### 錯誤 4：速率限制

**症狀**：
- 錯誤訊息：`Too many requests` 或 `429`

**解決方法**：
- 等待 1-2 分鐘後再試
- 確認沒有其他程序在發送請求

## 🔧 已改進的診斷功能

現在代碼會記錄更詳細的錯誤信息：

1. **詳細的錯誤日誌**：
   - 錯誤訊息（message）
   - 錯誤碼（code）
   - 狀態碼（status）
   - 詳細信息（details）
   - 檔案信息（fileName, blobSize, blobType）
   - 儲存桶名稱（bucket）
   - 環境變數狀態（serviceKeySet）

2. **改進的錯誤訊息**：
   - 更清晰的錯誤描述
   - 包含檢查清單
   - 包含詳細信息（details）

3. **異常捕獲**：
   - 捕獲上傳過程中的異常
   - 記錄完整的錯誤堆棧

## 📋 請提供的信息

為了更好地診斷問題，請提供：

1. **Vercel 日誌**：
   - 完整的 `圖片上傳錯誤詳情` 日誌
   - 包括所有字段（message, code, status, details）

2. **儲存桶信息**：
   - 儲存桶名稱（確認是否為 `checkin-prizes`）
   - 儲存桶狀態（Active / 啟用）
   - 儲存桶權限（公開/私有）

3. **環境變數狀態**：
   - `INFORGE_SERVICE_KEY` 是否已設置
   - 日誌中的 `serviceKeySet` 值（true/false）

4. **錯誤訊息**：
   - 前端顯示的錯誤訊息
   - 瀏覽器控制台的錯誤

---

**下一步**：請按照上述步驟查看 Vercel 日誌，並提供 `圖片上傳錯誤詳情` 的完整內容，這樣我就能準確診斷問題了。

