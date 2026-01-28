# 📚 快速參考指南

## 🎯 圖片上傳成功解決方案（快速版）

### 關鍵步驟

1. **設置環境變數**（最重要！）
   - Vercel Dashboard → Settings → Environment Variables
   - 添加 `INFORGE_SERVICE_KEY` = `ik_f82f516f734aa3d618a67f51bb7a583d`
   - 選擇所有環境
   - **重新部署**

2. **創建儲存桶**
   - Insforge Dashboard → Storage
   - 創建 `checkin-prizes` 儲存桶
   - 設置為公開（Public）

3. **使用服務端客戶端**
   - 代碼中使用 `insforgeService` 而不是 `insforge`
   - 檔案轉換為 Blob 類型

## 🔑 環境變數

### 必須設置

- `INFORGE_ANON_KEY` - 用於一般資料庫操作
- `INFORGE_SERVICE_KEY` - 用於文件上傳（值：`ik_f82f516f734aa3d618a67f51bb7a583d`）

### 設置位置

Vercel Dashboard：
```
https://vercel.com/linebot/hua-sign-pri-j5js/settings/environment-variables
```

## 📦 儲存桶設置

### 儲存桶名稱

- `checkin-prizes`（必須完全一致，小寫，使用連字符）

### 創建位置

Insforge Dashboard → Storage → Create Bucket

## 🔧 關鍵代碼

### 使用服務端客戶端

```typescript
// lib/insforge.ts
export const insforgeService = createClient({
  baseUrl,
  anonKey: process.env.INFORGE_SERVICE_KEY || anonKey,
});

// app/api/prizes/route.ts
const blob = new Blob([arrayBuffer], { type: imageFile.type })
await insforgeService.storage
  .from(BUCKETS.PRIZES)
  .upload(fileName, blob)
```

## 📋 檢查清單

### 部署前
- [ ] 環境變數已設置
- [ ] 儲存桶已創建
- [ ] 代碼已推送

### 部署後
- [ ] 部署狀態為 "Ready"
- [ ] 測試圖片上傳
- [ ] 查看 Vercel 日誌確認 `serviceKeySet: true`

## 🆘 常見問題

### 問題 1：上傳失敗
**解決**：檢查 `INFORGE_SERVICE_KEY` 是否已設置並重新部署

### 問題 2：儲存桶錯誤
**解決**：確認 `checkin-prizes` 儲存桶已創建

### 問題 3：外鍵約束錯誤
**解決**：使用服務端 key（`insforgeService`）

## 📞 快速連結

- Vercel Dashboard: https://vercel.com/linebot/hua-sign-pri-j5js
- 環境變數設置: https://vercel.com/linebot/hua-sign-pri-j5js/settings/environment-variables
- 部署狀態: https://vercel.com/linebot/hua-sign-pri-j5js/deployments

---

**快速參考指南已創建！** 📚

