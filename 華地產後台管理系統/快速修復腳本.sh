#!/bin/bash

# 華地產後台管理系統 - 快速修復腳本
# 用於快速解決常見問題

echo "🔧 華地產後台管理系統 - 快速修復工具"
echo "=================================="
echo ""

# 進入專案目錄
cd "$(dirname "$0")"

# 1. 停止現有伺服器
echo "📌 步驟 1: 停止現有伺服器..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ 已停止現有伺服器"
else
    echo "ℹ️  沒有運行中的伺服器"
fi
sleep 1

# 2. 清除構建快取
echo ""
echo "📌 步驟 2: 清除構建快取..."
rm -rf .next
if [ $? -eq 0 ]; then
    echo "✅ 已清除 .next 目錄"
else
    echo "⚠️  清除快取時出現問題"
fi

# 3. 檢查 Node.js 和 npm
echo ""
echo "📌 步驟 3: 檢查環境..."
NODE_VERSION=$(node --version 2>/dev/null)
NPM_VERSION=$(npm --version 2>/dev/null)
if [ -n "$NODE_VERSION" ] && [ -n "$NPM_VERSION" ]; then
    echo "✅ Node.js: $NODE_VERSION"
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ Node.js 或 npm 未安裝"
    exit 1
fi

# 4. 檢查依賴
echo ""
echo "📌 步驟 4: 檢查依賴..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules 不存在，正在安裝依賴..."
    npm install
else
    echo "✅ 依賴已安裝"
fi

# 5. 啟動伺服器
echo ""
echo "📌 步驟 5: 啟動開發伺服器..."
echo "🚀 伺服器將在 http://localhost:3001 啟動"
echo ""
echo "按 Ctrl+C 可停止伺服器"
echo ""

npm run dev
