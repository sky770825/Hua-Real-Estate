# 📦 Supabase Storage 配置說明

## 🎯 項目信息

- **項目 URL**: https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc
- **項目 ID**: sqgrnowrcvspxhuudrqc
- **Supabase URL**: https://sqgrnowrcvspxhuudrqc.supabase.co

## 📋 配置步驟

### 步驟 1：獲取 API Key

1. 訪問：https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc/settings/api
2. 在 "Project API keys" 部分
3. 複製 **"anon"** 或 **"public"** key
4. 這個 key 是公開的，可以安全地在前端使用

### 步驟 2：配置代碼

在 `invite.html` 中找到 `SUPABASE_CONFIG`（約第 3090 行），設置：

```javascript
const SUPABASE_CONFIG = {
    url: 'https://sqgrnowrcvspxhuudrqc.supabase.co',
    anonKey: '您的anon key', // 從步驟1獲取
    bucketName: 'hua-real-estate',
    projectName: 'hua-real-estate', // 項目名稱，用於分類
    moduleName: 'invite-photo' // 功能模塊名稱
};
```

### 步驟 3：創建存儲桶

1. 訪問：https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc/storage/buckets
2. 點擊 "New bucket"
3. 名稱輸入：`hua-real-estate`
4. **重要**：設置為 **Public**（公開）
5. 點擊 "Create bucket"

### 步驟 4：配置存儲策略（可選，但推薦）

為了安全，建議設置存儲策略：

1. 訪問：https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc/storage/policies
2. 選擇 `hua-real-estate` 存儲桶
3. 點擊 "New Policy"
4. 選擇 "For full customization"
5. 策略名稱：`Allow public uploads`
6. 策略定義：
   ```sql
   -- 允許所有人上傳文件
   (bucket_id = 'hua-real-estate'::text)
   ```
7. 或者使用更安全的策略（僅允許上傳到特定路徑）：
   ```sql
   -- 僅允許上傳到 hua-real-estate 項目目錄
   (bucket_id = 'hua-real-estate'::text AND (storage.foldername(name))[1] = 'hua-real-estate')
   ```

---

## 📁 文件分類結構

文件會按照以下結構上傳：

```
hua-real-estate/
  └── invite-photo/
      ├── image1_1234567890.jpg
      └── image2_1234567890.jpg
```

### 分類說明

- **項目名稱** (`projectName`): `hua-real-estate` - 用於區分不同項目
- **功能模塊** (`moduleName`): `invite-photo` - 用於區分不同功能
- **文件名**: 自動生成，包含時間戳

### 修改分類

如果需要上傳到其他分類，可以修改 `moduleName`：

```javascript
// 例如：上傳到其他功能模塊
moduleName: 'event-photos' // 活動照片
moduleName: 'member-avatars' // 會員頭像
moduleName: 'documents' // 文件
```

---

## ✅ 驗證配置

配置完成後：

1. 打開 `invite.html` 頁面
2. 點擊右下角的上傳圖標（📤）
3. 輸入密碼：`888`
4. 選擇圖片上傳
5. 如果配置正確，會顯示 "✅ 上傳成功"

---

## 🔍 檢查上傳的文件

1. 訪問：https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc/storage/buckets/hua-real-estate
2. 查看文件列表
3. 確認文件路徑為：`hua-real-estate/invite-photo/imageX_xxx.jpg`

---

## 🛠️ 常見問題

### Q: 上傳失敗，提示 "Bucket not found"
**A:** 確認存儲桶名稱正確，並且已經創建。

### Q: 上傳失敗，提示 "new row violates row-level security policy"
**A:** 需要配置存儲策略，允許上傳。參考步驟 4。

### Q: 上傳成功但無法訪問圖片
**A:** 確認存儲桶設置為 **Public**（公開）。

### Q: 如何修改分類路徑？
**A:** 修改 `SUPABASE_CONFIG.moduleName` 即可。

---

## 📝 注意事項

1. **anon key 是公開的**，可以安全地在前端使用
2. **存儲桶必須設置為 Public** 才能通過 URL 訪問
3. **文件路徑會自動分類**，方便管理多個項目
4. **建議設置存儲策略**，限制上傳權限

---

## 🎉 完成！

配置完成後，上傳功能就可以正常使用了！
