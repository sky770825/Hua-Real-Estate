import { NextResponse } from 'next/server'
import { supabase, supabaseService, BUCKETS, STORAGE_PATHS, generateStoragePath } from '@/lib/supabase'
import { apiError, apiSuccess, handleDatabaseError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// 獲取所有邀請頁圖片記錄
export async function GET() {
  try {
    const { data: images, error } = await supabase
      .from('invite_event_images')
      .select('*')
      .order('event_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invite images:', error)
      const errorMessage = handleDatabaseError(error)
      console.error('Database error details:', {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
      })
      return apiError(`查詢邀請頁圖片失敗：${errorMessage}`, 500)
    }

    console.log(`成功查詢到 ${images?.length || 0} 筆圖片記錄`)
    return NextResponse.json({ 
      success: true,
      images: images || [] 
    })
  } catch (error) {
    console.error('Error fetching invite images:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`查詢邀請頁圖片失敗：${errorMessage}`, 500)
  }
}

// 上傳邀請頁圖片
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const eventDate = formData.get('eventDate') as string
    const eventTitle = formData.get('eventTitle') as string
    const image1File = formData.get('image1') as File | null
    const image2File = formData.get('image2') as File | null

    if (!eventDate) {
      return NextResponse.json(
        { error: '活動日期是必填項' },
        { status: 400 }
      )
    }

    if (!image1File || !image2File) {
      return NextResponse.json(
        { error: '請上傳兩張圖片' },
        { status: 400 }
      )
    }

    // 檢查檔案大小和類型
    const maxSize = 50 * 1024 * 1024 // 50MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

    const files = [image1File, image2File]
    for (let index = 0; index < files.length; index++) {
      const file = files[index]
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `圖片 ${index + 1} 檔案過大，請選擇小於 50MB 的圖片` },
          { status: 400 }
        )
      }

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `圖片 ${index + 1} 格式不支援，請使用 JPG、PNG、GIF 或 WebP` },
          { status: 400 }
        )
      }
    }

    // 上傳圖片到 Supabase Storage
    const uploadResults = await Promise.all([
      uploadImageToStorage(image1File, 1),
      uploadImageToStorage(image2File, 2)
    ])

    if (!uploadResults[0].success || !uploadResults[1].success) {
      return NextResponse.json(
        { error: '圖片上傳失敗，請重試' },
        { status: 500 }
      )
    }

    const image1Url = uploadResults[0].url
    const image2Url = uploadResults[1].url

    // 刪除同一天的舊記錄
    const { error: deleteError } = await supabase
      .from('invite_event_images')
      .delete()
      .eq('event_date', eventDate)

    if (deleteError) {
      console.warn('刪除舊記錄時發生錯誤（可能沒有舊記錄）:', deleteError)
    }

    // 保存到數據庫
    const { data, error } = await supabase
      .from('invite_event_images')
      .insert([
        {
          event_date: eventDate,
          event_title: eventTitle || `${eventDate}華地產早會雙專講同台`,
          image1_url: image1Url,
          image2_url: image2Url
        }
      ])
      .select()

    if (error) {
      console.error('Error saving invite images:', error)
      return apiError(`保存邀請頁圖片失敗：${handleDatabaseError(error)}`, 500)
    }

    return NextResponse.json({
      success: true,
      message: '圖片上傳成功',
      data: data[0]
    })
  } catch (error) {
    console.error('Error uploading invite images:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`上傳邀請頁圖片失敗：${errorMessage}`, 500)
  }
}

// 上傳單張圖片到 Storage
async function uploadImageToStorage(file: File, index: number) {
  try {
    // 生成文件名（與 invite.html 保持一致的路徑格式）
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const sanitizedExtension = fileExtension.replace(/[^a-z0-9]/g, '')
    const fileName = `image${index}_${timestamp}.${sanitizedExtension}`
    
    // 使用與 invite.html 相同的路徑格式
    const filePath = `hua-real-estate/invite-photo/${fileName}`
    
    // 將 File 轉換為 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    
    console.log('開始上傳邀請頁圖片到 Supabase Storage:', {
      fileName: filePath,
      fileSize: file.size,
      fileType: file.type,
      bucket: BUCKETS.INVITE,
    })
    
    // 使用服務端客戶端上傳
    const { data: uploadData, error: uploadError } = await supabaseService.storage
      .from(BUCKETS.INVITE)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('圖片上傳錯誤:', uploadError)
      return { success: false, error: uploadError.message }
    }

    // 獲取公開 URL
    const { data: urlData } = supabaseService.storage
      .from(BUCKETS.INVITE)
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    console.log('圖片上傳成功:', { path: filePath, url: publicUrl })

    return { success: true, url: publicUrl, path: filePath }
  } catch (error) {
    console.error('上傳圖片時發生錯誤:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '未知錯誤' 
    }
  }
}
