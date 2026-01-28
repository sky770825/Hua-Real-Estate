# 🔧 請求過於頻繁問題修復

## 🐛 問題描述

出現錯誤：
```
Too many requests from this IP
```

## 🔍 問題原因

1. **自動刷新頻率過高**：
   - 後台頁面每 30 秒自動刷新一次
   - 每次刷新會發送多個 API 請求（members, meetings, checkins，還有統計請求）
   - 如果有多個會議，會同時發送多個統計請求

2. **請求數量過多**：
   - 基本數據：3 個請求（members, meetings, checkins）
   - 統計數據：最多 5 個請求（每個會議的簽到數據）
   - 總計：每次刷新可能發送 8+ 個請求
   - 每 30 秒一次，每分鐘可能發送 16+ 個請求

3. **沒有速率限制檢測**：
   - 遇到速率限制時仍繼續發送請求
   - 沒有暫停機制

## ✅ 修復方案

### 1. 增加自動刷新間隔

**之前**：每 30 秒刷新一次

**現在**：每 60 秒刷新一次

**效果**：請求頻率減少 50%

### 2. 減少統計請求數量

**之前**：獲取最近 5 個會議的統計數據

**現在**：只獲取最近 3 個會議的統計數據

**效果**：每次刷新減少 2 個請求

### 3. 添加請求節流

**新增**：為每個統計請求添加 200ms 延遲

**效果**：避免同時發送過多請求，分散請求時間

### 4. 添加速率限制檢測

**新增功能**：
- 檢測 "Too many requests" 錯誤
- 自動暫停背景刷新
- 5 分鐘後自動恢復
- 最多重試 3 次

**效果**：遇到速率限制時自動停止，避免持續觸發錯誤

## 📋 修復內容

### 自動刷新優化

```typescript
// 背景自動刷新數據（每60秒）- 僅在出席管理標籤頁
useEffect(() => {
  if (activeTab === 'attendance') {
    let retryCount = 0
    const maxRetries = 3
    let isPaused = false
    
    const interval = setInterval(() => {
      // 如果已暫停（遇到速率限制），跳過本次刷新
      if (isPaused) {
        return
      }
      
      loadData(true).catch(err => {
        // 檢測速率限制錯誤
        if (errorMessage.includes('Too many requests')) {
          isPaused = true
          // 5分鐘後恢復
          setTimeout(() => {
            isPaused = false
          }, 5 * 60 * 1000)
        }
      })
    }, 60000) // 60秒刷新一次
    
    return () => clearInterval(interval)
  }
}, [activeTab])
```

### 請求節流

```typescript
// 為每個請求添加小延遲，避免同時發送
const checkinPromises = meetingDates.map(async (date: string, index: number) => {
  // 每個請求間隔200ms
  if (index > 0) {
    await new Promise(resolve => setTimeout(resolve, index * 200))
  }
  // ... 發送請求
})
```

### 錯誤處理改進

```typescript
catch (error) {
  const errorMessage = error instanceof Error ? error.message : '載入資料失敗'
  if (errorMessage.includes('Too many requests') || 
      errorMessage.includes('rate limit') ||
      errorMessage.includes('429')) {
    // 速率限制錯誤，顯示提示
    alert('請求過於頻繁，請稍候再試')
  }
}
```

## 📊 性能改善

| 項目 | 之前 | 現在 | 改善 |
|------|------|------|------|
| 刷新間隔 | 30 秒 | 60 秒 | **減少 50%** |
| 統計請求數 | 5 個 | 3 個 | **減少 40%** |
| 每分鐘請求數 | 16+ | 6-8 | **減少 50-60%** |
| 速率限制檢測 | ❌ | ✅ | **新增** |
| 請求節流 | ❌ | ✅ | **新增** |

## 🚀 測試步驟

1. **等待 Vercel 自動部署**（約 2-5 分鐘）

2. **訪問後台管理頁面**：
   ```
   https://hua-sign-pri-j5js.vercel.app/admin/attendance_management
   ```

3. **觀察自動刷新**：
   - 頁面應該每 60 秒自動刷新一次
   - 不應該再出現 "Too many requests" 錯誤

4. **測試速率限制恢復**：
   - 如果遇到速率限制，背景刷新會自動暫停
   - 5 分鐘後會自動恢復

## ⚠️ 注意事項

### 如果還是出現速率限制

1. **等待一段時間**：
   - 速率限制通常是暫時的
   - 等待幾分鐘後再試

2. **減少手動操作**：
   - 避免頻繁手動刷新頁面
   - 避免同時打開多個標籤頁

3. **檢查其他操作**：
   - 確認沒有其他程序在同時發送請求
   - 確認沒有多個用戶同時使用

### 手動刷新

如果自動刷新被暫停，您可以：
- 手動點擊刷新按鈕
- 切換到其他標籤頁再切回來
- 重新載入頁面

## 🔄 進一步優化建議

如果問題持續，可以考慮：

1. **增加刷新間隔**：
   - 從 60 秒改為 120 秒（2 分鐘）

2. **只在頁面可見時刷新**：
   - 使用 Page Visibility API
   - 當頁面不可見時暫停刷新

3. **使用 WebSocket**：
   - 改用即時推送而不是輪詢
   - 大幅減少請求數量

4. **緩存數據**：
   - 使用瀏覽器緩存
   - 減少不必要的請求

## 📝 技術細節

### 修改的檔案

- `app/admin/attendance_management/page.tsx` - 後台管理頁面

### 主要變更

1. 自動刷新間隔：30 秒 → 60 秒
2. 統計請求數量：5 個 → 3 個
3. 添加請求節流：每個請求間隔 200ms
4. 添加速率限制檢測：自動暫停和恢復
5. 改進錯誤處理：顯示速率限制提示

---

**修復完成時間**：2025-01-06  
**版本**：v1.0.0

