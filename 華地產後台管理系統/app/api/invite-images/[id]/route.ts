import { NextResponse } from 'next/server'
import { supabase, supabaseService, BUCKETS } from '@/lib/supabase'
import { apiError, handleDatabaseError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// 刪除邀請頁圖片記錄
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '無效的 ID' },
        { status: 400 }
      )
    }

    // 先獲取記錄以獲取圖片 URL（使用服務端客戶端，避免 RLS 限制）
    const { data: record, error: fetchError } = await supabaseService
      .from('invite_event_images')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('查詢記錄錯誤:', fetchError)
      // 即使查詢失敗，也嘗試刪除（可能是 RLS 限制查詢但允許刪除）
      console.log('查詢失敗，但繼續嘗試刪除操作，ID:', id)
    }

    if (!record) {
      console.warn('未找到記錄，但繼續嘗試刪除，ID:', id)
      // 不返回錯誤，繼續嘗試刪除
    } else {
      console.log('找到要刪除的記錄:', record.id)
      
      // 刪除 Storage 中的圖片文件
      if (record.image1_url) {
        try {
          const path1 = extractFilePathFromUrl(record.image1_url)
          if (path1) {
            console.log('刪除圖片1，路徑:', path1)
            const { error: storageError1 } = await supabaseService.storage
              .from(BUCKETS.INVITE)
              .remove([path1])
            if (storageError1) {
              console.warn('刪除圖片1失敗:', storageError1)
            } else {
              console.log('成功刪除圖片1')
            }
          }
        } catch (error) {
          console.warn('刪除圖片1異常:', error)
        }
      }

      if (record.image2_url) {
        try {
          const path2 = extractFilePathFromUrl(record.image2_url)
          if (path2) {
            console.log('刪除圖片2，路徑:', path2)
            const { error: storageError2 } = await supabaseService.storage
              .from(BUCKETS.INVITE)
              .remove([path2])
            if (storageError2) {
              console.warn('刪除圖片2失敗:', storageError2)
            } else {
              console.log('成功刪除圖片2')
            }
          }
        } catch (error) {
          console.warn('刪除圖片2異常:', error)
        }
      }
    }

    // 刪除數據庫記錄（使用服務端客戶端，避免 RLS 限制）
    console.log('開始刪除數據庫記錄，ID:', id)
    const { data: deleteData, error: deleteError } = await supabaseService
      .from('invite_event_images')
      .delete()
      .eq('id', id)
      .select()

    console.log('刪除操作結果:', { 
      hasData: !!deleteData, 
      dataLength: deleteData?.length || 0,
      hasError: !!deleteError,
      error: deleteError 
    })

    if (deleteError) {
      console.error('刪除數據庫記錄錯誤:', deleteError)
      const errorMsg = handleDatabaseError(deleteError)
      
      // 檢查是否是權限問題
      if (errorMsg.includes('policy') || errorMsg.includes('策略') || errorMsg.includes('permission') || errorMsg.includes('權限')) {
        return NextResponse.json({
          success: false,
          error: '刪除失敗：缺少 DELETE 策略。請點擊「設置刪除權限」按鈕或手動執行 SQL。',
          requiresSetup: true,
          sql: `CREATE POLICY IF NOT EXISTS "Allow public delete from invite_event_images"
ON invite_event_images
FOR DELETE
TO public
USING (true);`
        }, { status: 403 })
      }
      
      return apiError(`刪除邀請頁圖片失敗：${errorMsg}`, 500)
    }

    // 檢查是否真的刪除了
    if (!deleteData || deleteData.length === 0) {
      console.warn('刪除操作未影響任何記錄，ID:', id)
      
      // 再次查詢確認記錄是否真的存在
      const { data: checkData } = await supabaseService
        .from('invite_event_images')
        .select('id')
        .eq('id', id)
        .single()
      
      if (checkData) {
        // 記錄存在但無法刪除，可能是權限問題
        return NextResponse.json({
          success: false,
          error: '刪除失敗：記錄存在但無法刪除，可能是權限問題。請檢查 DELETE 策略是否已添加。',
          requiresSetup: true,
          sql: `CREATE POLICY IF NOT EXISTS "Allow public delete from invite_event_images"
ON invite_event_images
FOR DELETE
TO public
USING (true);`
        }, { status: 403 })
      }
      
      // 記錄真的不存在
      return NextResponse.json({
        success: true,
        message: '記錄不存在或已被刪除',
        deleted: false
      })
    }

    console.log('✅ 成功刪除記錄，ID:', id, '刪除的記錄:', deleteData)

    return NextResponse.json({
      success: true,
      message: '刪除成功',
      deleted: deleteData
    })
  } catch (error) {
    console.error('Error deleting invite image:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`刪除邀請頁圖片失敗：${errorMessage}`, 500)
  }
}

// 從 URL 中提取文件路徑
function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const bucketIndex = pathParts.indexOf('public')
    
    if (bucketIndex !== -1 && pathParts.length > bucketIndex + 2) {
      // 跳過 'storage', 'v1', 'object', 'public', bucket名稱，獲取實際文件路徑
      return pathParts.slice(bucketIndex + 2).join('/')
    }
    
    // 如果格式不同，嘗試從路徑中提取
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/)
    if (pathMatch) {
      return pathMatch[1]
    }
    
    return null
  } catch (error) {
    console.warn('解析 URL 失敗:', error)
    return null
  }
}
