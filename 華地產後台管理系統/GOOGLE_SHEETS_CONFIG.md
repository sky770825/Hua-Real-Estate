# Google Sheets 配置資訊

## 📊 您的 Google Sheets

**試算表名稱**：BNI_華地產簽到專用  
**Spreadsheet ID**：`1kx_qjCa69vmoPk_clbHHCKg0p8wXlNCqeKyehZCVUNw`  
**連結**：https://docs.google.com/spreadsheets/d/1kx_qjCa69vmoPk_clbHHCKg0p8wXlNCqeKyehZCVUNw/edit

## 📋 欄位格式

| 介紹人 | 名字 | 專業別 | VIP |
|--------|------|--------|-----|
| (空)   | 會員姓名 | 專業別 | (空) |

**注意**：
- 目前資料庫只有「名字」和「專業別」欄位
- 「介紹人」和「VIP」欄位會同步為空值，您可以在 Google Sheets 中手動填寫
- 系統會自動同步「名字」和「專業別」到對應欄位

## 🔧 環境變數設置

在 `.env.local` 檔案中設置：

```env
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=1kx_qjCa69vmoPk_clbHHCKg0p8wXlNCqeKyehZCVUNw
```

**重要**：Spreadsheet ID 已經設定為您的試算表 ID。

## 📝 同步行為

1. **自動同步**：新增/更新/刪除會員時自動同步
2. **手動同步**：點擊後台「同步到 Sheets」按鈕
3. **同步範圍**：A 欄（介紹人）到 D 欄（VIP）
4. **保留格式**：標題行會設定為粗體和灰色背景

## ⚠️ 注意事項

1. **資料保留**：同步時會清空 A:D 欄的資料並重新寫入
2. **手動編輯**：如果您在 Google Sheets 中手動填寫了「介紹人」或「VIP」，下次同步時會被覆蓋
3. **建議**：如果需要保留手動填寫的資料，建議：
   - 將「介紹人」和「VIP」移到其他欄位（如 E、F 欄）
   - 或者使用兩個工作表：一個用於系統同步，一個用於手動編輯

## 🔄 未來擴展

如果需要支援「介紹人」和「VIP」欄位，可以：
1. 在資料庫中添加 `referrer` 和 `is_vip` 欄位
2. 更新同步功能以包含這些欄位
3. 在後台管理系統中添加編輯功能

---

**設置完成後，系統會自動同步會員資料到您的 Google Sheets！** 🎉

