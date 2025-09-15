# GitHub 認證配置指南

## 為什麼需要配置Git認證？

當您要將代碼推送到GitHub時，GitHub需要知道是誰在推送代碼。這就是為什麼需要配置Git身份和認證的原因。

## 步驟一：配置Git身份

### 方法一：使用配置工具 (推薦)
1. 雙擊執行 `Git配置工具.bat`
2. 輸入您的姓名和Email
3. 工具會自動配置Git身份

### 方法二：手動配置
```bash
# 配置用戶姓名
git config --global user.name "您的姓名"

# 配置用戶Email
git config --global user.email "您的Email@example.com"

# 檢查配置
git config --global --list
```

## 步驟二：配置GitHub認證

### 方法一：Personal Access Token (推薦)

#### 1. 創建Personal Access Token
1. 前往 [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. 點擊 "Generate new token (classic)"
3. 填寫以下資訊：
   - **Note**: 華地產網站部署
   - **Expiration**: 選擇合適的過期時間
   - **Scopes**: 勾選 `repo` (完整倉庫權限)
4. 點擊 "Generate token"
5. **重要**: 複製生成的token並保存好

#### 2. 使用Token進行認證
當Git要求輸入密碼時：
- **用戶名**: 您的GitHub用戶名
- **密碼**: 使用剛才生成的Personal Access Token

### 方法二：SSH Key (進階)

#### 1. 生成SSH Key
```bash
# 生成新的SSH Key
ssh-keygen -t rsa -b 4096 -C "您的Email@example.com"

# 按Enter使用默認路徑
# 設置密碼（可選）
```

#### 2. 添加SSH Key到GitHub
```bash
# 複製公鑰內容
cat ~/.ssh/id_rsa.pub

# 或者使用Windows命令
type %USERPROFILE%\.ssh\id_rsa.pub
```

1. 前往 [GitHub Settings > SSH Keys](https://github.com/settings/keys)
2. 點擊 "New SSH key"
3. 貼上剛才複製的公鑰內容
4. 點擊 "Add SSH key"

#### 3. 測試SSH連接
```bash
ssh -T git@github.com
```

## 步驟三：測試配置

### 測試Git身份
```bash
git config --global user.name
git config --global user.email
```

### 測試GitHub連接
```bash
# 如果使用HTTPS
git ls-remote https://github.com/sky770825/Hua-Real-Estate.git

# 如果使用SSH
git ls-remote git@github.com:sky770825/Hua-Real-Estate.git
```

## 常見問題解決

### 問題1：認證失敗
**錯誤**: `remote: Support for password authentication was removed`
**解決**: 使用Personal Access Token替代密碼

### 問題2：權限被拒絕
**錯誤**: `Permission denied (publickey)`
**解決**: 檢查SSH Key是否正確添加到GitHub

### 問題3：Token過期
**錯誤**: `Authentication failed`
**解決**: 重新生成Personal Access Token

## 安全建議

1. **保護您的Token**: 不要將Token分享給他人
2. **定期更新**: 定期更新Personal Access Token
3. **最小權限**: 只給予必要的權限
4. **使用環境變量**: 可以將Token存儲在環境變量中

## 快速配置腳本

如果您想要一鍵配置，可以創建以下腳本：

```bash
# 配置Git身份
git config --global user.name "您的姓名"
git config --global user.email "您的Email@example.com"

# 設置認證助手（Windows）
git config --global credential.helper manager-core

# 設置默認分支名
git config --global init.defaultBranch main
```

## 完成後的使用

配置完成後，您就可以：
1. 使用 `華地產部署工具增強版.bat` 進行版本管理
2. 使用 `一鍵部署當前版本.bat` 快速部署
3. 正常推送到GitHub倉庫

---

**需要幫助？** 如果遇到問題，請檢查：
1. 網路連接是否正常
2. GitHub帳號是否有倉庫權限
3. Token是否有效且未過期
4. Git配置是否正確
