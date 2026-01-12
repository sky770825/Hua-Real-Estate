# 修復 `supabaseClient is not defined` 錯誤說明

## 📅 修復日期
2025年1月

## ❌ 錯誤訊息
```
Uncaught (in promise) ReferenceError: supabaseClient is not defined
    at invite:2569:25
    at invite:2591:23
    at invite:2592:19
```

## 🔍 問題原因分析

### 1. **執行順序問題**
- 頁面加載時，在 HTML 中的 `<script>` 標籤（約第 2525 行）會立即執行
- 這個腳本嘗試使用 `supabaseClient` 來載入圖片
- 但 `supabaseClient` 的聲明和初始化在後面的 `<script>` 標籤中（約第 3498 行）
- 導致在 `supabaseClient` 還未聲明時就被使用了

### 2. **作用域問題**
- `supabaseClient` 原本只是一個局部變量（`let supabaseClient = null`）
- 不同 `<script>` 標籤之間無法共享局部變量
- 頁面加載腳本無法訪問到後面聲明的 `supabaseClient`

### 3. **異步初始化問題**
- Supabase 客戶端的初始化是異步的（需要等待 CDN 載入）
- 頁面加載腳本沒有等待機制，直接嘗試使用未初始化的客戶端

## ✅ 解決方案

### 修改 1：添加 `getSupabaseClient()` 輔助函數

**位置**：約第 3504-3515 行

```javascript
// 安全獲取 supabaseClient 的輔助函數
function getSupabaseClient() {
    // 優先使用 window.supabaseClient（如果已設置）
    if (typeof window !== 'undefined' && window.supabaseClient) {
        return window.supabaseClient;
    }
    // 其次使用局部變量
    if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
        return supabaseClient;
    }
    return null;
}
```

**作用**：
- 安全地獲取客戶端，避免未定義錯誤
- 優先使用全局變量 `window.supabaseClient`
- 如果全局變量不存在，再嘗試使用局部變量
- 如果都不存在，返回 `null` 而不是拋出錯誤

### 修改 2：將 `supabaseClient` 設置為全局變量

**位置**：約第 3498-3502 行（聲明時）

```javascript
let supabaseClient = null;
// 同時設置為 window 屬性，方便其他腳本訪問
if (typeof window !== 'undefined') {
    window.supabaseClient = null;
}
```

**位置**：約第 3524-3526 行（初始化時）

```javascript
supabaseClient = supabaseLib.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
// 同時設置為 window 屬性，方便其他腳本訪問
window.supabaseClient = supabaseClient;
```

**作用**：
- 讓所有腳本都能訪問 `supabaseClient`
- 解決作用域問題
- 確保頁面加載腳本可以訪問到客戶端

### 修改 3：優化頁面加載時的等待機制

**位置**：約第 2527-2615 行

```javascript
// 在頁面加載腳本中提前聲明
if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = null;
}

// 添加等待和重試機制
(async function() {
    // 等待一下確保所有腳本都已加載
    await new Promise(resolve => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
        } else {
            setTimeout(resolve, 100);
        }
    });
    
    // 檢查 supabaseClient 是否已初始化
    const client = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    
    if (client) {
        // 已初始化，立即載入
        loadEventImagesFromSupabase();
        return;
    }
    
    // 如果還沒初始化，等待初始化函數可用
    let retryCount = 0;
    const maxRetries = 50; // 最多等待 5 秒
    
    const checkAndLoad = setInterval(() => {
        retryCount++;
        
        // 檢查是否已初始化
        const currentClient = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
        if (currentClient) {
            clearInterval(checkAndLoad);
            loadEventImagesFromSupabase();
            return;
        }
        
        // 如果初始化函數可用，嘗試初始化
        if (typeof initSupabase === 'function') {
            initSupabase().then(() => {
                clearInterval(checkAndLoad);
                loadEventImagesFromSupabase();
            }).catch((error) => {
                console.error('❌ Supabase 初始化失敗:', error);
            });
        }
        
        // 如果超過最大重試次數，停止
        if (retryCount >= maxRetries) {
            clearInterval(checkAndLoad);
            console.warn('⚠️ Supabase 初始化超時，請檢查配置');
        }
    }, 100);
})();
```

