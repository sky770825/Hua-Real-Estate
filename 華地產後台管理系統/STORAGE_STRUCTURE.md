# 📁 儲存桶資料夾結構設計

## 🎯 設計理念

所有 `estate_attendance` 簽到系統的文件都統一存放在 `estate_attendance` 儲存桶中，通過子資料夾來分類管理不同類型的文件。

## 📂 資料夾結構

```
estate_attendance/                    ← 統一儲存桶
  ├── prizes/                         ← 獎品圖片
  │   └── prizes/1234567890-abc.jpg
  ├── meetings/                       ← 會議相關文件（未來擴展）
  │   └── meetings/2025/01/xxx.pdf
  ├── members/                        ← 會員相關文件（未來擴展）
  │   └── members/avatars/xxx.jpg
  └── checkins/                       ← 簽到相關文件（未來擴展）
      └── checkins/attachments/xxx.pdf
```

## ✅ 目前使用的資料夾

### `prizes/`
- **用途**: 儲存獎品圖片
- **路徑格式**: `prizes/prizes/{timestamp}-{random}.{extension}`
- **檔案類型**: JPG, PNG, GIF, WebP
- **檔案大小限制**: 5MB

## 🚀 未來可擴展的資料夾

### `meetings/`
- 會議議程文件
- 會議記錄
- 會議照片

### `members/`
- 會員頭像
- 會員證件照片
- 會員相關文件

### `checkins/`
- 簽到附件
- 簽到照片
- 簽到相關文件

## 📝 使用規範

1. **統一使用 `estate_attendance` 儲存桶**
   - 所有文件都存放在這個儲存桶中
   - 通過資料夾路徑來區分不同類型的文件

2. **資料夾命名規範**
   - 使用小寫字母和底線
   - 名稱要清晰表達用途
   - 避免使用特殊字符

3. **檔案命名規範**
   - 使用時間戳 + 隨機字串確保唯一性
   - 格式：`{timestamp}-{random}.{extension}`
   - 範例：`prizes/1234567890-abc123.jpg`

4. **路徑結構**
   - 第一層：功能分類（prizes, meetings, members, checkins）
   - 第二層：可選的子分類（如年份、月份等）
   - 最後：實際檔案名稱

## 🔧 技術實現

### 儲存桶配置
- **名稱**: `estate_attendance`
- **公開存取**: ✅ 是
- **RLS 策略**: 已設置（允許讀取、上傳、刪除）

### 代碼配置
```typescript
// lib/insforge.ts
export const BUCKETS = {
  PRIZES: 'estate_attendance',
} as const;

// 上傳路徑範例
const fileName = `prizes/${Date.now()}-${random}.${extension}`
```

## 📌 優勢

1. **統一管理**: 所有文件在一個儲存桶中，方便管理
2. **避免衝突**: 通過資料夾結構避免不同類型文件衝突
3. **易於擴展**: 未來新增功能只需新增對應資料夾
4. **清晰結構**: 資料夾名稱清楚表達用途
5. **成本優化**: 單一儲存桶，減少管理複雜度
