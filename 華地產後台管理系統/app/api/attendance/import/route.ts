import { NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { apiError, apiSuccess, safeJsonParse } from '@/lib/api-utils'
import { cache, CACHE_KEYS } from '@/lib/cache'

export const dynamic = 'force-dynamic'

interface AttendanceStatsRow {
  memberId: number
  name: string
  totalMeetings: number
  presentCount: number
  lateCount: number
  proxyCount: number
  absentCount: number
}

/**
 * 解析 CSV 內容
 */
function parseCSV(csvText: string): AttendanceStatsRow[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) {
    throw new Error('CSV 檔案格式錯誤：至少需要標題行和一行資料')
  }

  // 跳過標題行
  const dataLines = lines.slice(1)
  const rows: AttendanceStatsRow[] = []

  for (const line of dataLines) {
    const columns = line.split(',').map(col => col.trim())
    if (columns.length < 7) continue

    const memberId = parseInt(columns[0])
    const name = columns[1]
    const totalMeetings = parseInt(columns[2]) || 0
    const presentCount = parseInt(columns[3]) || 0
    const lateCount = parseInt(columns[4]) || 0
    const proxyCount = parseInt(columns[5]) || 0
    const absentCount = parseInt(columns[6]) || 0

    if (isNaN(memberId) || !name) continue

    rows.push({
      memberId,
      name,
      totalMeetings,
      presentCount,
      lateCount,
      proxyCount,
      absentCount,
    })
  }

  return rows
}

/**
 * 獲取日期範圍內的所有週四
 */
function getThursdaysInRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const thursdays: string[] = []

  // 找到第一個週四
  const dayOfWeek = start.getDay()
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7
  const firstThursday = new Date(start)
  firstThursday.setDate(start.getDate() + daysUntilThursday)

  // 生成所有週四
  const current = new Date(firstThursday)
  while (current <= end) {
    thursdays.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 7)
  }

  return thursdays
}

/**
 * 匯入出席統計數據
 */
