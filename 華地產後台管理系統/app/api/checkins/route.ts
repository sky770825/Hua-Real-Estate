import { NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { apiError, handleDatabaseError } from '@/lib/api-utils'
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache'

// 標記為動態路由（因為使用了 request.url）
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    // 嘗試從快取獲取
    const cacheKey = CACHE_KEYS.CHECKINS(date)
    const cachedData = cache.get<{ meeting: any; checkins: any[] }>(cacheKey)
    if (cachedData) {
      console.log(`✅ 使用快取：簽到記錄 (${date})`)
      return NextResponse.json(cachedData)
    }

    // 獲取會議信息
    const { data: meetings, error: meetingError } = await supabase
      .from(TABLES.MEETINGS)
      .select('*')
      .eq('date', date)
      .maybeSingle()

    if (meetingError) {
      console.error('Error fetching meeting:', meetingError)
    }

    // 獲取簽到記錄（使用更可靠的方式：分別查詢然後手動關聯）
    const { data: checkins, error: checkinsError } = await supabase
      .from(TABLES.CHECKINS)
      .select('member_id, checkin_time, message, status')
      .eq('meeting_date', date)
      .order('checkin_time', { ascending: false })

    if (checkinsError) {
      console.error('Error fetching checkins:', checkinsError)
      return NextResponse.json(
        { error: 'Failed to fetch checkins', details: checkinsError.message },
        { status: 500 }
      )
    }

    // 獲取所有相關會員信息
    const memberIds = (checkins || []).map((c: any) => c.member_id)
    let membersMap = new Map()
    
    if (memberIds.length > 0) {
      const { data: members, error: membersError } = await supabase
        .from(TABLES.MEMBERS)
        .select('id, name, profession')
        .in('id', memberIds)

      if (membersError) {
        console.error('Error fetching members:', membersError)
        // 即使獲取會員失敗，也返回簽到記錄（只是沒有會員名稱）
      } else {
        membersMap = new Map((members || []).map((m: any) => [m.id, m]))
      }
    }
    
    // 格式化返回數據
    const formattedCheckins = (checkins || []).map((c: any) => {
      const member = membersMap.get(c.member_id)
      return {
        member_id: c.member_id,
        checkin_time: c.checkin_time,
        message: c.message,
        status: c.status,
        name: member?.name || `會員 #${c.member_id}`,
        profession: member?.profession || '',
      }
    })

    const result = {
      meeting: meetings || null,
      checkins: formattedCheckins,
    }
    
    // 存入快取
    cache.set(cacheKey, result, CACHE_TTL.CHECKINS)
    console.log(`💾 已快取：簽到記錄 (${date})`)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching checkins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checkins' },
      { status: 500 }
    )
  }
}

