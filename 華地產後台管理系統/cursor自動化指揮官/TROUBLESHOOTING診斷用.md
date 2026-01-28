# 🚨 Supabase 故障排除指南

> **快速診斷和修復常見問題**

---

## 📋 目錄

1. [Storage 配置檢查清單](#storage-配置檢查清單)
2. [常見錯誤快速診斷](#常見錯誤快速診斷)
3. [文件路徑處理最佳實踐](#文件路徑處理最佳實踐)
4. [錯誤處理模式](#錯誤處理模式)
5. [驗證檢查清單](#驗證檢查清單)

---

## 🗄️ Storage 配置檢查清單

### 問題：圖片/文件無法上傳或顯示

#### ✅ 檢查步驟

**1. 確認 Storage Bucket 存在**

```sql
-- 在 Supabase SQL Editor 執行
SELECT * FROM storage.buckets;
```

應該看到你的 bucket（例如：`uploads`）

**2. 確認 Bucket 是否為公開（根據需求）**

- **公開訪問**：如果前端需要直接訪問文件 URL
  - 進入：Supabase Dashboard → Storage → Buckets
  - 找到你的 bucket
  - **開啟 "Public bucket" 開關** ⚠️ 重要！

- **私有訪問**：如果文件需要權限控制
  - 保持 "Public bucket" 關閉
  - 使用簽名 URL（`createSignedUrl()`）

**3. 檢查 RLS 策略**

```sql
-- 查看 Storage 策略
SELECT * FROM storage.policies WHERE bucket_id = 'your-bucket-name';
```

**4. 快速修復 RLS 策略（公開讀取）**

如果需要公開讀取，執行以下 SQL：

```sql
-- 允許公開讀取
CREATE POLICY "Allow public read from bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'your-bucket-name');

-- 允許公開上傳（路徑限制）
CREATE POLICY "Allow public uploads to bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
    bucket_id = 'your-bucket-name'
    -- 可選：限制路徑
    -- AND (storage.foldername(name))[1] = 'your-app-id'
);
```

**5. 驗證文件可訪問性**

在瀏覽器控制台測試：

```javascript
const testUrl = 'https://your-project.supabase.co/storage/v1/object/public/your-bucket/path/to/file.jpg';
fetch(testUrl, { method: 'HEAD', mode: 'no-cors' })
    .then(() => console.log('✅ 文件可訪問'))
    .catch(() => console.log('❌ 文件無法訪問'));
```

---

## 🔍 常見錯誤快速診斷

### 錯誤 1：`StorageApiError: new row violates row-level security policy`

#### ❌ 錯誤訊息
```
StorageApiError: new row violates row-level security policy
```

#### 🔍 問題原因
- Storage RLS 策略未配置
- 匿名用戶沒有上傳權限
- 缺少讀取權限策略

#### ✅ 解決方案

**步驟 1：執行 RLS 策略 SQL**

```sql
-- 允許公開讀取
CREATE POLICY "Allow public read from bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'your-bucket-name');

-- 允許公開上傳（可選：限制路徑）
CREATE POLICY "Allow public uploads to bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'your-bucket-name');
```

**步驟 2：設置存儲桶為公開（如果需要）**

1. 訪問：Supabase Dashboard → Storage → Buckets
2. 點擊你的 bucket
3. **開啟 "Public bucket" 開關**
4. 保存設置

---

### 錯誤 2：`InvalidKey` 錯誤

#### ❌ 錯誤訊息
```json
{
    "statusCode": "400",
    "error": "InvalidKey",
    "message": "Invalid key: [文件路径]"
}
```

#### 🔍 問題原因

1. **文件路徑包含非法字符**
   - 特殊字符、空格、中文等
2. **`getPublicUrl()` 參數錯誤**
   - 使用了不支持的參數（例如：`transform: null`）
3. **路徑格式不正確**
   - 雙斜杠、前導斜杠等

#### ✅ 解決方案

**修改 1：文件路徑清理**

```typescript
// 清理路徑，移除非法字符
function sanitizePath(str: string): string {
    return str.replace(/[^a-zA-Z0-9._-]/g, '');
}

const appId = sanitizePath(import.meta.env.VITE_APP_ID);
const userId = sanitizePath(userId);
const fileName = sanitizePath(file.name);

// 路徑格式：{app_id}/{user_id}/yyyy/mm/filename
const filePath = `${appId}/${userId}/${year}/${month}/${fileName}`;
```

**修改 2：移除錯誤的參數**

```typescript
// ❌ 錯誤（會導致 InvalidKey）
const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath, { transform: null });

// ✅ 正確
const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
```

**修改 3：路徑驗證**

```typescript
function validatePath(filePath: string): void {
    if (!filePath || filePath.trim() === '') {
        throw new Error('文件路徑不能為空');
    }
    if (filePath.includes('//')) {
        throw new Error('文件路徑不能包含雙斜杠');
    }
    if (filePath.startsWith('/')) {
        throw new Error('文件路徑不能以斜杠開頭');
    }
}
```

---

### 錯誤 3：圖片/文件無法顯示（403 Forbidden）

#### ❌ 錯誤訊息
```
Failed to load resource: the server responded with a status of 403
```

#### 🔍 問題原因

1. **存儲桶未設置為公開**（最常見）
2. **RLS 策略缺失或錯誤**
3. **URL 格式不正確**

#### ✅ 解決方案

**快速修復（2 步）**：

1. **執行 RLS 策略 SQL**（見上方）
2. **設置存儲桶為公開**
   - 訪問：Supabase Dashboard → Storage → Buckets
   - 開啟 bucket 的 "Public bucket" 開關

**驗證方法**：
```javascript
// 在控制台測試圖片可訪問性
const testUrl = 'https://your-project.supabase.co/storage/v1/object/public/bucket/path/to/file.jpg';
fetch(testUrl, { method: 'HEAD', mode: 'no-cors' })
    .then(() => console.log('✅ 文件可訪問'))
    .catch(() => console.log('❌ 文件無法訪問'));
```

---

### 錯誤 4：Supabase Client 未初始化

#### ❌ 錯誤訊息
```
Cannot read properties of undefined (reading 'storage')
```

#### 🔍 問題原因

- Supabase client 未正確導入
- 環境變數未設置
- 模組導入順序問題

#### ✅ 解決方案

**檢查 1：確認環境變數**

```typescript
// src/lib/supabase.ts
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
    throw new Error('Missing Supabase environment variables');
}
```

**檢查 2：確認導入方式**

```typescript
// ✅ 正確：使用模組導出
import { supabase } from '@/lib/supabase';

// 使用
const { data } = await supabase.storage.from('bucket').list();
```

**檢查 3：確認環境變數檔案**

`.env` 或 `.env.local` 必須包含：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📁 文件路徑處理最佳實踐

### 路徑規範

根據專案架構，文件路徑應遵循以下格式：

```
{app_id}/{user_id}/yyyy/mm/dd/filename.ext
```

**範例**：
```
ai_commander/550e8400-e29b-41d4-a716-446655440000/2025/01/15/document.pdf
```

### 路徑清理函數

```typescript
/**
 * 清理文件路徑，移除非法字符
 */
function sanitizePath(str: string): string {
    return str.replace(/[^a-zA-Z0-9._-]/g, '');
}

/**
 * 驗證文件路徑格式
 */
function validatePath(filePath: string): void {
    if (!filePath || filePath.trim() === '') {
        throw new Error('文件路徑不能為空');
    }
    if (filePath.includes('//')) {
        throw new Error('文件路徑不能包含雙斜杠');
    }
    if (filePath.startsWith('/')) {
        throw new Error('文件路徑不能以斜杠開頭');
    }
}

/**
 * 構建標準文件路徑
 */
function buildFilePath(
    appId: string,
    userId: string,
    fileName: string
): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const sanitizedAppId = sanitizePath(appId);
    const sanitizedUserId = sanitizePath(userId);
    const sanitizedFileName = sanitizePath(fileName);
    
    const filePath = `${sanitizedAppId}/${sanitizedUserId}/${year}/${month}/${day}/${sanitizedFileName}`;
    
    validatePath(filePath);
    return filePath;
}
```

### 完整上傳範例

```typescript
import { supabase } from '@/lib/supabase';

async function uploadFile(file: File, userId: string) {
    const appId = import.meta.env.VITE_APP_ID;
    const bucketName = 'uploads';
    
    // 構建路徑
    const filePath = buildFilePath(appId, userId, file.name);
    
    try {
        // 上傳文件
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) throw error;
        
        // 獲取公開 URL
        const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
        
        return {
            success: true,
            path: filePath,
            url: urlData.publicUrl
        };
    } catch (error) {
        console.error('上傳失敗:', error);
        throw error;
    }
}
```

---

## 🛡️ 錯誤處理模式

### 推薦的錯誤處理模式

```typescript
/**
 * 安全的 Storage 操作包裝函數
 */
async function safeStorageOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string
): Promise<{ success: true; data: T } | { success: false; error: string }> {
    try {
        const client = supabase;
        if (!client) {
            return {
                success: false,
                error: 'Supabase client 未初始化'
            };
        }
        
        const data = await operation();
        return { success: true, data };
    } catch (error: any) {
        console.error(errorMessage, error);
        return {
            success: false,
            error: error.message || errorMessage
        };
    }
}

// 使用範例
const result = await safeStorageOperation(
    async () => {
        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(filePath, file);
        
        if (error) throw error;
        return data;
    },
    '文件上傳失敗'
);

if (result.success) {
    console.log('上傳成功:', result.data);
} else {
    console.error('上傳失敗:', result.error);
}
```

### 重試機制

```typescript
/**
 * 帶重試的 Storage 操作
 */
async function retryStorageOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError || new Error('操作失敗');
}

// 使用範例
try {
    const data = await retryStorageOperation(
        async () => {
            const { data, error } = await supabase.storage
                .from('uploads')
                .upload(filePath, file);
            if (error) throw error;
            return data;
        },
        3, // 最多重試 3 次
        1000 // 每次重試間隔 1 秒
    );
    console.log('上傳成功:', data);
} catch (error) {
    console.error('上傳失敗（已重試）:', error);
}
```

---

## ✅ 驗證檢查清單

### Storage 配置驗證

- [ ] Storage bucket 已創建
- [ ] Bucket 公開設置符合需求（公開/私有）
- [ ] RLS 策略已配置
- [ ] 文件路徑格式符合規範
- [ ] 路徑清理函數已實作
- [ ] 錯誤處理已實作

### 功能驗證

- [ ] 文件上傳功能正常
- [ ] 文件讀取功能正常
- [ ] 公開 URL 可訪問（如果設置為公開）
- [ ] 簽名 URL 可訪問（如果設置為私有）
- [ ] 文件刪除功能正常

### 錯誤檢查

- [ ] 控制台無 `InvalidKey` 錯誤
- [ ] 控制台無 RLS 策略錯誤
- [ ] 控制台無 `StorageApiError` 錯誤
- [ ] 文件可以正常加載和顯示

---

## 🔗 相關文件

- **`SUPABASE_SETUP.md`** - Supabase 核心設定指南
- **`supabase/NEW_APP_GUIDE.md`** - 新專案建立指南
- **`supabase/QUICK_REFERENCE.md`** - Supabase 快速參考

---

## 💡 快速參考

### Storage 公開讀取策略（快速修復）

```sql
-- 複製並替換 'your-bucket-name' 為實際 bucket 名稱
CREATE POLICY "Allow public read from bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'your-bucket-name');
```

### Storage 公開上傳策略（快速修復）

```sql
-- 複製並替換 'your-bucket-name' 為實際 bucket 名稱
CREATE POLICY "Allow public uploads to bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'your-bucket-name');
```

### 路徑清理函數（快速複製）

```typescript
function sanitizePath(str: string): string {
    return str.replace(/[^a-zA-Z0-9._-]/g, '');
}
```

---

**文檔維護者**：開發團隊  
**最後更新**：2025年1月  
**文檔狀態**：✅ 完整且最新

> 💡 **提示**：如果遇到新問題，請先查看本文件的「常見錯誤快速診斷」部分，大部分問題都有對應的解決方案。
