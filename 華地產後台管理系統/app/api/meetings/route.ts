import { NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { apiError, apiSuccess, safeJsonParse, handleDatabaseError } from '@/lib/api-utils'
import { validateMeeting } from '@/lib/validation'
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(request: Request) {
  try {
    const { data: body, error: parseError } = await safeJsonParse<{ date?: string; status?: string }>(request)
    
    if (parseError || !body) {
      return apiError('請求格式錯誤：無法解析 JSON', 400)
    }

    const { date, status } = body

    if (!date) {
      return apiError('日期為必填欄位', 400)
    }

    // 驗證輸入
    const validation = validateMeeting({ date, status })
    if (!validation.valid) {
      return apiError(validation.error || '輸入驗證失敗', 400)
    }

    // 檢查是否已存在（不使用 maybeSingle，直接檢查結果陣列）
    const { data: existingMeetings } = await supabase
      .from(TABLES.MEETINGS)
      .select('*')
      .eq('date', date)
      .limit(1)
    
    const existing = existingMeetings && existingMeetings.length > 0 ? existingMeetings[0] : null

    console.log('創建/更新會議:', { date, status })
    
    if (existing) {
      // 更新
      const { data, error } = await supabase
        .from(TABLES.MEETINGS)
        .update({ status: status || 'scheduled' })
        .eq('date', date)
        .select()

      if (error) {
        console.error('Error updating meeting:', error)
        return apiError(`更新會議失敗：${handleDatabaseError(error)}`, 500)
      }
      
      console.log('會議已更新:', data)
    } else {
      // 創建
      const { data, error } = await supabase
        .from(TABLES.MEETINGS)
        .insert([{ date, status: status || 'scheduled' }])
        .select()

      if (error) {
        console.error('Error creating meeting:', error)
        return apiError(`創建會議失敗：${handleDatabaseError(error)}`, 500)
      }
      
      console.log('會議已創建:', data)
    }

    // 清除會議快取
    cache.delete(CACHE_KEYS.MEETINGS)
    console.log('🗑️ 已清除快取：會議列表')

    return apiSuccess()
  } catch (error) {
    console.error('Error creating/updating meeting:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`創建/更新會議失敗：${errorMessage}`, 500)
  }
}

export async function GET() {
  try {
    // 嘗試從快取獲取
    const cachedData = cache.get<{ meetings: any[] }>(CACHE_KEYS.MEETINGS)
    if (cachedData) {
      console.log('✅ 使用快取：會議列表')
      return NextResponse.json(cachedData)
    }

    // 從資料庫獲取
    const { data: meetings, error } = await supabase
      .from(TABLES.MEETINGS)
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching meetings:', error)
      return apiError(`查詢會議失敗：${handleDatabaseError(error)}`, 500)
    }

    const result = { meetings: meetings || [] }
    
    // 存入快取
    cache.set(CACHE_KEYS.MEETINGS, result, CACHE_TTL.MEETINGS)
    console.log('💾 已快取：會議列表')

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching meetings:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`查詢會議失敗：${errorMessage}`, 500)
  }
}

