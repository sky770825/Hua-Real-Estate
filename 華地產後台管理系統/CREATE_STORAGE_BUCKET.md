# 📦 創建 Insforge Storage 儲存桶指南

## 🎯 問題

錯誤訊息：`儲存桶不存在或無權限，請檢查 Insforge 設置`

這表示 `checkin-prizes` 儲存桶尚未在 Insforge 中創建。

## ✅ 解決方法

### 方法 1：通過 Insforge Dashboard 創建（推薦）

1. **登入 Insforge Dashboard**
   - 訪問：https://dsfp4gvz.us-east.insforge.app
   - 使用您的帳號登入

2. **進入 Storage 設置**
   - 在左側選單中找到 "Storage" 或 "儲存"
   - 點擊進入 Storage 管理頁面

3. **創建新儲存桶**
   - 點擊 "Create Bucket" 或 "創建儲存桶" 按鈕
   - 輸入儲存桶名稱：`checkin-prizes`（必須完全一致）
   - 選擇權限設置：
     - **公開（Public）**：推薦，允許公開訪問圖片
     - 或 **私有（Private）**：需要認證才能訪問

4. **確認創建**
   - 點擊 "Create" 或 "創建"
   - 確認儲存桶已出現在列表中

### 方法 2：通過 API 創建（如果 Dashboard 不可用）

如果 Dashboard 無法創建，可以通過 API 創建。但通常 Dashboard 方法更簡單。

## 🔍 驗證儲存桶

創建後，請驗證：

1. **檢查儲存桶是否存在**
   - 在 Storage 列表中確認 `checkin-prizes` 存在
   - 確認狀態為 "Active" 或 "啟用"

2. **檢查權限設置**
   - 如果選擇公開（Public），圖片 URL 可以直接訪問
   - 如果選擇私有（Private），需要認證才能訪問

## ⚙️ 權限設置建議

### 推薦：公開儲存桶（Public）

**優點**：
- 圖片可以直接通過 URL 訪問
- 不需要額外的認證
- 適合獎品圖片這種公開內容

**設置方法**：
- 創建儲存桶時選擇 "Public"
- 或在儲存桶設置中將 "Public Access" 設為 "Enabled"

### 私有儲存桶（Private）

**適用場景**：
- 需要保護的敏感圖片
- 需要訪問控制的內容

**注意**：
- 如果使用私有儲存桶，需要生成簽名 URL
- 代碼可能需要調整以支持簽名 URL

## 🚀 創建後的步驟

1. **等待幾秒鐘**讓儲存桶完全初始化

2. **重新嘗試上傳圖片**：
   - 訪問後台管理頁面
   - 點擊「新增獎品」
   - 選擇圖片檔案
   - 點擊「儲存」

3. **如果仍然失敗**：
   - 檢查 Vercel 日誌確認錯誤訊息
   - 確認環境變數 `INFORGE_SERVICE_KEY` 已設置
   - 確認儲存桶名稱完全一致：`checkin-prizes`

## 📋 檢查清單

創建儲存桶前，確認：

- [ ] 已登入 Insforge Dashboard
- [ ] 有創建儲存桶的權限
- [ ] 儲存桶名稱：`checkin-prizes`（完全一致，小寫，使用連字符）
- [ ] 權限設置：公開（Public）或私有（Private）
- [ ] 儲存桶狀態：Active / 啟用

創建後，確認：

- [ ] 儲存桶出現在 Storage 列表中
- [ ] 儲存桶狀態為 "Active"
- [ ] 環境變數 `INFORGE_SERVICE_KEY` 已設置
- [ ] Vercel 已重新部署（如果修改了環境變數）

## 🔧 如果還是無法上傳

### 檢查 1：儲存桶名稱

確認儲存桶名稱完全一致：
- ✅ 正確：`checkin-prizes`
- ❌ 錯誤：`checkin_prizes`（使用底線）
- ❌ 錯誤：`Checkin-Prizes`（大寫）
- ❌ 錯誤：`checkinprizes`（沒有連字符）

### 檢查 2：環境變數

確認 Vercel 環境變數：
- `INFORGE_ANON_KEY` 已設置
- `INFORGE_SERVICE_KEY` 已設置（使用您提供的 key）
- 環境變數已應用到所有環境

### 檢查 3：權限

確認：
- 服務端 key 對應的用戶有上傳權限
- 儲存桶允許上傳操作

### 檢查 4：Vercel 日誌

查看 Vercel 函數日誌：
1. 訪問 Vercel Dashboard
2. 點擊 "Functions" 標籤
3. 找到 `/api/prizes` 函數
4. 查看最新的日誌，尋找：
   - `開始上傳圖片:` - 確認上傳開始
   - `serviceKeySet: true` - 確認環境變數已設置
   - `上傳結果:` - 查看上傳結果
   - `圖片上傳錯誤詳情:` - 查看詳細錯誤

## 📝 儲存桶命名規則

Insforge Storage 儲存桶命名規則：
- 只能包含小寫字母、數字和連字符（-）
- 不能以連字符開頭或結尾
- 長度限制：通常 3-63 個字符
- 不能包含空格或特殊字符

我們的儲存桶名稱：`checkin-prizes` ✅ 符合所有規則

---

**下一步**：請按照上述步驟在 Insforge Dashboard 中創建 `checkin-prizes` 儲存桶，然後重新嘗試上傳圖片。

