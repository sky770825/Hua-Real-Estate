# 🔑 使用 API Token 自動化部署

## 為什麼需要手動登錄？

`wrangler login` 使用 OAuth 流程，需要瀏覽器授權，這是 Cloudflare 的安全機制，無法完全自動化。

## ✅ 解決方案：使用 API Token（可以自動化）

### 步驟 1：創建 API Token

1. 訪問：https://dash.cloudflare.com/profile/api-tokens
2. 點擊 "Create Token"
3. 選擇 "Edit Cloudflare Workers" 模板
4. 或者自定義權限：
   - Account: Cloudflare Workers:Edit
   - Account: Account Settings:Read
   - Zone: Zone Settings:Read（如果需要）
5. 點擊 "Continue to summary" → "Create Token"
6. **複製 Token**（只顯示一次！）

### 步驟 2：設置環境變量

在終端運行：
```bash
export CLOUDFLARE_API_TOKEN="您的Token"
```

或者在 `wrangler.toml` 中添加：
```toml
# wrangler.toml
name = "r2-upload"
main = "r2-upload-worker.js"
compatibility_date = "2024-01-01"

# 使用 API Token（可選，如果設置了環境變量就不需要）
# 注意：不要將 Token 提交到 Git！

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "hua-real-estate"
```

### 步驟 3：自動部署

設置 Token 後，就可以直接部署了：
```bash
wrangler deploy
```

---

## 🚀 更簡單的方案：手動創建 Worker（推薦）

如果自動化太複雜，最簡單的方式是：

### 在 Cloudflare Dashboard 手動創建：

1. **訪問**：https://dash.cloudflare.com
2. **進入**：Workers & Pages → Create application → Create Worker
3. **命名**：`r2-upload`
4. **複製代碼**：
   - 打開 `r2-upload-worker.js`
   - 複製全部代碼
   - 貼到 Worker 編輯器
5. **綁定 R2**：
   - 點擊右上角 Settings
   - Variables → R2 Bucket Bindings
   - Add binding
   - Variable name: `R2_BUCKET`
   - R2 Bucket: `hua-real-estate`
   - Save
6. **部署**：點擊 "Save and Deploy"
7. **複製 URL**：部署後會顯示 Worker URL

### 然後配置到代碼：

在 `invite.html` 第 3097 行設置 `apiEndpoint` 即可！

---

## 💡 推薦方案

**手動在 Dashboard 創建**是最簡單的方式，只需要：
- 複製代碼（1分鐘）
- 綁定 R2（1分鐘）
- 部署（1分鐘）
- 配置 URL（30秒）

總共不到 5 分鐘！
