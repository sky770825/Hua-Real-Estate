# 🔧 圖片上傳外鍵約束錯誤修復

## 🐛 問題描述

上傳圖片時出現錯誤：
```
insert or update on table "objects" violates foreign key constraint "objects_uploaded_by_fkey"
```

## 🔍 問題原因

Insforge Storage 的 `objects` 表有一個外鍵約束 `objects_uploaded_by_fkey`，要求 `uploaded_by` 欄位必須引用一個有效的用戶 ID。

當使用匿名 key（anon key）上傳文件時，系統無法找到對應的用戶 ID，導致外鍵約束錯誤。

## ✅ 修復方案

### 1. 創建服務端客戶端

創建了一個專門用於文件上傳的服務端客戶端 `insforgeService`，它使用服務端 key（service key）而不是匿名 key。

**修改的檔案**：
- `lib/insforge.ts` - 添加 `insforgeService` 客戶端
- `app/api/prizes/route.ts` - 使用 `insforgeService` 上傳圖片
- `app/api/prizes/[id]/route.ts` - 使用 `insforgeService` 上傳和刪除圖片

### 2. 環境變數配置

需要在 Vercel 環境變數中設置 `INFORGE_SERVICE_KEY`：

1. **訪問 Vercel Dashboard**：
   ```
   https://vercel.com/linebot/hua-sign-pri-j5js/settings/environment-variables
   ```

2. **添加環境變數**：
   - **Key**: `INFORGE_SERVICE_KEY`
   - **Value**: 您的 Insforge 服務端 key（見下方獲取方法）
   - **Environment**: Production, Preview, Development（全部選中）

3. **重新部署**：
   - 在 Vercel Dashboard 中點擊 "Redeploy"

## 🔑 如何獲取服務端 Key

### 方法 1：使用 Insforge Dashboard

1. 登入 Insforge Dashboard
2. 進入您的專案設置
3. 找到 "API Keys" 或 "Service Keys" 部分
4. 複製服務端 key（service key 或 admin key）

### 方法 2：創建系統用戶

如果沒有服務端 key，可以：

1. **在 Insforge 後台創建一個系統用戶**：
   - 用戶名：`system` 或 `upload-service`
   - 郵箱：`system@yourdomain.com`
   - 角色：管理員或服務角色

2. **獲取該用戶的 JWT Token**：
   - 使用該用戶登入
   - 從瀏覽器的 localStorage 或 API 響應中獲取 token
   - 這個 token 就是服務端 key

### 方法 3：使用現有用戶的 Token

如果您已經有一個有效的用戶帳號：

1. 使用該用戶登入 Insforge
2. 獲取該用戶的 JWT Token
3. 將此 token 設置為 `INFORGE_SERVICE_KEY`

## 📋 修復內容

### 代碼變更

1. **`lib/insforge.ts`**：
   ```typescript
   // 服務端 key 用於文件上傳（需要有效的用戶 ID）
   const serviceKey = process.env.INFORGE_SERVICE_KEY || anonKey;

   // 創建服務端客戶端（用於文件上傳，避免外鍵約束錯誤）
   export const insforgeService = createClient({
     baseUrl,
     anonKey: serviceKey,
   });
   ```

2. **`app/api/prizes/route.ts`**：
   ```typescript
   // 使用服務端客戶端上傳（避免外鍵約束錯誤）
   const { data: uploadData, error: uploadError } = await insforgeService.storage
     .from(BUCKETS.PRIZES)
     .upload(fileName, blob)
   ```

3. **`app/api/prizes/[id]/route.ts`**：
   - 上傳新圖片：使用 `insforgeService`
   - 刪除舊圖片：使用 `insforgeService`
   - 刪除獎品時的圖片刪除：使用 `insforgeService`

## 🚀 部署步驟

### 1. 設置環境變數

在 Vercel Dashboard 中設置 `INFORGE_SERVICE_KEY`：

1. 訪問：https://vercel.com/linebot/hua-sign-pri-j5js/settings/environment-variables
2. 點擊 "Add New"
3. 輸入：
   - **Key**: `INFORGE_SERVICE_KEY`
   - **Value**: 您的服務端 key
   - **Environment**: 全部選中
4. 點擊 "Save"

### 2. 重新部署

1. 訪問：https://vercel.com/linebot/hua-sign-pri-j5js/deployments
2. 點擊最新的部署
3. 點擊 "Redeploy"

或者等待自動部署（代碼已推送到 GitHub）

### 3. 測試上傳

1. 訪問後台管理頁面：
   ```
   https://hua-sign-pri-j5js.vercel.app/admin/attendance_management?tab=prizes
   ```

2. 嘗試上傳圖片：
   - 點擊「新增獎品」
   - 選擇圖片檔案
   - 點擊「儲存」

3. 應該能成功上傳，不再出現外鍵約束錯誤

## ⚠️ 注意事項

### 如果沒有設置服務端 Key

如果沒有設置 `INFORGE_SERVICE_KEY` 環境變數，系統會回退到使用匿名 key，可能仍然會出現外鍵約束錯誤。

**解決方法**：
1. 按照上述步驟獲取服務端 key
2. 在 Vercel 中設置環境變數
3. 重新部署

### 安全性

- **服務端 key 應該保密**：不要將服務端 key 提交到 Git 倉庫
- **使用環境變數**：只在 Vercel 環境變數中設置
- **限制權限**：如果可能，創建一個只有上傳權限的服務角色

## 🔄 如果還是上傳失敗

1. **檢查環境變數**：
   - 確認 `INFORGE_SERVICE_KEY` 已正確設置
   - 確認環境變數已應用到所有環境（Production, Preview, Development）

2. **檢查服務端 Key**：
   - 確認 key 是有效的
   - 確認 key 對應的用戶存在且有效

3. **檢查瀏覽器控制台**：
   - 按 `F12` 打開開發者工具
   - 查看 "Console" 標籤的錯誤訊息
   - 查看 "Network" 標籤，確認 API 請求狀態

4. **檢查 Vercel 日誌**：
   - 訪問 Vercel Dashboard
   - 查看部署日誌和函數日誌
   - 確認是否有錯誤訊息

## 📝 技術細節

### 外鍵約束說明

Insforge Storage 的 `objects` 表結構：
- `uploaded_by` 欄位：引用 `users` 表的 `id`
- 外鍵約束：`objects_uploaded_by_fkey`
- 要求：`uploaded_by` 必須是有效的用戶 ID

### 為什麼需要服務端 Key

- **匿名 key**：對應的用戶可能不存在或無效
- **服務端 key**：對應一個有效的系統用戶，可以正常上傳文件

### 回退機制

如果沒有設置 `INFORGE_SERVICE_KEY`，代碼會回退到使用 `anonKey`：
```typescript
const serviceKey = process.env.INFORGE_SERVICE_KEY || anonKey;
```

但這可能仍然會導致外鍵約束錯誤，所以**強烈建議設置服務端 key**。

---

**修復完成時間**：2025-01-06  
**版本**：v1.0.0

