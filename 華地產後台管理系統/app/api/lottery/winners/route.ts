import { NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'

// 標記為動態路由（因為使用了 request.url）
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const targetDate = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const { data: winners, error } = await supabase
      .from(TABLES.LOTTERY_WINNERS)
      .select(`
        id,
        meeting_date,
        created_at,
        claimed,
        claimed_at,
        estate_attendance_members!inner(id, name),
        estate_attendance_prizes!inner(id, name, image_url)
      `)
      .eq('meeting_date', targetDate)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })

    if (error) {
      throw error
    }

    // 格式化返回數據
    const formattedWinners = (winners || []).map((w: any) => {
      // 處理 estate_attendance_members 和 estate_attendance_prizes 可能是數組或對象的情況
      const member = Array.isArray(w.estate_attendance_members) 
        ? w.estate_attendance_members[0] 
        : w.estate_attendance_members
      const prize = Array.isArray(w.estate_attendance_prizes) 
        ? w.estate_attendance_prizes[0] 
        : w.estate_attendance_prizes
      
      return {
        id: w.id,
        meeting_date: w.meeting_date,
        created_at: w.created_at,
        claimed: w.claimed || false,
        claimed_at: w.claimed_at || null,
        member_id: member?.id,
        member_name: member?.name,
        prize_id: prize?.id,
        prize_name: prize?.name,
        prize_image_url: prize?.image_url,
      }
    })

    return NextResponse.json({ winners: formattedWinners })
  } catch (error) {
    console.error('Error fetching lottery winners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lottery winners' },
      { status: 500 }
    )
  }
}
