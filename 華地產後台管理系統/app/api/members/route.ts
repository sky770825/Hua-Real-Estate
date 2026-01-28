import { NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { apiError, handleDatabaseError } from '@/lib/api-utils'
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    // 嘗試從快取獲取
    const cachedData = cache.get<{ members: any[] }>(CACHE_KEYS.MEMBERS)
    if (cachedData) {
      console.log('✅ 使用快取：會員列表')
      return NextResponse.json(cachedData)
    }

    // 從資料庫獲取
    const { data: members, error } = await supabase
      .from(TABLES.MEMBERS)
      .select('id, name, profession')
      .order('id', { ascending: true })

    if (error) {
      console.error('Error fetching members:', error)
      return apiError(`查詢會員失敗：${handleDatabaseError(error)}`, 500)
    }

    const result = { members: members || [] }
    
    // 存入快取
    cache.set(CACHE_KEYS.MEMBERS, result, CACHE_TTL.MEMBERS)
    console.log('💾 已快取：會員列表')

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching members:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`查詢會員失敗：${errorMessage}`, 500)
  }
}

