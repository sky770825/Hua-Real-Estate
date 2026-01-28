import { NextResponse } from 'next/server'
import { supabase, supabaseService, TABLES, BUCKETS, STORAGE_PATHS, generateStoragePath } from '@/lib/supabase'
import { apiError, apiSuccess, handleDatabaseError } from '@/lib/api-utils'
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    // 嘗試從快取獲取
    const cachedData = cache.get<{ prizes: any[] }>(CACHE_KEYS.PRIZES)
    if (cachedData) {
      console.log('✅ 使用快取：獎品列表')
      return NextResponse.json(cachedData)
    }

    // 從資料庫獲取
    const { data: prizes, error } = await supabase
      .from(TABLES.PRIZES)
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.error('Error fetching prizes:', error)
      return apiError(`查詢獎品失敗：${handleDatabaseError(error)}`, 500)
    }

    const result = { prizes: prizes || [] }
    
    // 存入快取
    cache.set(CACHE_KEYS.PRIZES, result, CACHE_TTL.PRIZES)
    console.log('💾 已快取：獎品列表')

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching prizes:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`查詢獎品失敗：${errorMessage}`, 500)
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const totalQuantity = parseInt(formData.get('totalQuantity') as string) || 0
    const probability = parseFloat(formData.get('probability') as string) || 0.0
    const imageFile = formData.get('image') as File | null

    if (!name) {
      return NextResponse.json(
        { error: 'Prize name is required' },
        { status: 400 }
      )
    }

    let imageUrl = ''
    let imageKey = ''

        // 處理圖片上傳到 Supabase Storage
        if (imageFile && imageFile.size > 0) {
      try {
        // 檢查檔案大小（限制為 50MB，因為前端會自動壓縮）
        const maxSize = 50 * 1024 * 1024 // 50MB（Supabase 免費方案限制）
        if (imageFile.size > maxSize) {
          return NextResponse.json(
            { error: '圖片檔案過大，請選擇小於 50MB 的圖片（系統會自動壓縮）' },
            { status: 400 }
          )
        }

        // 檢查檔案類型
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(imageFile.type)) {
          return NextResponse.json(
            { error: '不支援的圖片格式，請使用 JPG、PNG、GIF 或 WebP' },
            { status: 400 }
          )
        }

        // 使用統一的文件路徑生成函數（遵循資料夾結構規範）
        const fileName = generateStoragePath(STORAGE_PATHS.PRIZES, imageFile.name)
        
        // 將 File 轉換為 ArrayBuffer（Supabase Storage 需要）
        const arrayBuffer = await imageFile.arrayBuffer()
        
        console.log('開始上傳圖片到 Supabase Storage:', {
          fileName,
          fileSize: imageFile.size,
          fileType: imageFile.type,
          bucket: BUCKETS.PRIZES,
          serviceKeySet: !!process.env.SUPABASE_SERVICE_KEY,
        })
        
        try {
          // 使用服務端客戶端上傳到 Supabase Storage
          const uploadResult = await supabaseService.storage
            .from(BUCKETS.PRIZES)
            .upload(fileName, arrayBuffer, {
              contentType: imageFile.type,
              upsert: false
            })
          
          console.log('上傳結果:', {
            hasData: !!uploadResult.data,
            hasError: !!uploadResult.error,
            data: uploadResult.data,
            error: uploadResult.error,
            bucket: BUCKETS.PRIZES,
          })

          const { data: uploadData, error: uploadError } = uploadResult

          if (uploadError) {
            // 詳細記錄錯誤信息
            const errorDetails = {
              error: uploadError,
              message: uploadError.message || '未知錯誤',
              code: (uploadError as any).code || '',
              status: (uploadError as any).status || '',
              details: (uploadError as any).details || '',
              fileName,
              bucket: BUCKETS.PRIZES,
              serviceKeySet: !!process.env.SUPABASE_SERVICE_KEY,
              fileSize: imageFile.size,
              fileType: imageFile.type,
            }
            
            console.error('圖片上傳錯誤詳情:', JSON.stringify(errorDetails, null, 2))
            
            // 檢查是否為速率限制錯誤
            const errorMessage = String(uploadError.message || uploadError || '未知錯誤')
            const errorCode = String((uploadError as any).code || '')
            const errorStatus = String((uploadError as any).status || '')
            
            if (errorMessage.includes('Too many requests') || 
                errorMessage.includes('rate limit') ||
                errorMessage.includes('429') ||
                errorCode === '429' ||
                errorStatus === '429') {
              return NextResponse.json(
                { error: '請求過於頻繁，請稍候 1-2 分鐘後再試' },
                { status: 429 }
              )
            }
            
            // 檢查是否為儲存桶不存在或權限問題
            if (errorMessage.includes('bucket') || 
                errorMessage.includes('not found') ||
                errorMessage.includes('does not exist') ||
                errorMessage.includes('permission') ||
                errorMessage.includes('access denied') ||
                errorMessage.includes('forbidden') ||
                errorMessage.includes('foreign key') ||
                errorCode === '404' ||
                errorCode === '403' ||
                errorStatus === '404' ||
                errorStatus === '403') {
              return NextResponse.json(
                { 
                  error: `儲存桶問題：${errorMessage}。請確認：1) 儲存桶名稱 "${BUCKETS.PRIZES}" 是否正確 2) 儲存桶是否存在 3) 儲存桶權限是否正確 4) SUPABASE_SERVICE_KEY 是否已設置`,
                  details: errorDetails
                },
                { status: 500 }
              )
            }
            
            return NextResponse.json(
              { 
                error: `上傳失敗：${errorMessage}${errorCode ? ` (錯誤碼: ${errorCode})` : ''}${errorStatus ? ` (狀態碼: ${errorStatus})` : ''}`,
                details: errorDetails
              },
              { status: 500 }
            )
          }
          
          // 處理成功的情況
          if (uploadData) {
            // Supabase Storage 返回 path，需要構建公開 URL
            imageKey = uploadData.path || fileName
            
            // 構建 Supabase Storage 公開 URL
            const { data: publicUrlData } = supabaseService.storage
              .from(BUCKETS.PRIZES)
              .getPublicUrl(imageKey)
            
            imageUrl = publicUrlData.publicUrl || ''
            
            // 如果無法獲取公開 URL，手動構建
            if (!imageUrl) {
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sqgrnowrcvspxhuudrqc.supabase.co'
              imageUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKETS.PRIZES}/${imageKey}`
            }
            
            console.log('上傳成功:', {
              imageUrl,
              imageKey,
              uploadData,
            })
            
            if (!imageUrl) {
              return NextResponse.json(
                { error: '上傳成功但無法獲取圖片 URL，請檢查 Supabase Storage 設置' },
                { status: 500 }
              )
            }
          } else {
            console.error('Upload succeeded but no data returned')
            return NextResponse.json(
              { error: '上傳成功但無法獲取圖片 URL' },
              { status: 500 }
            )
          }
        } catch (uploadException) {
          // 捕獲上傳過程中的異常
          console.error('上傳過程發生異常:', {
            exception: uploadException,
            message: uploadException instanceof Error ? uploadException.message : String(uploadException),
            stack: uploadException instanceof Error ? uploadException.stack : undefined,
            fileName,
            bucket: BUCKETS.PRIZES,
            serviceKeySet: !!process.env.SUPABASE_SERVICE_KEY,
          })
          
          return NextResponse.json(
            { 
              error: `上傳過程發生異常：${uploadException instanceof Error ? uploadException.message : String(uploadException)}`,
              type: 'upload_exception'
            },
            { status: 500 }
          )
        }
      } catch (error) {
        console.error('Error processing image upload:', error)
        return NextResponse.json(
          { error: `處理圖片時發生錯誤：${error instanceof Error ? error.message : '未知錯誤'}` },
          { status: 500 }
        )
      }
    }

    // 插入獎品資料
    console.log('創建獎品:', { name, totalQuantity, probability, imageUrl: !!imageUrl })
    
    const { data: insertedPrizes, error: insertError } = await supabase
      .from(TABLES.PRIZES)
      .insert([{
        name,
        image_url: imageUrl || null,
        image_key: imageKey || null,
        total_quantity: totalQuantity,
        remaining_quantity: totalQuantity,
        probability,
      }])
      .select()
    
    if (insertError) {
      console.error('Error creating prize:', {
        error: insertError,
        message: insertError.message,
        code: (insertError as any).code,
        details: (insertError as any).details,
        name,
      })
      
      return apiError(`新增獎品失敗：${handleDatabaseError(insertError)}`, 500)
    }

    // 從插入結果中獲取第一個（應該只有一個）
    const prize = insertedPrizes && insertedPrizes.length > 0 ? insertedPrizes[0] : null

    if (!prize) {
      console.error('獎品創建失敗：沒有返回數據')
      return apiError('新增獎品失敗：資料庫未返回數據', 500)
    }

    console.log('獎品創建成功:', prize)
    
    // 清除獎品快取
    cache.delete(CACHE_KEYS.PRIZES)
    console.log('🗑️ 已清除快取：獎品列表')
    
    return apiSuccess({
      id: prize.id,
      data: prize
    })
  } catch (error) {
    console.error('Error creating prize:', error)
    return NextResponse.json(
      { error: 'Failed to create prize' },
      { status: 500 }
    )
  }
}

