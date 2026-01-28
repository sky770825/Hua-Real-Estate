import { NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { apiError, apiSuccess, safeJsonParse, handleDatabaseError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// 更新中獎記錄（標記領取狀態）
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: body, error: parseError } = await safeJsonParse<{
      claimed?: boolean
    }>(request)
    
    if (parseError || !body) {
      return apiError('請求格式錯誤：無法解析 JSON', 400)
    }

    const { claimed } = body
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return apiError('無效的記錄 ID', 400)
    }

    if (typeof claimed !== 'boolean') {
      return apiError('claimed 必須是布林值', 400)
    }

    // 更新記錄
    const updateData: { claimed: boolean; claimed_at?: string | null } = {
      claimed,
    }

    // 如果標記為已領取，記錄領取時間；如果標記為未領取，清除領取時間
    if (claimed) {
      updateData.claimed_at = new Date().toISOString()
    } else {
      updateData.claimed_at = null
    }

    const { error: updateError } = await supabase
      .from(TABLES.LOTTERY_WINNERS)
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating winner record:', updateError)
      return apiError(`更新記錄失敗：${handleDatabaseError(updateError)}`, 500)
    }

    return apiSuccess({ message: claimed ? '已標記為已領取' : '已標記為未領取' })
  } catch (error) {
    console.error('Error updating winner record:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`更新記錄失敗：${errorMessage}`, 500)
  }
}

// 刪除中獎記錄
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return apiError('無效的記錄 ID', 400)
    }

    // 先查詢記錄是否存在
    const { data: existingRecord, error: fetchError } = await supabase
      .from(TABLES.LOTTERY_WINNERS)
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching winner record:', fetchError)
      return apiError(`查詢記錄失敗：${handleDatabaseError(fetchError)}`, 500)
    }

    if (!existingRecord) {
      return apiError('記錄不存在', 404)
    }

    // 刪除記錄
    const { error: deleteError } = await supabase
      .from(TABLES.LOTTERY_WINNERS)
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting winner record:', deleteError)
      return apiError(`刪除記錄失敗：${handleDatabaseError(deleteError)}`, 500)
    }

    return apiSuccess({ message: '記錄已成功刪除' })
  } catch (error) {
    console.error('Error deleting winner record:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`刪除記錄失敗：${errorMessage}`, 500)
  }
}
