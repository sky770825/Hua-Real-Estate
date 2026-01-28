import { NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { apiError, apiSuccess } from '@/lib/api-utils'
import { cache, CACHE_KEYS } from '@/lib/cache'

export const dynamic = 'force-dynamic'

/**
 * 獲取日期範圍內的所有週四
 */
function getThursdaysInRange(startDate: string, endDate: string, count: number): string[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const thursdays: string[] = []

  // 找到第一個週四
  const dayOfWeek = start.getDay()
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7
  const firstThursday = new Date(start)
  firstThursday.setDate(start.getDate() + daysUntilThursday)

  // 生成指定數量的週四
  const current = new Date(firstThursday)
  let generated = 0
  while (current <= end && generated < count) {
    thursdays.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 7)
    generated++
  }

  return thursdays
}

/**
 * 修復會議數據：確保所有20個會議都存在且狀態為'completed'
 */
export async function POST(request: Request) {
  try {
    const { data: body } = await request.json()
    const { startDate = '2025-07-18', endDate = '2026-01-14', expectedCount = 20 } = body || {}

    console.log('🔧 開始修復會議數據...', { startDate, endDate, expectedCount })

    // 獲取應該存在的20個會議日期
    const expectedMeetingDates = getThursdaysInRange(startDate, endDate, expectedCount)
    
    console.log(`📅 預期會議日期（${expectedMeetingDates.length}個）：`, expectedMeetingDates)

    // 查詢現有會議
    const { data: existingMeetings, error: fetchError } = await supabase
      .from(TABLES.MEETINGS)
      .select('*')
      .in('date', expectedMeetingDates)

    if (fetchError) {
      console.error('查詢現有會議失敗:', fetchError)
      return apiError(`查詢會議失敗：${fetchError.message}`, 500)
    }

    console.log(`📊 現有會議數量：${existingMeetings?.length || 0}`)

    // 找出缺失的會議和狀態不正確的會議
    const existingDates = new Set((existingMeetings || []).map((m: any) => m.date))
    const missingDates: string[] = []
    const wrongStatusDates: string[] = []

    for (const date of expectedMeetingDates) {
      if (!existingDates.has(date)) {
        missingDates.push(date)
      } else {
        const meeting = existingMeetings?.find((m: any) => m.date === date)
        if (meeting && meeting.status !== 'completed') {
          wrongStatusDates.push(date)
        }
      }
    }

    console.log(`❌ 缺失的會議：${missingDates.length}個`, missingDates)
    console.log(`⚠️ 狀態不正確的會議：${wrongStatusDates.length}個`, wrongStatusDates)

    // 創建缺失的會議
    if (missingDates.length > 0) {
      const inserts = missingDates.map(date => ({
        date,
        status: 'completed' as const,
      }))

      const { error: insertError } = await supabase
        .from(TABLES.MEETINGS)
        .insert(inserts)

      if (insertError) {
        console.error('創建缺失會議失敗:', insertError)
        return apiError(`創建缺失會議失敗：${insertError.message}`, 500)
      }

      console.log(`✅ 已創建 ${missingDates.length} 個缺失的會議`)
    }

    // 修復狀態不正確的會議
    if (wrongStatusDates.length > 0) {
      const { error: updateError } = await supabase
        .from(TABLES.MEETINGS)
        .update({ status: 'completed' })
        .in('date', wrongStatusDates)

      if (updateError) {
        console.error('更新會議狀態失敗:', updateError)
        return apiError(`更新會議狀態失敗：${updateError.message}`, 500)
      }

      console.log(`✅ 已修復 ${wrongStatusDates.length} 個會議的狀態`)
    }

    // 清除快取
    cache.delete(CACHE_KEYS.MEETINGS)
    console.log('🗑️ 已清除會議快取')

    // 驗證修復結果
    const { data: finalMeetings, error: verifyError } = await supabase
      .from(TABLES.MEETINGS)
      .select('*')
      .in('date', expectedMeetingDates)
      .eq('status', 'completed')

    if (verifyError) {
      console.error('驗證失敗:', verifyError)
    } else {
      console.log(`✅ 修復完成！現在有 ${finalMeetings?.length || 0} 個已完成的會議`)
    }

    return apiSuccess({
      message: '會議數據修復完成',
      created: missingDates.length,
      fixed: wrongStatusDates.length,
      total: finalMeetings?.length || 0,
      expected: expectedCount,
      details: {
        missingDates,
        wrongStatusDates,
        finalCount: finalMeetings?.length || 0
      }
    })
  } catch (error) {
    console.error('修復會議數據失敗:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`修復會議數據失敗：${errorMessage}`, 500)
  }
}
