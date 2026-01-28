import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase'
import { apiError, apiSuccess } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// 使用 Supabase REST API 執行 SQL（通過 RPC）
// 注意：這需要先在數據庫中創建一個 RPC 函數來執行 SQL
export async function POST() {
  try {
    console.log('嘗試通過 RPC 執行 SQL...')

    // 方法：使用 Supabase 的 execute_sql RPC（如果存在）
    // 或者使用 pg_execute（如果已安裝 pg 擴展）
    
    // 首先嘗試調用一個可能存在的 RPC
    const { data, error } = await supabaseService.rpc('exec_sql', {
      sql_query: `
        CREATE POLICY IF NOT EXISTS "Allow public delete from invite_event_images"
        ON invite_event_images
        FOR DELETE
        TO public
        USING (true);
      `
    })

    if (error) {
      // 如果 RPC 不存在，返回手動執行說明
      console.warn('RPC 不可用，需要手動執行 SQL:', error)
      return NextResponse.json({
        success: false,
        requiresManual: true,
        message: '需要手動在 Supabase Dashboard 執行 SQL',
        sql: `
CREATE POLICY IF NOT EXISTS "Allow public delete from invite_event_images"
ON invite_event_images
FOR DELETE
TO public
USING (true);
        `.trim(),
        instructions: [
          '1. 打開：https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc',
          '2. 左側菜單 → SQL Editor',
          '3. 點擊 New query',
          '4. 複製上面的 SQL 並執行',
          '5. 完成後刷新頁面即可使用刪除功能'
        ]
      })
    }

    return apiSuccess(data, 'DELETE 策略已成功添加')

  } catch (error) {
    console.error('Error executing SQL:', error)
    return NextResponse.json({
      success: false,
      requiresManual: true,
      message: '自動執行失敗，需要手動執行 SQL',
      sql: `
CREATE POLICY IF NOT EXISTS "Allow public delete from invite_event_images"
ON invite_event_images
FOR DELETE
TO public
USING (true);
      `.trim(),
      error: error instanceof Error ? error.message : '未知錯誤'
    })
  }
}
