# Git 新手入門指南

## 什麼是Git？

Git就像是一個「時光機」，可以幫您：
- 📝 記錄每次修改
- 🔄 回到任何一個版本
- 👥 多人協作開發
- ☁️ 把代碼存到雲端（GitHub）

## Git的基本概念

### 1. 倉庫 (Repository)
- 就像一個「資料夾」，存放您的所有代碼
- 本地倉庫：存在您的電腦上
- 遠端倉庫：存在GitHub上

### 2. 提交 (Commit)
- 就像「拍照」，記錄當前的代碼狀態
- 每次修改後都要「拍照」保存

### 3. 推送 (Push)
- 把本地的修改「上傳」到GitHub
- 讓其他人也能看到您的修改

## Git的基本操作

### 第一次使用Git

#### 1. 配置身份（只需要做一次）
```bash
# 告訴Git您是誰
git config --global user.name "您的姓名"
git config --global user.email "您的Email@example.com"
```

#### 2. 初始化倉庫
```bash
# 在您的項目資料夾中執行
git init
```

#### 3. 添加檔案
```bash
# 添加所有檔案
git add .

# 或者添加特定檔案
git add index.html
git add styles.css
```

#### 4. 提交修改
```bash
# 提交並加上說明
git commit -m "這是我的第一次提交"
```

#### 5. 連接到GitHub
```bash
# 連接到GitHub倉庫
git remote add origin https://github.com/sky770825/Hua-Real-Estate.git
```

#### 6. 推送到GitHub
```bash
# 上傳到GitHub
git push -u origin main
```

### 日常使用Git

#### 修改檔案後的流程
```bash
# 1. 添加修改的檔案
git add .

# 2. 提交修改
git commit -m "修改了首頁內容"

# 3. 推送到GitHub
git push
```

## 常用Git命令

### 查看狀態
```bash
# 查看當前狀態
git status

# 查看修改歷史
git log --oneline
```

### 檔案操作
```bash
# 添加檔案
git add 檔案名

# 添加所有檔案
git add .

# 提交修改
git commit -m "修改說明"
```

### 遠端操作
```bash
# 推送到GitHub
git push

# 從GitHub下載
git pull

# 查看遠端倉庫
git remote -v
```

## 實際操作範例

### 範例：更新網站內容

假設您要修改 `index.html` 檔案：

```bash
# 1. 修改檔案（用編輯器打開index.html，修改內容）

# 2. 查看修改了什麼
git status

# 3. 添加修改的檔案
git add index.html

# 4. 提交修改
git commit -m "更新首頁標題"

# 5. 推送到GitHub
git push
```

## 常見問題解決

### 問題1：第一次推送失敗
**錯誤**: `Authentication failed`
**解決**: 需要配置GitHub認證

### 問題2：推送被拒絕
**錯誤**: `rejected`
**解決**: 先執行 `git pull` 再推送

### 問題3：忘記提交說明
**錯誤**: `Please enter a commit message`
**解決**: 按 `Esc` 然後輸入 `:wq` 退出

## 使用我們的工具

### 方法一：使用一鍵配置
1. 雙擊 `一鍵配置Git和GitHub.bat`
2. 按照提示輸入資訊
3. 完成後就可以使用部署工具

### 方法二：使用部署工具
1. 配置完成後，使用 `華地產部署工具增強版.bat`
2. 選擇要執行的操作
3. 工具會自動處理Git操作

## 簡單記憶法

### 日常使用三步驟
1. **修改** → 編輯檔案
2. **添加** → `git add .`
3. **提交** → `git commit -m "說明"`
4. **推送** → `git push`

### 記住這個流程
```
修改檔案 → git add . → git commit -m "說明" → git push
```

## 需要幫助？

如果您遇到問題：
1. 檢查網路連接
2. 確認GitHub認證
3. 使用我們的配置工具
4. 查看錯誤訊息

記住：Git就像學習騎腳踏車，一開始可能會跌倒，但學會後就很簡單了！

---

**提示**: 使用我們的工具可以讓Git操作變得更簡單，您不需要記住所有命令。
