# 🔧 獎品圖片上傳修復

## 🐛 問題描述

在後台新增獎品時，上傳圖片失敗。

## 🔍 問題原因

1. **檔案類型轉換問題**：
   - Insforge Storage 的 `upload` 方法需要 `Blob` 類型
   - 原本直接傳遞 `File` 對象可能不被支援

2. **缺少檔案驗證**：
   - 沒有檢查檔案大小限制
   - 沒有檢查檔案類型
   - 沒有處理特殊字符檔名

3. **錯誤處理不足**：
   - 錯誤訊息不夠詳細
   - 沒有適當的錯誤回饋

## ✅ 修復方案

### 1. 正確的檔案類型轉換

**之前**：
```typescript
.upload(fileName, imageFile)  // 直接傳遞 File
```

**現在**：
```typescript
const arrayBuffer = await imageFile.arrayBuffer()
const blob = new Blob([arrayBuffer], { type: imageFile.type })
.upload(fileName, blob)  // 轉換為 Blob
```

### 2. 添加檔案驗證

- **檔案大小限制**：最大 5MB
- **檔案類型檢查**：只允許 JPG、PNG、GIF、WebP
- **檔名清理**：移除特殊字符，只保留英數字和底線

### 3. 改進錯誤處理

- 詳細的錯誤訊息（中文）
- 適當的 HTTP 狀態碼
- 完整的錯誤日誌

### 4. 修復類型錯誤

- 移除不存在的 `publicUrl` 屬性
- 正確處理 `uploadData` 的類型

## 📋 修復內容

### 檔案驗證規則

1. **檔案大小**：最大 5MB
   ```typescript
   const maxSize = 5 * 1024 * 1024 // 5MB
   if (imageFile.size > maxSize) {
     return NextResponse.json(
       { error: '圖片檔案過大，請選擇小於 5MB 的圖片' },
       { status: 400 }
     )
   }
   ```

2. **檔案類型**：只允許圖片格式
   ```typescript
   const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
   if (!allowedTypes.includes(imageFile.type)) {
     return NextResponse.json(
       { error: '不支援的圖片格式，請使用 JPG、PNG、GIF 或 WebP' },
       { status: 400 }
     )
   }
   ```

3. **檔名清理**：移除特殊字符
   ```typescript
   const sanitizedExtension = fileExtension.replace(/[^a-z0-9]/g, '')
   ```

### 上傳流程

1. 驗證檔案大小和類型
2. 清理檔名（移除特殊字符）
3. 將 File 轉換為 ArrayBuffer，再轉換為 Blob
4. 上傳到 Insforge Storage
5. 獲取上傳後的 URL 和 key
6. 保存到資料庫

## 🚀 測試步驟

1. **等待 Vercel 自動部署**（約 2-5 分鐘）

2. **訪問後台管理頁面**：
   ```
   https://hua-sign-pri-j5js.vercel.app/admin/attendance_management?tab=prizes
   ```

3. **測試上傳**：
   - 點擊「新增獎品」
   - 輸入獎品名稱
   - 選擇圖片檔案（JPG、PNG、GIF 或 WebP，小於 5MB）
   - 點擊「儲存」

4. **檢查結果**：
   - 應該能看到上傳成功的訊息
   - 圖片應該顯示在獎品列表中

## ⚠️ 注意事項

### 支援的圖片格式
- JPEG / JPG
- PNG
- GIF
- WebP

### 檔案大小限制
- 最大 5MB

### 檔名要求
- 建議使用英數字檔名
- 系統會自動清理特殊字符

## 🔄 如果還是上傳失敗

1. **檢查瀏覽器控制台**：
   - 按 `F12` 打開開發者工具
   - 查看 "Console" 標籤的錯誤訊息
   - 查看 "Network" 標籤，確認 API 請求狀態

2. **檢查檔案**：
   - 確認檔案大小小於 5MB
   - 確認檔案格式為支援的圖片格式
   - 嘗試使用不同的圖片檔案

3. **檢查 Insforge Storage**：
   - 確認 `checkin-prizes` 儲存桶存在
   - 確認有上傳權限

4. **清除瀏覽器快取**：
   - 按 `Ctrl + Shift + Delete`（Windows）或 `Cmd + Shift + Delete`（Mac）
   - 清除快取和 Cookie

## 📝 技術細節

### 修改的檔案

1. `app/api/prizes/route.ts` - 新增獎品 API
2. `app/api/prizes/[id]/route.ts` - 更新獎品 API

### 主要變更

- 添加檔案大小和類型驗證
- 正確的 File → ArrayBuffer → Blob 轉換
- 改進錯誤處理和訊息
- 修復類型錯誤

---

**修復完成時間**：2025-01-06  
**版本**：v1.0.0

