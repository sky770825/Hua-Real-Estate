import { NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { apiError, apiSuccess, safeJsonParse, handleDatabaseError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { data: body, error: parseError } = await safeJsonParse<{ date?: string }>(request)
    
    if (parseError) {
      return apiError('請求格式錯誤：無法解析 JSON', 400)
    }

    const { date } = body || {}
    const targetDate = date || new Date().toISOString().split('T')[0]

    // 驗證日期格式
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return apiError('日期格式錯誤，應為 YYYY-MM-DD', 400)
    }

    // 1. 獲取總簽到人數
    const { count: totalCheckins, error: countError } = await supabase
      .from(TABLES.CHECKINS)
      .select('*', { count: 'exact', head: true })
      .eq('meeting_date', targetDate)
      .eq('status', 'present')

    if (countError) {
      console.error('Error counting checkins:', countError)
      return apiError(`查詢簽到人數失敗：${handleDatabaseError(countError)}`, 500)
    }

    if (!totalCheckins || totalCheckins === 0) {
      return apiError('今天沒有簽到的會員', 400)
    }

    // 2. 獲取已中獎人數
    const { count: totalWinners } = await supabase
      .from(TABLES.LOTTERY_WINNERS)
      .select('*', { count: 'exact', head: true })
      .eq('meeting_date', targetDate)

    // 3. 獲取可抽獎的簽到會員（排除已中獎的）
    const { data: allCheckins } = await supabase
      .from(TABLES.CHECKINS)
      .select(`
        member_id,
        estate_attendance_members!inner(id, name)
      `)
      .eq('meeting_date', targetDate)
      .eq('status', 'present') as any

    const { data: existingWinners } = await supabase
      .from(TABLES.LOTTERY_WINNERS)
      .select('member_id')
      .eq('meeting_date', targetDate)

    const winnerMemberIds = new Set((existingWinners || []).map((w: any) => w.member_id))
    
    const eligibleCheckins = (allCheckins || []).filter((c: any) => 
      !winnerMemberIds.has(c.member_id)
    )

    if (eligibleCheckins.length === 0) {
      return NextResponse.json(
        { error: '今日可抽獎人數已抽完' },
        { status: 400 }
      )
    }

    // 4. 獲取可用獎品
    const { data: prizes } = await supabase
      .from(TABLES.PRIZES)
      .select('*')
      .gt('remaining_quantity', 0)
      .order('id', { ascending: true })

    if (!prizes || prizes.length === 0) {
      return NextResponse.json(
        { error: '沒有可用的獎品' },
        { status: 400 }
      )
    }

    // 5. 隨機選擇獲獎者
    const winnerIndex = Math.floor(Math.random() * eligibleCheckins.length)
    const winner = eligibleCheckins[winnerIndex]

    // 6. 根據機率選擇獎品
    const weightedPrizes = prizes.map((prize: any) => ({
      ...prize,
      weight: Number.isFinite(prize.probability) && prize.probability > 0 ? prize.probability : 0,
    }))
    
    let totalWeight = weightedPrizes.reduce((sum: number, prize: any) => sum + prize.weight, 0)
    if (totalWeight <= 0) {
      totalWeight = weightedPrizes.length
      weightedPrizes.forEach((prize: any) => {
        prize.weight = 1
      })
    }

    let random = Math.random() * totalWeight
    let selectedPrize = weightedPrizes[0]
    for (const prize of weightedPrizes) {
      random -= prize.weight
      if (random <= 0) {
        selectedPrize = prize
        break
      }
    }

    // 7. 更新獎品剩餘數量（使用原子操作）
    const { data: updatedPrize, error: updateError } = await supabase
      .from(TABLES.PRIZES)
      .update({
        remaining_quantity: selectedPrize.remaining_quantity - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedPrize.id)
      .gt('remaining_quantity', 0)
      .select()
      .single()

    if (updateError || !updatedPrize) {
      return NextResponse.json(
        { error: '獎品已被抽完，請再試一次' },
        { status: 409 }
      )
    }

    // 8. 插入中獎記錄
    const { error: insertError } = await supabase
      .from(TABLES.LOTTERY_WINNERS)
      .insert([{
        meeting_date: targetDate,
        member_id: winner.member_id,
        prize_id: selectedPrize.id,
      }])

    if (insertError) {
      console.error('Error inserting winner:', insertError)
      // 如果插入失敗，需要回滾獎品數量（但 Supabase 不支持事務，這裡只能記錄錯誤）
      return NextResponse.json(
        { error: 'Failed to record winner' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      prize: {
        id: updatedPrize.id,
        name: updatedPrize.name,
        image_url: updatedPrize.image_url,
        remaining_quantity: updatedPrize.remaining_quantity,
      },
      winner: {
        id: (winner.estate_attendance_members as any)?.id || winner.member_id,
        name: (winner.estate_attendance_members as any)?.name || '',
        member_id: winner.member_id,
      },
      totalCheckins,
      totalWinners: (totalWinners || 0) + 1,
      remainingEligible: eligibleCheckins.length - 1,
      winnerProbability: (1 / eligibleCheckins.length * 100).toFixed(2) + '%',
    })
  } catch (error) {
    console.error('Error drawing lottery:', error)
    return NextResponse.json(
      { error: 'Failed to draw lottery' },
      { status: 500 }
    )
  }
}
