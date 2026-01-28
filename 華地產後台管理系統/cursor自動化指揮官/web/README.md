# 🌐 API 快捷中心

> 現代化的 API 與 Token 管理介面，參考 Lovable AI 設計風格

## 📁 檔案結構

```
web/
├── index.html      # 主頁面
├── styles.css      # 樣式表（Lovable AI 風格）
├── script.js       # 互動功能
└── README.md       # 本說明文件
```

## 🚀 使用方式

### 本地開啟

```bash
# 直接在瀏覽器開啟
open web/index.html

# 或使用簡單的 HTTP 伺服器
cd web
python3 -m http.server 8000
# 然後訪問 http://localhost:8000
```

### 部署

可以部署到任何靜態網站託管服務：

- **Cloudflare Pages**: 連接 GitHub repo，設定 build 目錄為 `web`
- **Netlify**: 設定 build 目錄為 `web`
- **GitHub Pages**: 設定 source 為 `web` 資料夾

## ✨ 功能特色

- ✅ **現代化設計** - 參考 Lovable AI 的設計風格
- ✅ **漸層背景** - 美觀的視覺效果
- ✅ **卡片式佈局** - 清晰的資訊組織
- ✅ **一鍵複製** - 快速複製環境變數名稱
- ✅ **快捷連結** - 直接跳轉到各服務的控制台
- ✅ **響應式設計** - 支援手機、平板、桌面
- ✅ **Toast 通知** - 優雅的操作反饋

## 🎨 設計特色

### 色彩系統

- **主色調**: 紫色漸層 (#6366f1 → #764ba2)
- **卡片背景**: 半透明白色，帶模糊效果
- **陰影**: 多層次陰影，增加深度感

### 互動效果

- **懸停動畫**: 卡片上浮效果
- **按鈕反饋**: 點擊縮放動畫
- **平滑過渡**: 所有動畫使用 ease-in-out

## 📋 包含的 API 服務

### Supabase

- API URL
- Service Role Key
- Access Token
- Project Ref (Staging/Production)
- DB Password (Staging/Production)

### OpenAI

- API Key
- Embedding Model

## 🔧 自訂

### 修改顏色

編輯 `styles.css` 中的 CSS 變數：

```css
:root {
  --primary: #6366f1;
  --secondary: #8b5cf6;
  /* ... */
}
```

### 新增 API 服務

在 `index.html` 中新增 section：

```html
<section class="section">
  <div class="section-header">
    <h2 class="section-title">新服務</h2>
  </div>
  <!-- 卡片內容 -->
</section>
```

## 📱 響應式斷點

- **桌面**: > 768px (3 欄網格)
- **平板**: 768px (2 欄網格)
- **手機**: < 768px (1 欄)

## 🎯 未來擴充

- [ ] 搜尋功能 (Ctrl/Cmd + K)
- [ ] 深色模式切換
- [ ] 環境變數值輸入（本地儲存）
- [ ] 匯出 .env 檔案
- [ ] 更多 API 服務支援