**作用**：
- 提前聲明 `window.supabaseClient`，避免未定義錯誤
- 等待 DOM 加載完成
- 檢查客戶端是否已初始化
- 如果未初始化，使用重試機制等待（最多 5 秒）
- 自動嘗試調用 `initSupabase()` 進行初始化

### 修改 4：更新所有使用 `supabaseClient` 的函數

**修改的函數**：
1. `uploadToSupabase()` - 上傳圖片到 Supabase Storage
2. `deleteOldEventImages()` - 刪除舊圖片（從數據庫和存儲）
3. `saveEventImagesToSupabase()` - 保存圖片 URL 到數據庫
4. `loadEventImagesFromSupabase()` - 從數據庫讀取圖片（**關鍵函數**）

**修改方式**：
- 將所有 `if (!supabaseClient)` 改為 `const client = getSupabaseClient(); if (!client)`
- 將所有 `supabaseClient.storage` 改為 `client.storage`
- 將所有 `supabaseClient.from()` 改為 `client.from()`

**範例**：
```javascript
// 修改前
async function loadEventImagesFromSupabase() {
    if (!supabaseClient) {
        console.warn('⚠️ Supabase 客戶端未初始化');
        return false;
    }
    const { data } = await supabaseClient.from('invite_event_images')...
}

// 修改後
async function loadEventImagesFromSupabase() {
    const client = getSupabaseClient();
    if (!client) {
        console.warn('⚠️ Supabase 客戶端未初始化');
        return false;
    }
    const { data } = await client.from('invite_event_images')...
}
```

## 🎯 修復效果

### 修復前
- ❌ 頁面加載時出現 `supabaseClient is not defined` 錯誤
- ❌ 無法從數據庫讀取圖片
- ❌ 圖片顯示功能完全失效

### 修復後
- ✅ 不再出現未定義錯誤
- ✅ 可以成功從數據庫讀取上傳的圖片
- ✅ 圖片正常顯示在頁面上
- ✅ 所有 Supabase 相關功能正常工作

## 📝 技術要點總結

1. **全局變量 vs 局部變量**
   - 使用 `window.supabaseClient` 確保跨腳本訪問
   - 同時保留局部變量 `supabaseClient` 用於內部使用

2. **安全訪問模式**
   - 使用 `getSupabaseClient()` 函數統一獲取客戶端
   - 避免直接訪問可能未定義的變量
   - 提供 `null` 檢查和錯誤處理

3. **異步初始化處理**
   - 添加等待機制確保腳本加載完成
   - 使用重試機制處理異步初始化
   - 設置超時避免無限等待

4. **執行順序控制**
   - 提前聲明全局變量
   - 使用 `DOMContentLoaded` 事件確保 DOM 就緒
   - 使用 `setInterval` 輪詢檢查初始化狀態

## 🔧 相關文件

- `invite.html` - 主要修改文件
- `supabase-invite-images-table.sql` - 數據庫表結構
- `supabase-storage-policies.sql` - 存儲策略配置

## 💡 經驗教訓

1. **避免在頁面加載時直接使用未初始化的變量**
   - 應該先檢查變量是否存在
   - 使用輔助函數安全訪問

2. **跨腳本變量共享**
   - 使用 `window` 對象存儲全局變量
   - 確保所有腳本都能訪問

3. **異步初始化處理**
   - 不要假設異步操作會立即完成
   - 添加等待和重試機制
   - 設置合理的超時時間

4. **統一的訪問模式**
   - 使用輔助函數統一獲取資源
   - 避免在多處重複檢查邏輯
   - 提高代碼可維護性

## ✅ 驗證方法

修復後，可以通過以下方式驗證：

1. **打開瀏覽器控制台**
   - 不應該看到 `supabaseClient is not defined` 錯誤
   - 應該看到 `✅ Supabase 客戶端初始化成功`
   - 應該看到 `📥 從 Supabase 數據庫載入活動圖片...`

2. **檢查圖片顯示**
   - 頁面應該能正常顯示從數據庫讀取的圖片
   - 圖片應該能正常加載和顯示

3. **測試上傳功能**
   - 上傳新圖片應該能正常工作
   - 舊圖片應該能被正確刪除

---

**修復完成日期**：2025年1月  
**修復狀態**：✅ 已成功修復並驗證
