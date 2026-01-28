# 🔑 環境變數設置指南

## 📋 需要在 Vercel 設置的環境變數

### 1. INFORGE_ANON_KEY
- **用途**：用於一般資料庫操作（讀取、查詢）
- **狀態**：應該已經設置

### 2. INFORGE_SERVICE_KEY ⚠️ **重要！**
- **用途**：用於文件上傳（圖片上傳到 Insforge Storage）
- **值**：`ik_f82f516f734aa3d618a67f51bb7a583d`
- **狀態**：需要設置

## 🚀 設置步驟

### 步驟 1：訪問 Vercel 環境變數設置

1. 打開瀏覽器，訪問：
   ```
   https://vercel.com/linebot/hua-sign-pri-j5js/settings/environment-variables
   ```

   或者：
   - 訪問 Vercel Dashboard：https://vercel.com/linebot/hua-sign-pri-j5js
   - 點擊左側選單的 "Settings"
   - 點擊 "Environment Variables"

### 步驟 2：添加 INFORGE_SERVICE_KEY

1. **點擊 "Add New" 按鈕**

2. **輸入環境變數信息**：
   - **Key（名稱）**：`INFORGE_SERVICE_KEY`
   - **Value（值）**：`ik_f82f516f734aa3d618a67f51bb7a583d`
   - **Environment（環境）**：選擇所有環境
     - ✅ Production
     - ✅ Preview
     - ✅ Development

3. **點擊 "Save" 保存**

### 步驟 3：確認環境變數

確認以下環境變數都已設置：

- [ ] `INFORGE_ANON_KEY` - 已設置
- [ ] `INFORGE_SERVICE_KEY` - 已設置（值：`ik_f82f516f734aa3d618a67f51bb7a583d`）

### 步驟 4：重新部署

**重要**：設置或修改環境變數後，必須重新部署才能生效！

1. **方法 1：自動重新部署**
   - 如果修改了環境變數，Vercel 通常會提示重新部署
   - 點擊 "Redeploy" 按鈕

2. **方法 2：手動觸發重新部署**
   - 訪問：https://vercel.com/linebot/hua-sign-pri-j5js/deployments
   - 點擊最新的部署
   - 點擊 "Redeploy" 按鈕

3. **方法 3：推送代碼觸發部署**
   - 如果代碼有變更，推送到 GitHub 會自動觸發部署

## ✅ 驗證設置

### 方法 1：查看 Vercel 日誌

1. 訪問 Vercel Dashboard
2. 點擊 "Functions" 標籤
3. 找到 `/api/prizes` 函數
4. 嘗試上傳圖片
5. 查看日誌，應該看到：
   ```
   開始上傳圖片: {
     ...
     serviceKeySet: true  // ✅ 這表示環境變數已設置
   }
   ```

### 方法 2：測試圖片上傳

1. 訪問後台管理頁面
2. 進入「獎品管理」標籤
3. 點擊「新增獎品」
4. 選擇圖片檔案
5. 點擊「儲存」
6. 如果上傳成功，表示環境變數設置正確

## 🔍 如果設置後仍然失敗

### 檢查 1：確認環境變數已應用到所有環境

確保 `INFORGE_SERVICE_KEY` 已應用到：
- ✅ Production
- ✅ Preview
- ✅ Development

### 檢查 2：確認已重新部署

- 環境變數修改後必須重新部署才能生效
- 確認最新的部署時間是在設置環境變數之後

### 檢查 3：查看 Vercel 日誌

1. 訪問 Vercel Dashboard
2. 查看函數日誌
3. 檢查 `serviceKeySet` 的值：
   - `true` - 環境變數已設置 ✅
   - `false` - 環境變數未設置 ❌

### 檢查 4：確認 Key 值正確

確認 `INFORGE_SERVICE_KEY` 的值完全一致：
- ✅ 正確：`ik_f82f516f734aa3d618a67f51bb7a583d`
- ❌ 錯誤：包含空格或換行
- ❌ 錯誤：缺少開頭的 `ik_`
- ❌ 錯誤：缺少結尾的字符

## 📝 環境變數說明

### INFORGE_ANON_KEY
- **用途**：匿名 key，用於一般資料庫操作
- **權限**：讀取、查詢、插入、更新、刪除資料
- **限制**：無法上傳文件（會觸發外鍵約束錯誤）

### INFORGE_SERVICE_KEY
- **用途**：服務端 key，用於文件上傳
- **權限**：上傳文件到 Insforge Storage
- **特點**：對應一個有效的用戶 ID，可以正常上傳文件
- **使用場景**：圖片上傳、文件存儲

## 🔒 安全提醒

1. **不要將環境變數提交到 Git**：
   - 環境變數已添加到 `.gitignore`
   - 只在 Vercel 中設置

2. **不要分享環境變數**：
   - 服務端 key 具有較高權限
   - 不要公開分享或在代碼中硬編碼

3. **定期更新**：
   - 如果懷疑 key 洩露，應立即更新
   - 在 Insforge Dashboard 中重新生成 key

## 🎯 設置完成後的檢查清單

- [ ] `INFORGE_ANON_KEY` 已設置
- [ ] `INFORGE_SERVICE_KEY` 已設置（值：`ik_f82f516f734aa3d618a67f51bb7a583d`）
- [ ] 環境變數已應用到所有環境（Production, Preview, Development）
- [ ] 已重新部署（部署時間在設置環境變數之後）
- [ ] 測試圖片上傳成功
- [ ] Vercel 日誌顯示 `serviceKeySet: true`

---

**設置完成後，圖片上傳功能應該可以正常工作了！** 🎉

