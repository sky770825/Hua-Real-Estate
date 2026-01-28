# 🎉 圖片上傳成功解決方案記錄

## ✅ 問題已解決！

圖片上傳功能現在可以正常工作了！

## 🔧 解決方案的關鍵步驟

### 1. 環境變數設置 ⚠️ **最關鍵**

**問題**：圖片上傳失敗，出現外鍵約束錯誤或儲存桶權限錯誤

**解決方案**：在 Vercel 中設置 `INFORGE_SERVICE_KEY` 環境變數

**步驟**：
1. 訪問 Vercel Dashboard：
   ```
   https://vercel.com/linebot/hua-sign-pri-j5js/settings/environment-variables
   ```

2. 添加環境變數：
   - **Key**：`INFORGE_SERVICE_KEY`
   - **Value**：`ik_f82f516f734aa3d618a67f51bb7a583d`
   - **Environment**：選擇所有環境（Production, Preview, Development）

3. **重要**：設置後必須重新部署才能生效！

**為什麼需要這個**：
- Insforge Storage 的 `objects` 表有外鍵約束 `objects_uploaded_by_fkey`
- 匿名 key（anon key）無法提供有效的用戶 ID
- 服務端 key（service key）對應有效的用戶，可以正常上傳文件

### 2. 儲存桶創建

**問題**：儲存桶不存在導致上傳失敗

**解決方案**：在 Insforge Dashboard 中創建儲存桶

**步驟**：
1. 登入 Insforge Dashboard
2. 進入 Storage 設置
3. 創建儲存桶：
   - **名稱**：`checkin-prizes`（必須完全一致，小寫，使用連字符）
   - **權限**：公開（Public）或服務端 key 有權限

### 3. 代碼改進

#### 3.1 使用服務端客戶端

**文件**：`lib/insforge.ts`

```typescript
// 服務端 key 用於文件上傳（需要有效的用戶 ID）
const serviceKey = process.env.INFORGE_SERVICE_KEY || anonKey;

// 創建服務端客戶端（用於文件上傳，避免外鍵約束錯誤）
export const insforgeService = createClient({
  baseUrl,
  anonKey: serviceKey,
});
```

**關鍵點**：
- 使用 `insforgeService` 而不是 `insforge` 進行文件上傳
- `insforgeService` 使用服務端 key，可以正常上傳文件

#### 3.2 正確的檔案類型轉換

**文件**：`app/api/prizes/route.ts`

```typescript
// 將 File 轉換為 Blob（Insforge Storage 需要 Blob 類型）
const arrayBuffer = await imageFile.arrayBuffer()
const blob = new Blob([arrayBuffer], { type: imageFile.type })

// 使用服務端客戶端上傳
const uploadResult = await insforgeService.storage
  .from(BUCKETS.PRIZES)
  .upload(fileName, blob)
```

**關鍵點**：
- Insforge Storage 的 `upload` 方法需要 `Blob` 類型
- 不能直接傳遞 `File` 對象
- 需要先轉換為 `ArrayBuffer`，再轉換為 `Blob`

#### 3.3 詳細的錯誤處理和日誌記錄

**改進內容**：
- 記錄檔案信息（名稱、大小、類型）
- 記錄儲存桶名稱
- 記錄環境變數狀態（`serviceKeySet`）
- 記錄上傳結果（成功/失敗）
- 記錄詳細的錯誤信息（錯誤碼、錯誤訊息）

**好處**：
- 可以快速診斷問題
- 提供清晰的錯誤訊息
- 幫助排查問題

#### 3.4 手動 URL 構建

**問題**：上傳成功但 Insforge 未返回 URL

**解決方案**：如果 Insforge 未返回 URL，手動構建

```typescript
if (!imageUrl) {
  // 嘗試手動構建 URL
  const baseUrl = 'https://dsfp4gvz.us-east.insforge.app'
  if (imageKey) {
    imageUrl = `${baseUrl}/storage/v1/object/public/${BUCKETS.PRIZES}/${imageKey}`
    console.log('使用手動構建的 URL:', imageUrl)
  }
}
```

### 4. 檔案驗證

**添加的驗證**：
- 檔案大小限制：最大 5MB
- 檔案類型檢查：只允許 JPG、PNG、GIF、WebP
- 檔名清理：移除特殊字符

**代碼**：
```typescript
// 檢查檔案大小（限制為 5MB）
const maxSize = 5 * 1024 * 1024 // 5MB
if (imageFile.size > maxSize) {
  return NextResponse.json(
    { error: '圖片檔案過大，請選擇小於 5MB 的圖片' },
    { status: 400 }
  )
}

// 檢查檔案類型
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
if (!allowedTypes.includes(imageFile.type)) {
  return NextResponse.json(
    { error: '不支援的圖片格式，請使用 JPG、PNG、GIF 或 WebP' },
    { status: 400 }
  )
}
```

