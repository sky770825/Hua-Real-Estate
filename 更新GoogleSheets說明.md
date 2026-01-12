# 📝 更新 Google Sheets 功能說明

## 🎯 功能說明

當圖片上傳到 Supabase Storage 成功後，系統會自動將圖片 URL 更新到 Google Sheets 的 `INVITE_EVENT` 工作表中。

## 📋 工作流程

1. 用戶上傳圖片 → Supabase Storage
2. 上傳成功後 → 自動更新 Google Sheets
3. 更新成功後 → 清除快取，重新載入頁面圖片

## ⚙️ 需要在 Apps Script 中添加的功能

### 方法 1：添加更新函數到現有 Apps Script（推薦）

在您的 Google Apps Script 項目中添加以下函數：

```javascript
/**
 * 更新邀請活動的圖片 URL
 */
function updateInviteEventImages(eventId, image1Url, image2Url) {
  try {
    const ss = SpreadsheetApp.openById('您的試算表ID');
    const sheet = ss.getSheetByName('INVITE_EVENT');
    
    if (!sheet) {
      return { success: false, error: '找不到 INVITE_EVENT 工作表' };
    }
    
    // 獲取所有數據
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // 找到要更新的行
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      // 根據活動 ID 或標題匹配
      if (data[i][0] === eventId || data[i][1] === eventId) {
        rowIndex = i + 1; // +1 因為 Sheets 行號從 1 開始
        break;
      }
    }
    
    // 如果找不到，更新最後一行（最新的活動）
    if (rowIndex === -1) {
      rowIndex = data.length;
    }
    
    // 找到圖片 URL 列的索引
    const image1ColIndex = headers.indexOf('E圖片1網址') + 1;
    const image2ColIndex = headers.indexOf('F圖片2網址') + 1;
    
    if (image1ColIndex === 0 || image2ColIndex === 0) {
      return { success: false, error: '找不到圖片 URL 列' };
    }
    
    // 更新圖片 URL
    sheet.getRange(rowIndex, image1ColIndex).setValue(image1Url);
    sheet.getRange(rowIndex, image2ColIndex).setValue(image2Url);
    
    return { success: true, message: '圖片 URL 已更新' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * 處理更新請求（在 doPost 中添加）
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'updateInviteEventImages') {
      const result = updateInviteEventImages(
        data.eventId,
        data.image1Url,
        data.image2Url
      );
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 其他現有的處理邏輯...
    
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 方法 2：手動更新（如果 Apps Script 不支持）

如果暫時無法修改 Apps Script，可以：

1. 上傳成功後，複製圖片 URL
2. 手動到 Google Sheets 更新：
   - 打開 `INVITE_EVENT` 工作表
   - 找到最新的活動行
   - 更新 `E圖片1網址` 和 `F圖片2網址` 列
   - 保存

---

## 🔍 如何確認更新成功

1. **查看控制台**：
   - 打開瀏覽器開發者工具（F12）
   - 查看 Console 標籤
   - 應該會看到 "✅ Google Sheets 更新成功"

2. **檢查 Google Sheets**：
   - 打開 Google Sheets
   - 查看 `INVITE_EVENT` 工作表
   - 確認圖片 URL 已更新

3. **刷新頁面**：
   - 上傳成功後，頁面會自動重新載入活動數據
   - 新上傳的圖片應該會顯示

---

## ⚠️ 注意事項

1. **Apps Script 需要支持更新功能**：
   - 如果 Apps Script 中沒有 `updateInviteEventImages` 函數
   - 更新會失敗，但圖片已成功上傳到 Supabase
   - 需要手動更新 Google Sheets

2. **活動識別**：
   - 系統會自動找到當前要顯示的活動
   - 如果找不到，會更新最後一行（最新的活動）

3. **快取清除**：
   - 更新成功後會自動清除快取
   - 強制重新載入最新的活動數據

---

## 🛠️ 故障排除

### 問題：更新失敗，但圖片已上傳

**解決方案**：
1. 檢查 Apps Script 是否添加了更新函數
2. 檢查控制台錯誤信息
3. 手動更新 Google Sheets

### 問題：找不到活動數據

**解決方案**：
- 確認 `INVITE_EVENT` 工作表存在
- 確認工作表中有活動數據
- 檢查 Apps Script API URL 是否正確

---

## ✅ 完成後

配置好 Apps Script 更新功能後，上傳的圖片會自動更新到 Google Sheets，頁面會自動顯示新圖片！
