import { NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { apiError, apiSuccess, safeJsonParse } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

/**
 * 清除所有簽到記錄
 * POST /api/checkins/clear-all
 */
export async function POST(request: Request) {
  try {
    // 解析請求體（可能包含確認信息）
    const { data: body } = await safeJsonParse<{ confirm?: boolean }>(request)
    
    // 先獲取記錄數量
    const { count: beforeCount } = await supabase
      .from(TABLES.CHECKINS)
      .select('*', { count: 'exact', head: true })

    // 刪除所有簽到記錄（使用永遠為真的條件）
    const { error: deleteError } = await supabase
      .from(TABLES.CHECKINS)
      .delete()
      .gte('id', 0) // 刪除所有記錄（id >= 0 永遠為真）

    if (deleteError) {
      console.error('Error clearing checkins:', deleteError)
      return apiError(`清除簽到記錄失敗：${deleteError.message}`, 500)
    }

    return apiSuccess(
      { deletedCount: beforeCount || 0 },
      `已成功清除所有簽到記錄（共 ${beforeCount || 0} 筆）`
    )
  } catch (error) {
    console.error('Error in clear-all checkins:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`清除簽到記錄失敗：${errorMessage}`, 500)
  }
}
