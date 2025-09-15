# GitHub Token 安全使用指南

## ⚠️ 重要安全提醒

**您剛才分享的Token已暴露，請立即執行以下步驟：**

### 1. 立即撤銷舊Token
1. 前往 [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. 找到剛才分享的Token
3. 點擊 "Delete" 刪除它

### 2. 生成新Token
1. 點擊 "Generate new token (classic)"
2. 填寫以下資訊：
   - **Note**: 華地產網站部署
   - **Expiration**: 選擇合適的過期時間（建議90天）
   - **Scopes**: 勾選 `repo` 權限
3. 點擊 "Generate token"
4. **立即複製並保存**新Token

## 安全使用Token

### ✅ 正確做法
- 將Token保存在安全的地方（如密碼管理器）
- 只在需要時使用Token
- 定期更新Token
- 使用環境變量存儲Token

### ❌ 錯誤做法
- 不要在聊天中分享Token
- 不要將Token提交到代碼倉庫
- 不要在不安全的環境中使用Token
- 不要將Token分享給他人

## 使用新Token配置

### 方法一：使用配置腳本
1. 執行 `使用Token配置Git.bat`
2. 輸入您的資訊
3. 在要求密碼時使用新Token

### 方法二：手動配置
```bash
# 配置Git身份
git config --global user.name "您的姓名"
git config --global user.email "您的Email@example.com"

# 推送時使用Token
git push -u origin main
# 用戶名: 您的GitHub用戶名
# 密碼: 您的新Token
```

## 環境變量配置（可選）

為了更安全地使用Token，可以設置環境變量：

### Windows
```cmd
# 設置環境變量
setx GITHUB_TOKEN "您的新Token"

# 重啟命令提示符後使用
echo %GITHUB_TOKEN%
```

### 在Git中使用環境變量
```bash
# 使用環境變量作為密碼
git config --global credential.helper manager-core
```

## 測試配置

配置完成後，測試連接：

```bash
# 測試GitHub連接
git ls-remote https://github.com/sky770825/Hua-Real-Estate.git

# 測試推送
git push origin main
```

## 故障排除

### 問題1：認證失敗
**錯誤**: `Authentication failed`
**解決**: 檢查Token是否正確且未過期

### 問題2：權限被拒絕
**錯誤**: `Permission denied`
**解決**: 確認Token有 `repo` 權限

### 問題3：Token過期
**錯誤**: `Token expired`
**解決**: 重新生成新Token

## 定期維護

### 建議的維護週期
- **每30天**: 檢查Token狀態
- **每90天**: 更新Token
- **每次使用前**: 確認Token有效

### 監控Token使用
1. 前往 [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. 查看Token的最後使用時間
3. 如果發現異常使用，立即撤銷Token

## 完成後的使用

配置完成後，您就可以：
1. 使用 `華地產部署工具增強版.bat` 進行版本管理
2. 使用 `一鍵部署當前版本.bat` 快速部署
3. 正常推送到GitHub倉庫

---

**記住**: 安全第一！永遠不要在公開場所分享您的Token。