### 5. 錯誤處理改進

**改進的錯誤檢測**：
- 速率限制錯誤（429）
- 儲存桶不存在或權限錯誤（404/403）
- 外鍵約束錯誤
- 上傳成功但無 URL

**改進的錯誤訊息**：
- 清晰的錯誤描述（中文）
- 包含檢查清單
- 包含詳細信息

## 📋 完整解決方案檢查清單

### 環境變數設置
- [x] `INFORGE_ANON_KEY` 已設置
- [x] `INFORGE_SERVICE_KEY` 已設置（值：`ik_f82f516f734aa3d618a67f51bb7a583d`）
- [x] 環境變數已應用到所有環境
- [x] 已重新部署（設置環境變數後）

### Insforge 設置
- [x] `checkin-prizes` 儲存桶已創建
- [x] 儲存桶權限設置正確
- [x] 服務端 key 對應的用戶存在且有效

### 代碼實現
- [x] 使用 `insforgeService` 進行文件上傳
- [x] 檔案已轉換為 Blob 類型
- [x] 檔案大小和類型驗證通過
- [x] 詳細的錯誤處理和日誌記錄
- [x] 支持手動構建 URL

## 🎯 關鍵成功因素

### 1. 環境變數設置 ⚠️ **最重要**

**這是解決問題的關鍵**：
- 沒有 `INFORGE_SERVICE_KEY`，圖片上傳會失敗
- 設置後必須重新部署才能生效
- 必須應用到所有環境（Production, Preview, Development）

### 2. 使用服務端客戶端

**為什麼需要**：
- 匿名 key 無法提供有效的用戶 ID
- 服務端 key 對應有效的用戶，可以正常上傳文件
- 避免外鍵約束錯誤

### 3. 正確的檔案類型轉換

**為什麼重要**：
- Insforge Storage 的 `upload` 方法需要 `Blob` 類型
- 直接傳遞 `File` 對象會失敗
- 需要正確的轉換流程

### 4. 詳細的錯誤處理

**為什麼有用**：
- 可以快速診斷問題
- 提供清晰的錯誤訊息
- 幫助排查問題

## 📝 技術細節

### Insforge Storage 上傳流程

1. **接收檔案**：從 FormData 獲取 File 對象
2. **驗證檔案**：檢查大小、類型
3. **轉換檔案**：File → ArrayBuffer → Blob
4. **生成檔名**：使用時間戳和隨機字符串
5. **上傳檔案**：使用 `insforgeService.storage.from(BUCKETS.PRIZES).upload()`
6. **獲取 URL**：從上傳結果獲取 URL，或手動構建
7. **保存資料**：將 URL 和 key 保存到資料庫

### 錯誤處理流程

1. **捕獲錯誤**：使用 try-catch 捕獲所有錯誤
2. **記錄日誌**：記錄詳細的錯誤信息
3. **分類錯誤**：根據錯誤類型返回不同的錯誤訊息
4. **返回響應**：返回適當的 HTTP 狀態碼和錯誤訊息

## 🚀 未來維護建議

### 1. 監控上傳功能

- 定期檢查 Vercel 日誌
- 監控上傳成功率
- 及時處理錯誤

### 2. 優化上傳性能

- 考慮添加圖片壓縮
- 考慮添加進度條
- 考慮批量上傳

### 3. 改進用戶體驗

- 添加上傳進度顯示
- 添加圖片預覽
- 添加拖放上傳

## 🎉 成功總結

### 解決的問題

1. ✅ 圖片上傳失敗 → 現在可以成功上傳
2. ✅ 外鍵約束錯誤 → 使用服務端 key 解決
3. ✅ 儲存桶權限錯誤 → 創建儲存桶並設置權限
4. ✅ 錯誤訊息不明確 → 添加詳細的錯誤處理和日誌

### 關鍵步驟

1. **設置環境變數**：`INFORGE_SERVICE_KEY` ⚠️ **最重要**
2. **創建儲存桶**：`checkin-prizes`
3. **使用服務端客戶端**：`insforgeService`
4. **正確的檔案轉換**：File → Blob
5. **詳細的錯誤處理**：記錄和返回清晰的錯誤訊息

### 最終狀態

- ✅ 圖片上傳功能正常工作
- ✅ 所有錯誤都有清晰的錯誤訊息
- ✅ 所有操作都有詳細的日誌記錄
- ✅ 系統穩定可靠

---

**成功解決方案已記錄！** 🎉

如果未來遇到類似問題，可以參考這個文檔快速解決。

