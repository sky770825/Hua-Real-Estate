import { NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { apiError, apiSuccess, safeJsonParse, handleDatabaseError } from '@/lib/api-utils'
import { validateMember } from '@/lib/validation'
import { cache, CACHE_KEYS } from '@/lib/cache'

// 標記為動態路由
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// 背景同步到 Google Sheets 的輔助函數
async function syncToGoogleSheets() {
  try {
    // 只在環境變數設置時才同步
    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      return
    }
    
    const { data: members } = await supabase
      .from(TABLES.MEMBERS)
      .select('id, name, profession')
      .order('id', { ascending: true })
    
    if (members && members.length > 0) {
      const { syncMembersToSheets } = await import('@/lib/google-sheets')
      await syncMembersToSheets(members)
    }
  } catch (error) {
    // 靜默失敗，不影響主要操作
    console.warn('背景同步到 Google Sheets 失敗:', error)
  }
}

export async function POST(request: Request) {
  try {
    const { data: body, error: parseError } = await safeJsonParse<{
      id?: any
      name?: string
      profession?: string
    }>(request)
    
    if (parseError || !body) {
      return apiError('請求格式錯誤：無法解析 JSON', 400)
    }

    const { id, name, profession } = body

    // 輸入驗證
    if (!id || !name) {
      return apiError('會員編號和姓名為必填欄位', 400)
    }

    // 使用統一的驗證函數
    const validation = validateMember({ id, name, profession })
    if (!validation.valid) {
      return apiError(validation.error || '輸入驗證失敗', 400)
    }

    // 檢查ID是否已存在（不使用 maybeSingle，直接檢查結果陣列）
    const { data: existingMembers } = await supabase
      .from(TABLES.MEMBERS)
      .select('id')
      .eq('id', id)
      .limit(1)

    if (existingMembers && existingMembers.length > 0) {
      return apiError('會員編號已存在，請使用其他編號', 400)
    }

    console.log('創建會員:', { id, name, profession })
    
    const { data: insertedData, error } = await supabase
      .from(TABLES.MEMBERS)
      .insert([{
        id,
        name: name.trim(),
        profession: (profession || '').trim() || null,
      }])
      .select()

    // 從插入結果中獲取第一個（應該只有一個）
    const data = insertedData && insertedData.length > 0 ? insertedData[0] : null

    if (error) {
      console.error('Database error creating member:', {
        error,
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        id,
        name,
      })
      
      // 檢查是否為重複 ID 錯誤
      const errorMessage = String(error.message || '')
      const errorCode = String((error as any).code || '')
      
      return apiError(`新增會員失敗：${handleDatabaseError(error)}`, 500)
    }

    if (!data) {
      console.error('會員創建失敗：沒有返回數據')
      return apiError('新增會員失敗：資料庫未返回數據', 500)
    }

    console.log('會員創建成功:', data)
    
    // 驗證返回的數據是否完整
    if (!data || !data.id || !data.name) {
      console.error('會員創建成功但返回數據不完整:', data)
      return apiError('新增會員失敗：資料庫返回數據不完整', 500)
    }
    
    // 清除會員快取
    cache.delete(CACHE_KEYS.MEMBERS)
    console.log('🗑️ 已清除快取：會員列表')
    
    // 背景同步到 Google Sheets（不阻塞響應）
    syncToGoogleSheets().catch(err => {
      console.error('背景同步到 Google Sheets 失敗:', err)
      // 不影響主要操作，只記錄錯誤
    })
    
    return apiSuccess({
      ...data,
      member: data, // 同時返回 member 字段以確保兼容性
      id: data.id, // 明確返回 ID 以便前端驗證
    })
  } catch (error) {
    console.error('Error creating member:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    // 如果是已知錯誤，返回詳細訊息
    if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
      return apiError('會員編號已存在，請使用其他編號', 400)
    }
    return apiError('新增會員失敗，請稍後再試', 500)
  }
}

