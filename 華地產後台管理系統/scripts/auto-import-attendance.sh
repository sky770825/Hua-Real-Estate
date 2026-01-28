#!/bin/bash

# 自動匯入出席統計 CSV 腳本
# 用途：自動讀取 CSV 並匯入到系統中

CSV_FILE="/Users/caijunchang/Downloads/出席統計_2025-07-18_2026-01-14 (1).csv"
API_URL="http://localhost:3001/api/attendance/import"
START_DATE="2025-07-18"
END_DATE="2026-01-14"

echo "🚀 開始自動匯入出席統計..."
echo "📁 CSV 檔案: $CSV_FILE"
echo "📅 日期範圍: $START_DATE 至 $END_DATE"
echo ""

# 檢查檔案是否存在
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ 錯誤：找不到 CSV 檔案: $CSV_FILE"
    exit 1
fi

# 讀取 CSV 內容
CSV_CONTENT=$(cat "$CSV_FILE")

# 準備 JSON 請求
JSON_PAYLOAD=$(cat <<EOF
{
  "csvText": $(echo "$CSV_CONTENT" | jq -Rs .),
  "startDate": "$START_DATE",
  "endDate": "$END_DATE"
}
EOF
)

echo "📤 發送匯入請求..."
echo ""

# 發送請求
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD")

# 顯示結果
echo "$RESPONSE" | jq '.'

# 檢查結果
SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
if [ "$SUCCESS" = "true" ]; then
    echo ""
    echo "✅ 匯入成功！"
    MEETINGS=$(echo "$RESPONSE" | jq -r '.data.meetingsCreated // 0')
    CHECKINS=$(echo "$RESPONSE" | jq -r '.data.checkinsCreated // 0')
    MEMBERS=$(echo "$RESPONSE" | jq -r '.data.membersProcessed // 0')
    echo "📊 結果："
    echo "   - 會議：$MEETINGS 個"
    echo "   - 簽到記錄：$CHECKINS 筆"
    echo "   - 會員：$MEMBERS 位"
else
    echo ""
    echo "❌ 匯入失敗"
    ERROR=$(echo "$RESPONSE" | jq -r '.error // "未知錯誤"')
    echo "錯誤訊息：$ERROR"
    exit 1
fi
