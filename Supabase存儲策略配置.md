# 🔐 Supabase Storage 策略配置指南

## ❌ 錯誤信息

```
StorageApiError: new row violates row-level security policy
```

這個錯誤表示存儲桶的行級安全（RLS）策略阻止了上傳操作。

## ✅ 解決方案：配置存儲策略

### 方法 1：允許匿名用戶上傳（推薦）

1. **訪問 Supabase Dashboard**
   - 打開：https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc/storage/policies

2. **選擇存儲桶**
   - 點擊 `hua-real-estate` 存儲桶

3. **創建上傳策略**
   - 點擊 "New Policy"
   - 選擇 "For full customization"
   - 策略名稱：`Allow public uploads to hua-real-estate project`
   - 策略定義（SQL）：
   ```sql
   -- 允許所有人上傳到 hua-real-estate 項目目錄
   (bucket_id = 'hua-real-estate'::text AND (storage.foldername(name))[1] = 'hua-real-estate')
   ```
   - 點擊 "Review" → "Save Policy"

4. **創建讀取策略（如果需要公開訪問）**
   - 點擊 "New Policy"
   - 策略名稱：`Allow public read from hua-real-estate`
   - 策略定義：
   ```sql
   -- 允許所有人讀取 hua-real-estate 項目目錄下的文件
   (bucket_id = 'hua-real-estate'::text AND (storage.foldername(name))[1] = 'hua-real-estate')
   ```
   - 點擊 "Save Policy"

---

### 方法 2：使用 SQL 編輯器（更靈活）

1. **訪問 SQL Editor**
   - 打開：https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc/sql/new

2. **執行以下 SQL**

```sql
-- 創建上傳策略：允許匿名用戶上傳到 hua-real-estate 項目目錄
CREATE POLICY "Allow public uploads to hua-real-estate project"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'hua-real-estate' 
  AND (storage.foldername(name))[1] = 'hua-real-estate'
);

-- 創建讀取策略：允許公開讀取
CREATE POLICY "Allow public read from hua-real-estate"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'hua-real-estate' 
  AND (storage.foldername(name))[1] = 'hua-real-estate'
);

-- 創建更新策略（可選，如果需要覆蓋文件）
CREATE POLICY "Allow public update in hua-real-estate"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'hua-real-estate' 
  AND (storage.foldername(name))[1] = 'hua-real-estate'
)
WITH CHECK (
  bucket_id = 'hua-real-estate' 
  AND (storage.foldername(name))[1] = 'hua-real-estate'
);

-- 創建刪除策略（可選，如果需要刪除文件）
CREATE POLICY "Allow public delete in hua-real-estate"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'hua-real-estate' 
  AND (storage.foldername(name))[1] = 'hua-real-estate'
);
```

3. **點擊 "Run" 執行 SQL**

---

### 方法 3：簡化策略（允許所有操作，僅用於測試）

⚠️ **注意**：這個策略允許對整個存儲桶的所有操作，僅用於測試。

```sql
-- 允許所有操作（僅測試用，不推薦生產環境）
CREATE POLICY "Allow all operations on hua-real-estate bucket"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'hua-real-estate')
WITH CHECK (bucket_id = 'hua-real-estate');
```

---

## 🔍 驗證策略

配置完成後：

1. **檢查策略**
   - 訪問：https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc/storage/policies
   - 確認 `hua-real-estate` 存儲桶下有創建的策略

2. **測試上傳**
   - 刷新 `invite.html` 頁面
   - 嘗試上傳圖片
   - 應該可以成功上傳

---

## 📋 策略說明

### 策略結構

```sql
CREATE POLICY "策略名稱"
ON storage.objects
FOR [操作類型]  -- INSERT, SELECT, UPDATE, DELETE
TO public      -- 目標角色（public = 匿名用戶）
USING (...)    -- 讀取條件
WITH CHECK (...) -- 寫入條件
```

### 路徑檢查

- `(storage.foldername(name))[1]` - 獲取文件路徑的第一層目錄
- 例如：`hua-real-estate/invite-photo/image.jpg` → `hua-real-estate`

### 安全建議

1. **限制上傳路徑**：只允許上傳到特定項目目錄
2. **限制文件類型**：可以在策略中添加文件類型檢查
3. **限制文件大小**：在應用層面處理（代碼中已有 10MB 限制）

---

## 🛠️ 如果策略已存在

如果策略已存在，需要先刪除舊策略：

```sql
-- 刪除現有策略
DROP POLICY IF EXISTS "Allow public uploads to hua-real-estate project" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from hua-real-estate" ON storage.objects;
```

然後重新創建。

---

## ✅ 完成後

配置完成後，上傳功能應該可以正常工作了！

如果還有問題，請檢查：
1. 存儲桶是否設置為 Public
2. 策略是否正確創建
3. 策略的條件是否匹配文件路徑
