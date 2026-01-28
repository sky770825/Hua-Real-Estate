import { NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { apiError, apiSuccess, safeJsonParse, handleDatabaseError } from '@/lib/api-utils'
import { validateCheckin } from '@/lib/validation'
import { cache, CACHE_KEYS } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { data: body, error: parseError } = await safeJsonParse<{ memberId?: any; date?: string }>(request)
    
    if (parseError || !body) {
      return apiError('請求格式錯誤：無法解析 JSON', 400)
    }

    const { memberId, date } = body

    if (!memberId || !date) {
      return apiError('會員編號和日期為必填欄位', 400)
    }

    // 驗證輸入
    const validation = validateCheckin({ memberId, date })
    if (!validation.valid) {
      return apiError(validation.error || '輸入驗證失敗', 400)
    }

    console.log('刪除簽到記錄:', { memberId, date })
    
    // 刪除簽到記錄
    const { data, error, count } = await supabase
      .from(TABLES.CHECKINS)
      .delete({ count: 'exact' })
      .eq('member_id', memberId)
      .eq('meeting_date', date)
      .select()

    if (error) {
      console.error('Error deleting checkin:', {
        error,
        message: error.message,
        code: (error as any).code,
        memberId,
        date,
      })
      
      return apiError(`刪除簽到記錄失敗：${handleDatabaseError(error)}`, 500)
    }

    const deletedCount = data?.length || 0
    console.log('簽到記錄刪除結果:', { deletedCount, memberId, date, data })
    
    // 如果沒有刪除任何記錄，可能是記錄不存在
    if (deletedCount === 0) {
      // 檢查記錄是否存在
      const { data: existingCheckin } = await supabase
        .from(TABLES.CHECKINS)
        .select('id')
        .eq('member_id', memberId)
        .eq('meeting_date', date)
        .maybeSingle()
      
      if (!existingCheckin) {
        console.warn('簽到記錄不存在:', { memberId, date })
        return NextResponse.json({
          success: true,
          deleted: false,
          count: 0,
          message: '簽到記錄不存在或已被刪除'
        })
      }
    }
    
    // 清除該日期的簽到快取
    cache.delete(CACHE_KEYS.CHECKINS(date))
    console.log(`🗑️ 已清除快取：簽到記錄 (${date})`)
    
    return NextResponse.json({ 
      success: true, 
      deleted: deletedCount > 0,
      count: deletedCount,
      ...(deletedCount === 0 && { message: '簽到記錄不存在或已被刪除' })
    })
  } catch (error) {
    console.error('Error deleting checkin:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`刪除簽到記錄失敗：${errorMessage}`, 500)
  }
}

