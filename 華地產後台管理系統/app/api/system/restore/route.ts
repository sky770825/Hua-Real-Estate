import { NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { apiError, apiSuccess, safeJsonParse } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

interface BackupData {
  version?: string
  timestamp?: string
  data: {
    members?: Array<{ id: number; name: string; profession?: string | null }>
    meetings?: Array<{ id: number; date: string; status: string }>
    checkins?: Array<{
      member_id: number
      meeting_date: string
      checkin_time: string | null
      message: string | null
      status: string
    }>
    prizes?: Array<{
      id: number
      name: string
      description?: string | null
      image_url?: string | null
      quantity?: number | null
    }>
    winners?: Array<{
      id: number
      meeting_date: string
      member_id: number
      prize_id: number
      created_at?: string
      claimed?: boolean
      claimed_at?: string | null
    }>
  }
}

/**
 * 還原資料庫
 * POST /api/system/restore
 * Body: { backupData: BackupData }
 */
export async function POST(request: Request) {
  try {
    const { data: body, error: parseError } = await safeJsonParse<{
      backupData: BackupData
    }>(request)

    if (parseError || !body || !body.backupData) {
      return apiError('請求格式錯誤：缺少備份數據', 400)
    }

    const { backupData } = body

    // 驗證備份數據結構
    if (!backupData.data) {
      return apiError('備份數據格式錯誤：缺少 data 欄位', 400)
    }

    const results = {
      members: { restored: 0, errors: [] as string[] },
      meetings: { restored: 0, errors: [] as string[] },
      checkins: { restored: 0, errors: [] as string[] },
      prizes: { restored: 0, errors: [] as string[] },
      winners: { restored: 0, errors: [] as string[] },
    }

    // 1. 還原會員
    if (backupData.data.members && backupData.data.members.length > 0) {
      try {
        // 先刪除所有現有會員
        await supabase.from(TABLES.MEMBERS).delete().neq('id', 0)
        
        // 插入備份的會員數據
        const { error: membersError } = await supabase
          .from(TABLES.MEMBERS)
          .insert(backupData.data.members)

        if (membersError) {
          results.members.errors.push(membersError.message)
        } else {
          results.members.restored = backupData.data.members.length
        }
      } catch (error) {
        results.members.errors.push(
          error instanceof Error ? error.message : '未知錯誤'
        )
      }
    }

    // 2. 還原會議
    if (backupData.data.meetings && backupData.data.meetings.length > 0) {
      try {
        // 先刪除所有現有會議
        await supabase.from(TABLES.MEETINGS).delete().neq('id', 0)
        
        // 插入備份的會議數據
        const { error: meetingsError } = await supabase
          .from(TABLES.MEETINGS)
          .insert(backupData.data.meetings)

        if (meetingsError) {
          results.meetings.errors.push(meetingsError.message)
        } else {
          results.meetings.restored = backupData.data.meetings.length
        }
      } catch (error) {
        results.meetings.errors.push(
          error instanceof Error ? error.message : '未知錯誤'
        )
      }
    }

    // 3. 還原簽到記錄
    if (backupData.data.checkins && backupData.data.checkins.length > 0) {
      try {
        // 先刪除所有現有簽到記錄
        await supabase.from(TABLES.CHECKINS).delete().neq('id', 0)
        
        // 插入備份的簽到記錄
        const { error: checkinsError } = await supabase
          .from(TABLES.CHECKINS)
          .insert(backupData.data.checkins)

        if (checkinsError) {
          results.checkins.errors.push(checkinsError.message)
        } else {
          results.checkins.restored = backupData.data.checkins.length
        }
      } catch (error) {
        results.checkins.errors.push(
          error instanceof Error ? error.message : '未知錯誤'
        )
      }
    }

    // 4. 還原獎品
    if (backupData.data.prizes && backupData.data.prizes.length > 0) {
      try {
        // 先刪除所有現有獎品
        await supabase.from(TABLES.PRIZES).delete().neq('id', 0)
        
        // 插入備份的獎品數據
        const { error: prizesError } = await supabase
          .from(TABLES.PRIZES)
          .insert(backupData.data.prizes)

        if (prizesError) {
          results.prizes.errors.push(prizesError.message)
        } else {
          results.prizes.restored = backupData.data.prizes.length
        }
      } catch (error) {
        results.prizes.errors.push(
          error instanceof Error ? error.message : '未知錯誤'
        )
      }
    }

    // 5. 還原中獎記錄
    if (backupData.data.winners && backupData.data.winners.length > 0) {
      try {
        // 先刪除所有現有中獎記錄
        await supabase.from(TABLES.LOTTERY_WINNERS).delete().neq('id', 0)
        
        // 插入備份的中獎記錄
        const { error: winnersError } = await supabase
          .from(TABLES.LOTTERY_WINNERS)
          .insert(backupData.data.winners)

        if (winnersError) {
          results.winners.errors.push(winnersError.message)
        } else {
          results.winners.restored = backupData.data.winners.length
        }
      } catch (error) {
        results.winners.errors.push(
          error instanceof Error ? error.message : '未知錯誤'
        )
      }
    }

    // 計算總計
    const totalRestored =
      results.members.restored +
      results.meetings.restored +
      results.checkins.restored +
      results.prizes.restored +
      results.winners.restored

    const hasErrors = Object.values(results).some(
      (r) => r.errors.length > 0
    )

    if (hasErrors) {
      return apiError('還原過程中發生部分錯誤', 500, results)
    }

    return apiSuccess(
      results,
      `資料庫還原成功！共還原 ${totalRestored} 筆記錄`
    )
  } catch (error) {
    console.error('Error restoring database:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`還原資料庫失敗：${errorMessage}`, 500)
  }
}
