import { NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// 獲取當週和下週的中獎記錄
export async function GET(request: Request) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 計算本週週四（會議日）
    const dayOfWeek = today.getDay() // 0 = Sunday, 4 = Thursday
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7
    const thisWeekThursday = new Date(today)
    thisWeekThursday.setDate(today.getDate() + daysUntilThursday)
    
    // 計算下週週四
    const nextWeekThursday = new Date(thisWeekThursday)
    nextWeekThursday.setDate(thisWeekThursday.getDate() + 7)
    
    // 格式化日期為 YYYY-MM-DD
    const thisWeekDate = thisWeekThursday.toISOString().split('T')[0]
    const nextWeekDate = nextWeekThursday.toISOString().split('T')[0]
    
    // 查詢當週和下週的中獎記錄（分開查詢以避免關聯查詢問題）
    // 先嘗試查詢包含 claimed 欄位，如果失敗則查詢基本欄位
    let winners: any[] = []
    let winnersError: any = null
    
    // 先嘗試查詢包含 claimed 欄位
    const { data: winnersWithClaimed, error: errorWithClaimed } = await supabase
      .from(TABLES.LOTTERY_WINNERS)
      .select('id, meeting_date, created_at, claimed, claimed_at, member_id, prize_id')
      .in('meeting_date', [thisWeekDate, nextWeekDate])
      .order('meeting_date', { ascending: true })
      .order('created_at', { ascending: false })
    
    if (errorWithClaimed) {
      // 如果查詢失敗（可能是欄位不存在），嘗試只查詢基本欄位
      console.warn('Query with claimed field failed, trying without:', errorWithClaimed.message)
      const { data: winnersBasic, error: errorBasic } = await supabase
        .from(TABLES.LOTTERY_WINNERS)
        .select('id, meeting_date, created_at, member_id, prize_id')
        .in('meeting_date', [thisWeekDate, nextWeekDate])
        .order('meeting_date', { ascending: true })
        .order('created_at', { ascending: false })
      
      if (errorBasic) {
        winnersError = errorBasic
      } else {
        winners = winnersBasic || []
      }
    } else {
      winners = winnersWithClaimed || []
    }

    if (winnersError) {
      console.error('Error fetching weekly winners:', winnersError)
      throw winnersError
    }

    if (!winners || winners.length === 0) {
      return NextResponse.json({
        thisWeek: {
          date: thisWeekDate,
          winners: [],
        },
        nextWeek: {
          date: nextWeekDate,
          winners: [],
        },
      })
    }

    // 獲取所有相關的會員 ID 和獎品 ID
    const memberIds = Array.from(new Set(winners.map((w: any) => w.member_id)))
    const prizeIds = Array.from(new Set(winners.map((w: any) => w.prize_id)))

    // 查詢會員信息
    const { data: members, error: membersError } = await supabase
      .from(TABLES.MEMBERS)
      .select('id, name')
      .in('id', memberIds)

    if (membersError) {
      console.error('Error fetching members:', membersError)
      throw membersError
    }

    // 查詢獎品信息
    const { data: prizes, error: prizesError } = await supabase
      .from(TABLES.PRIZES)
      .select('id, name, image_url')
      .in('id', prizeIds)

    if (prizesError) {
      console.error('Error fetching prizes:', prizesError)
      throw prizesError
    }

    // 創建映射表以便快速查找
    const membersMap = new Map((members || []).map((m: any) => [m.id, m]))
    const prizesMap = new Map((prizes || []).map((p: any) => [p.id, p]))

    // 格式化返回數據
    const formattedWinners = (winners || []).map((w: any) => {
      const member = membersMap.get(w.member_id)
      const prize = prizesMap.get(w.prize_id)
      
      return {
        id: w.id,
        meeting_date: w.meeting_date,
        created_at: w.created_at,
        claimed: w.claimed !== undefined ? (w.claimed || false) : false, // 如果欄位不存在，默認為 false
        claimed_at: w.claimed_at !== undefined ? (w.claimed_at || null) : null, // 如果欄位不存在，默認為 null
        member_id: w.member_id,
        member_name: member?.name || '未知會員',
        prize_id: w.prize_id,
        prize_name: prize?.name || '未知獎品',
        prize_image_url: prize?.image_url || null,
      }
    })

    // 按週分組
    const thisWeekWinners = formattedWinners.filter(w => w.meeting_date === thisWeekDate)
    const nextWeekWinners = formattedWinners.filter(w => w.meeting_date === nextWeekDate)

    return NextResponse.json({
      thisWeek: {
        date: thisWeekDate,
        winners: thisWeekWinners,
      },
      nextWeek: {
        date: nextWeekDate,
        winners: nextWeekWinners,
      },
    })
  } catch (error) {
    console.error('Error fetching weekly winners:', error)
    let errorMessage = '未知錯誤'
    let errorDetails: any = null
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack
    } else if (error && typeof error === 'object') {
      // 處理 Supabase 錯誤對象
      const supabaseError = error as any
      errorMessage = supabaseError.message || supabaseError.error || '資料庫查詢錯誤'
      errorDetails = JSON.stringify(supabaseError, null, 2)
    } else {
      errorMessage = String(error)
    }
    
    console.error('Error details:', errorDetails)
    return NextResponse.json(
      { 
        error: 'Failed to fetch weekly winners',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && errorDetails && { details: errorDetails })
      },
      { status: 500 }
    )
  }
}
