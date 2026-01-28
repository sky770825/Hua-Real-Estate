import { NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { syncMembersToSheets, testGoogleSheetsConnection } from '@/lib/google-sheets'

export const dynamic = 'force-dynamic'

// 測試 Google Sheets 連線
export async function GET() {
  try {
    const result = await testGoogleSheetsConnection()
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `成功連接到 Google Sheets: ${result.title}`,
        title: result.title,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || '無法連接到 Google Sheets',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('測試 Google Sheets 連線失敗:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤',
      },
      { status: 500 }
    )
  }
}

// 同步會員資料到 Google Sheets
export async function POST() {
  try {
    // 從資料庫獲取所有會員
    const { data: members, error } = await supabase
      .from(TABLES.MEMBERS)
      .select('id, name, profession')
      .order('id', { ascending: true })

    if (error) {
      console.error('獲取會員資料失敗:', error)
      return NextResponse.json(
        {
          success: false,
          error: `獲取會員資料失敗：${error.message || '資料庫錯誤'}`,
        },
        { status: 500 }
      )
    }

    if (!members || members.length === 0) {
      return NextResponse.json({
        success: true,
        message: '沒有會員資料需要同步',
        count: 0,
      })
    }

    // 同步到 Google Sheets
    const syncResult = await syncMembersToSheets(members)

    if (syncResult.success) {
      return NextResponse.json({
        success: true,
        message: `成功同步 ${syncResult.count} 筆會員資料到 Google Sheets`,
        count: syncResult.count,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: syncResult.error || '同步失敗',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('同步到 Google Sheets 失敗:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤',
      },
      { status: 500 }
    )
  }
}