export async function POST(request: Request) {
  try {
    const { data: body, error: parseError } = await safeJsonParse<{
      csvText?: string
      startDate?: string
      endDate?: string
    }>(request)

    if (parseError || !body) {
      return apiError('請求格式錯誤：無法解析 JSON', 400)
    }

    const { csvText, startDate, endDate } = body

    if (!csvText) {
      return apiError('CSV 內容為必填', 400)
    }

    if (!startDate || !endDate) {
      return apiError('開始日期和結束日期為必填', 400)
    }

    // 解析 CSV
    const statsRows = parseCSV(csvText)
    if (statsRows.length === 0) {
      return apiError('CSV 檔案中沒有有效的資料', 400)
    }

    // 獲取日期範圍內的所有週四
    const thursdays = getThursdaysInRange(startDate, endDate)
    
    // 根據總會議數，取前 N 個週四作為會議日期
    // 確保所有會員都使用相同的會議數量（20個會議）
    const maxTotalMeetings = Math.max(...statsRows.map(r => r.totalMeetings))
    const meetingDates = thursdays.slice(0, maxTotalMeetings)
    
    console.log(`📊 匯入統計：${statsRows.length} 位會員，${meetingDates.length} 個會議，日期範圍：${meetingDates[0]} 至 ${meetingDates[meetingDates.length - 1]}`)

    if (meetingDates.length === 0) {
      return apiError('日期範圍內沒有週四', 400)
    }

    console.log(`開始匯入出席統計：${statsRows.length} 位會員，${meetingDates.length} 個會議`)

    // 1. 創建所有會議
    const meetingInserts = meetingDates.map(date => ({
      date,
      status: 'completed' as const,
    }))

    const { error: meetingsError } = await supabase
      .from(TABLES.MEETINGS)
      .upsert(meetingInserts, { onConflict: 'date' })

    if (meetingsError) {
      console.error('創建會議失敗:', meetingsError)
      return apiError(`創建會議失敗：${meetingsError.message}`, 500)
    }

    console.log(`✅ 已創建/更新 ${meetingDates.length} 個會議`)

    // 2. 為每位會員創建簽到記錄（使用批量插入優化效能）
    let totalCheckinsCreated = 0
    const errors: string[] = []
    
    // 準備所有簽到記錄（批量插入）
    const checkinInserts: Array<{
      member_id: number
      meeting_date: string
      checkin_time: string
      status: string
      message?: string
    }> = []

    for (const row of statsRows) {
      try {
        // 計算出席、遲到、代理出席、缺席的分配
        // 注意：CSV 中的「出席次數」可能包含代理出席（因為總和可能超過總會議數）
        // 系統中沒有 proxy 狀態，所以代理出席會計入出席（present），但在 message 中標記
        // 分配策略：先分配代理出席，再分配正常出席
        let presentRemaining = row.presentCount  // 出席次數（可能包含代理出席）
        let lateRemaining = row.lateCount        // 遲到
        let proxyRemaining = row.proxyCount      // 代理出席（會計入出席總數）
        let absentRemaining = row.absentCount    // 缺席
        
        // 如果出席次數包含代理出席，需要調整
        // 策略：先分配代理出席，然後從出席次數中扣除已分配的代理出席
        // 但為了簡單起見，我們先分配代理出席，再分配正常出席

        // 為每個會議創建簽到記錄
        // 重要：即使會員的 totalMeetings 小於 20，也要為所有 20 個會議創建記錄
        // 這樣統計報表才能正確顯示所有會員都有 20 個會議的數據
        for (let i = 0; i < meetingDates.length; i++) {
          const meetingDate = meetingDates[i]
          
          // 如果這個會議超出了該會員的 totalMeetings，標記為缺席
          if (i >= row.totalMeetings) {
            // 這個會員在這個會議時還沒有加入，標記為缺席
            const checkinTime = new Date(meetingDate + 'T19:00:00').toISOString()
            checkinInserts.push({
              member_id: row.memberId,
              meeting_date: meetingDate,
              checkin_time: checkinTime,
              status: 'absent',
            })
            continue
          }
          
          let status = 'present'
          let message: string | undefined = undefined
          
          // 分配邏輯：
          // 1. 優先分配缺席（因為最明確）
          // 2. 然後分配遲到
          // 3. 然後分配代理出席（在 message 中標記，優先於正常出席）
          // 4. 最後是正常出席
          if (absentRemaining > 0) {
            status = 'absent'
            absentRemaining--
          }
          else if (lateRemaining > 0) {
            status = 'late'
            lateRemaining--
          }
          else if (proxyRemaining > 0) {
            // 代理出席：狀態為 present，但在 message 中標記
            status = 'present'
            message = '[代理出席]'
            proxyRemaining--
          }
          else if (presentRemaining > 0) {
            status = 'present'
            presentRemaining--
          }

          const checkinTime = new Date(meetingDate + 'T19:00:00').toISOString()
          
          checkinInserts.push({
            member_id: row.memberId,
            meeting_date: meetingDate,
            checkin_time: checkinTime,
            status: status,
            message: message,
          })
        }
      } catch (error) {
        errors.push(`處理會員 ${row.memberId} (${row.name}) 時出錯：${error instanceof Error ? error.message : '未知錯誤'}`)
      }
    }

    // 批量插入簽到記錄（每批 500 筆）
    const batchSize = 500
    for (let i = 0; i < checkinInserts.length; i += batchSize) {
      const batch = checkinInserts.slice(i, i + batchSize)
      
      const { error: batchError } = await supabase
        .from(TABLES.CHECKINS)
        .upsert(batch, {
          onConflict: 'member_id,meeting_date',
        })

      if (batchError) {
        console.error(`批量插入失敗（批次 ${Math.floor(i / batchSize) + 1}）:`, batchError)
        errors.push(`批量插入簽到記錄失敗（批次 ${Math.floor(i / batchSize) + 1}）：${batchError.message}`)
      } else {
        totalCheckinsCreated += batch.length
        console.log(`✅ 已插入批次 ${Math.floor(i / batchSize) + 1}：${batch.length} 筆簽到記錄`)
      }
    }

    // 清除所有相關快取
    cache.delete(CACHE_KEYS.MEETINGS)
    meetingDates.forEach(date => {
      cache.delete(CACHE_KEYS.CHECKINS(date))
    })
    console.log('🗑️ 已清除相關快取')

    const result = {
      success: true,
      meetingsCreated: meetingDates.length,
      checkinsCreated: totalCheckinsCreated,
      membersProcessed: statsRows.length,
      errors: errors.length > 0 ? errors : undefined,
    }

    console.log('匯入完成:', result)

    return apiSuccess(result, errors.length > 0 
      ? `匯入完成，但有 ${errors.length} 個錯誤` 
      : '匯入成功')
  } catch (error) {
    console.error('匯入出席統計失敗:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`匯入失敗：${errorMessage}`, 500)
  }
}
