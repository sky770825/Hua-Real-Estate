import { NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { apiError, apiSuccess, safeJsonParse, handleDatabaseError } from '@/lib/api-utils'
import { validateMeeting } from '@/lib/validation'
import { cache, CACHE_KEYS } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: body, error: parseError } = await safeJsonParse<{ date?: string; status?: string }>(request)
    
    if (parseError || !body) {
      return apiError('請求格式錯誤：無法解析 JSON', 400)
    }

    const { date, status } = body
    const id = parseInt(params.id)

    if (isNaN(id) || id <= 0) {
      return apiError('會議 ID 無效', 400)
    }

    if (!date) {
      return apiError('日期為必填欄位', 400)
    }

    // 驗證輸入
    const validation = validateMeeting({ date, status })
    if (!validation.valid) {
      return apiError(validation.error || '輸入驗證失敗', 400)
    }

    console.log('更新會議:', { id, date, status })
    
    const { data, error } = await supabase
      .from(TABLES.MEETINGS)
      .update({
        date,
        status: status || 'scheduled',
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating meeting:', {
        error,
        message: error.message,
        code: (error as any).code,
        id,
      })
      
      return apiError(`更新會議失敗：${handleDatabaseError(error)}`, 500)
    }

    console.log('會議更新成功:', data)
    
    // 清除會議快取
    cache.delete(CACHE_KEYS.MEETINGS)
    console.log('🗑️ 已清除快取：會議列表')
    
    return apiSuccess(data)
  } catch (error) {
    console.error('Error updating meeting:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`更新會議失敗：${errorMessage}`, 500)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id) || id <= 0) {
      return apiError('會議 ID 無效', 400)
    }

    // 獲取會議信息（不使用 single/maybeSingle，直接檢查結果陣列）
    const { data: meetings } = await supabase
      .from(TABLES.MEETINGS)
      .select('date')
      .eq('id', id)
      .limit(1)
    
    const meeting = meetings && meetings.length > 0 ? meetings[0] : null

    console.log('刪除會議:', { id })
    
    // 如果會議不存在，直接返回錯誤
    if (!meeting) {
      return apiError(`會議不存在（編號：${id}）`, 404)
    }

    // 刪除會議相關的簽到記錄
    const { error: deleteCheckinsError } = await supabase
      .from(TABLES.CHECKINS)
      .delete()
      .eq('meeting_date', meeting.date)
    
    if (deleteCheckinsError) {
      console.warn('Failed to delete checkins:', deleteCheckinsError)
      // 繼續刪除會議，即使簽到記錄刪除失敗
    } else {
      console.log('相關簽到記錄已刪除')
      // 清除該日期的簽到記錄快取
      cache.delete(CACHE_KEYS.CHECKINS(meeting.date))
      console.log(`🗑️ 已清除快取：簽到記錄 (${meeting.date})`)
    }

    // 刪除會議
    const { data, error } = await supabase
      .from(TABLES.MEETINGS)
      .delete()
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error deleting meeting:', {
        error,
        message: error.message,
        code: (error as any).code,
        id,
      })
      
      return apiError(`刪除會議失敗：${handleDatabaseError(error)}`, 500)
    }

    // 檢查是否真的刪除了記錄
    if (!data || data.length === 0) {
      console.warn('會議不存在或已被刪除:', { id })
      return apiError(`會議不存在（編號：${id}），可能已被刪除`, 404)
    }

    console.log('會議刪除成功:', data)
    
    // 清除會議快取
    cache.delete(CACHE_KEYS.MEETINGS)
    console.log('🗑️ 已清除快取：會議列表')
    
    return apiSuccess(data)
  } catch (error) {
    console.error('Error deleting meeting:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`刪除會議失敗：${errorMessage}`, 500)
  }
}

