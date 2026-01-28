#!/bin/bash

# Cursor 自動化指揮官 - 部署腳本
# 用法: ./scripts/deploy.sh /path/to/target/project

set -e

# 顏色輸出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 取得當前腳本目錄（指揮官根目錄）
COMMANDER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="${1:-}"

if [ -z "$TARGET_DIR" ]; then
  echo -e "${RED}❌ 錯誤：請指定目標專案路徑${NC}"
  echo "用法: $0 /path/to/target/project"
  exit 1
fi

# 確認目標目錄存在
if [ ! -d "$TARGET_DIR" ]; then
  echo -e "${RED}❌ 錯誤：目標目錄不存在: $TARGET_DIR${NC}"
  exit 1
fi

TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"
DEPLOY_DIR="$TARGET_DIR/.cursor-commander"

echo -e "${BLUE}🧠 Cursor 自動化指揮官 - 部署腳本${NC}"
echo ""
echo "來源目錄: $COMMANDER_DIR"
echo "目標目錄: $TARGET_DIR"
echo "部署位置: $DEPLOY_DIR"
echo ""

# 確認是否覆蓋
if [ -d "$DEPLOY_DIR" ]; then
  echo -e "${YELLOW}⚠️  警告：.cursor-commander 資料夾已存在${NC}"
  read -p "是否要覆蓋？(y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 0
  fi
  rm -rf "$DEPLOY_DIR"
fi

# 複製檔案
echo -e "${BLUE}📦 複製檔案...${NC}"

# 建立目錄結構
mkdir -p "$DEPLOY_DIR"/{core,scripts,rag,supabase/migrations,web}

# 複製核心檔案
echo "  - 核心模組..."
cp -r "$COMMANDER_DIR/core"/* "$DEPLOY_DIR/core/"

# 複製腳本
echo "  - 執行腳本..."
cp "$COMMANDER_DIR/scripts/automate.mjs" "$DEPLOY_DIR/scripts/"
cp "$COMMANDER_DIR/scripts/start.mjs" "$DEPLOY_DIR/scripts/"

# 複製 RAG 檔案
echo "  - RAG 管線..."
cp "$COMMANDER_DIR/rag"/*.mjs "$DEPLOY_DIR/rag/" 2>/dev/null || true
cp "$COMMANDER_DIR/rag"/*.json "$DEPLOY_DIR/rag/" 2>/dev/null || true
cp "$COMMANDER_DIR/rag/.env.example" "$DEPLOY_DIR/rag/" 2>/dev/null || true

# 複製 Supabase migrations
echo "  - Supabase migrations..."
cp -r "$COMMANDER_DIR/supabase/migrations"/* "$DEPLOY_DIR/supabase/migrations/" 2>/dev/null || true

# 複製網頁
echo "  - API 快捷中心..."
cp -r "$COMMANDER_DIR/web"/* "$DEPLOY_DIR/web/" 2>/dev/null || true

# 複製配置檔案
echo "  - 配置檔案..."
cp "$COMMANDER_DIR/automation_commands.json" "$DEPLOY_DIR/"
cp "$COMMANDER_DIR/package.json" "$DEPLOY_DIR/"
cp "$COMMANDER_DIR/cmd" "$DEPLOY_DIR/"
chmod +x "$DEPLOY_DIR/cmd"

# 建立 .env 檔案（如果不存在）
if [ ! -f "$DEPLOY_DIR/rag/.env" ]; then
  if [ -f "$DEPLOY_DIR/rag/.env.example" ]; then
    cp "$DEPLOY_DIR/rag/.env.example" "$DEPLOY_DIR/rag/.env"
    echo -e "${YELLOW}  ⚠️  已建立 .env 檔案，請記得填入實際值${NC}"
  fi
fi

# 建立 rag_export 目錄
mkdir -p "$DEPLOY_DIR/rag/rag_export"

echo ""
echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo "下一步："
echo "  1. 編輯環境變數: $DEPLOY_DIR/rag/.env"
echo "  2. 安裝 RAG 依賴: cd $DEPLOY_DIR/rag && npm install"
echo "  3. 測試: cd $TARGET_DIR && node .cursor-commander/scripts/automate.mjs analyze"
echo ""
echo "詳細說明請查看: $DEPLOY_DIR/../DEPLOY.md"
