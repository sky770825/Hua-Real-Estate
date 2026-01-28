# 📤 Git Push 說明

## 🤔 Git Push 是什麼？

`git push` 是將您本地（電腦上）的程式碼**上傳到 GitHub** 的命令。

## 📋 簡單理解

想像一下：
- **本地（您的電腦）** = 您的工作桌
- **GitHub** = 雲端儲存空間
- **git push** = 將工作桌上的檔案上傳到雲端

## 🔄 完整工作流程

### 步驟 1: 修改代碼
在您的電腦上編輯檔案

### 步驟 2: git add
告訴 Git 哪些檔案要上傳
```bash
git add .
```
（`.` 表示所有修改的檔案）

### 步驟 3: git commit
記錄這次修改的說明
```bash
git commit -m "更新說明"
```
（例如："修復登入問題"、"新增抽獎功能"）

### 步驟 4: git push
將修改上傳到 GitHub
```bash
git push
```

## 🎯 實際操作示例

### 示例：修改後台標題

```bash
# 1. 您修改了檔案（例如：app/admin/attendance_management/page.tsx）
#    將標題從 "後台管理" 改為 "華地產管理系統"

# 2. 告訴 Git 要上傳這個檔案
git add app/admin/attendance_management/page.tsx

# 3. 記錄這次修改
git commit -m "更新後台標題為華地產管理系統"

# 4. 上傳到 GitHub
git push
```

## 📝 詳細說明

### git add
- **作用**：選擇要上傳的檔案
- **用法**：
  - `git add .` - 選擇所有修改的檔案
  - `git add 檔案名稱` - 選擇特定檔案

### git commit
- **作用**：記錄這次修改的說明
- **用法**：`git commit -m "說明文字"`
- **說明文字**：簡單描述您做了什麼修改

### git push
- **作用**：將修改上傳到 GitHub
- **用法**：`git push`
- **結果**：GitHub 上的程式碼會更新

## 🔍 查看狀態

### 查看哪些檔案被修改了
```bash
git status
```

### 查看修改的內容
```bash
git diff
```

## ⚠️ 注意事項

### 第一次使用需要認證
第一次 `git push` 時，可能需要輸入：
- **Username**: `sky770825`
- **Password**: 使用 GitHub Personal Access Token（不是 GitHub 密碼）

### 如果推送失敗
- 檢查網路連接
- 確認 GitHub 倉庫存在
- 確認有推送權限

## 🎯 完整流程圖

```
修改代碼
   ↓
git add .          (選擇要上傳的檔案)
   ↓
git commit -m "說明"  (記錄修改說明)
   ↓
git push            (上傳到 GitHub)
   ↓
Vercel 自動檢測
   ↓
自動部署到網站
```

## 💡 快速記憶

- **git add** = 選擇檔案
- **git commit** = 記錄說明
- **git push** = 上傳到 GitHub

## 📚 相關命令

### 查看狀態
```bash
git status        # 查看哪些檔案被修改了
```

### 查看歷史
```bash
git log           # 查看所有提交記錄
```

### 拉取最新代碼
```bash
git pull          # 從 GitHub 下載最新代碼
```

## ✨ 總結

- **git push** = 將本地修改上傳到 GitHub
- **流程**：修改 → add → commit → push
- **結果**：GitHub 更新 → Vercel 自動部署

---

**簡單說：git push 就是將您的程式碼上傳到 GitHub！** 📤

