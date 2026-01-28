import { NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { apiError, apiSuccess, safeJsonParse } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

/**
 * 重置系統（清除所有數據）
 * POST /api/system/reset
 * Body: { confirm: boolean }
 */
export async function POST(request: Request) {
  try {
    const { data: body } = await safeJsonParse<{ confirm?: boolean }>(request)

    if (!body?.confirm) {
      return apiError('需要確認才能重置系統', 400)
    }

    const results = {
      checkins: { deleted: 0, error: null as string | null },
      winners: { deleted: 0, error: null as string | null },
      meetings: { deleted: 0, error: null as string | null },
      prizes: { deleted: 0, error: null as string | null },
      members: { deleted: 0, error: null as string | null },
    }

    // 按照外鍵依賴順序刪除（先刪除子表，再刪除父表）
    // 1. 刪除簽到記錄（依賴於 members 和 meetings）
    try {
      const { count: checkinsCount } = await supabase
        .from(TABLES.CHECKINS)
        .select('*', { count: 'exact', head: true })
      
      const { error: checkinsError } = await supabase
        .from(TABLES.CHECKINS)
        .delete()
        .neq('id', 0)

      if (checkinsError) {
        results.checkins.error = checkinsError.message
      } else {
        results.checkins.deleted = checkinsCount || 0
      }
    } catch (error) {
      results.checkins.error =
        error instanceof Error ? error.message : '未知錯誤'
    }

    // 2. 刪除中獎記錄（依賴於 members, prizes, meetings）
    try {
      const { count: winnersCount } = await supabase
        .from(TABLES.LOTTERY_WINNERS)
        .select('*', { count: 'exact', head: true })
      
      const { error: winnersError } = await supabase
        .from(TABLES.LOTTERY_WINNERS)
        .delete()
        .neq('id', 0)

      if (winnersError) {
        results.winners.error = winnersError.message
      } else {
        results.winners.deleted = winnersCount || 0
      }
    } catch (error) {
      results.winners.error =
        error instanceof Error ? error.message : '未知錯誤'
    }

    // 3. 刪除會議（依賴於無，但被 checkins 引用）
    try {
      const { count: meetingsCount } = await supabase
        .from(TABLES.MEETINGS)
        .select('*', { count: 'exact', head: true })
      
      const { error: meetingsError } = await supabase
        .from(TABLES.MEETINGS)
        .delete()
        .neq('id', 0)

      if (meetingsError) {
        results.meetings.error = meetingsError.message
      } else {
        results.meetings.deleted = meetingsCount || 0
      }
    } catch (error) {
      results.meetings.error =
        error instanceof Error ? error.message : '未知錯誤'
    }

    // 4. 刪除獎品（依賴於無，但被 winners 引用）
    try {
      const { count: prizesCount } = await supabase
        .from(TABLES.PRIZES)
        .select('*', { count: 'exact', head: true })
      
      const { error: prizesError } = await supabase
        .from(TABLES.PRIZES)
        .delete()
        .neq('id', 0)

      if (prizesError) {
        results.prizes.error = prizesError.message
      } else {
        results.prizes.deleted = prizesCount || 0
      }
    } catch (error) {
      results.prizes.error =
        error instanceof Error ? error.message : '未知錯誤'
    }

    // 5. 刪除會員（依賴於無，但被 checkins 和 winners 引用）
    try {
      const { count: membersCount } = await supabase
        .from(TABLES.MEMBERS)
        .select('*', { count: 'exact', head: true })
      
      const { error: membersError } = await supabase
        .from(TABLES.MEMBERS)
        .delete()
        .neq('id', 0)

      if (membersError) {
        results.members.error = membersError.message
      } else {
        results.members.deleted = membersCount || 0
      }
    } catch (error) {
      results.members.error =
        error instanceof Error ? error.message : '未知錯誤'
    }

    // 計算總計
    const totalDeleted =
      results.checkins.deleted +
      results.winners.deleted +
      results.meetings.deleted +
      results.prizes.deleted +
      results.members.deleted

    const hasErrors = Object.values(results).some((r) => r.error !== null)

    if (hasErrors) {
      return apiError('重置系統過程中發生部分錯誤', 500, results)
    }

    return apiSuccess(
      results,
      `系統重置成功！共刪除 ${totalDeleted} 筆記錄`
    )
  } catch (error) {
    console.error('Error resetting system:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`重置系統失敗：${errorMessage}`, 500)
  }
}
