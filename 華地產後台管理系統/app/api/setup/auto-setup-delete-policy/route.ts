import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

/**
 * 自動設置 DELETE 策略
 * 由於 Supabase JS 客戶端不支持直接執行 DDL SQL，
 * 此 API 會嘗試通過多種方式執行，如果都失敗則返回手動執行說明
 */
export async function POST() {
  try {
    // PostgreSQL 的 CREATE POLICY 不支持 IF NOT EXISTS，所以先刪除再創建
    const sql = `DROP POLICY IF EXISTS "Allow public delete from invite_event_images" ON invite_event_images;
CREATE POLICY "Allow public delete from invite_event_images"
ON invite_event_images
FOR DELETE
TO public
USING (true);`

    console.log('嘗試自動添加 DELETE 策略...')

    // 方法 1：嘗試使用 exec_sql RPC（如果數據庫中有這個函數）
    try {
      const { data: rpcData, error: rpcError } = await supabaseService.rpc('exec_sql', {
        sql_query: sql
      })

      if (!rpcError) {
        console.log('✅ 通過 RPC 成功執行:', rpcData)
        return NextResponse.json({
          success: true,
          message: 'DELETE 策略已成功添加！現在可以正常使用刪除功能了。',
          method: 'rpc',
          result: rpcData
        })
      } else {
        console.log('RPC 錯誤:', rpcError)
        // 如果錯誤是因為函數不存在，繼續嘗試其他方法
        if (!rpcError.message?.includes('function') && !rpcError.message?.includes('does not exist')) {
          throw rpcError
        }
      }
    } catch (rpcErr: any) {
      console.log('RPC 方法不可用:', rpcErr?.message || rpcErr)
      // 如果錯誤不是函數不存在，則可能是其他問題
      if (rpcErr?.message && !rpcErr.message.includes('function') && !rpcErr.message.includes('does not exist')) {
        // 繼續嘗試其他方法
      }
    }

    // 方法 2：嘗試使用 pg_execute RPC（如果安裝了 pg 擴展）
    try {
      const { data: pgData, error: pgError } = await supabaseService.rpc('pg_execute', {
        query: sql
      })

      if (!pgError && pgData) {
        console.log('✅ 通過 pg_execute 成功執行')
        return NextResponse.json({
          success: true,
          message: 'DELETE 策略已成功添加',
          method: 'pg_execute'
        })
      }
    } catch (pgErr) {
      console.log('pg_execute 方法不可用')
    }

    // 如果都失敗，返回手動執行說明
    console.log('⚠️  無法自動執行，需要手動執行 SQL')
    const manualSql = `DROP POLICY IF EXISTS "Allow public delete from invite_event_images" ON invite_event_images;
CREATE POLICY "Allow public delete from invite_event_images"
ON invite_event_images
FOR DELETE
TO public
USING (true);`
    return NextResponse.json({
      success: false,
      requiresManual: true,
      message: '需要手動在 Supabase Dashboard 執行 SQL',
      sql: manualSql,
      instructions: {
        step1: '打開 Supabase Dashboard',
        step1Url: 'https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc',
        step2: '進入 SQL Editor（左側菜單）',
        step3: '點擊 "New query"',
        step4: '複製下面的 SQL 並執行',
        step5: '執行完成後，刪除功能即可正常使用'
      },
      quickLink: 'https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc/sql/new'
    })

  } catch (error) {
    console.error('Error in auto-setup:', error)
    return NextResponse.json({
      success: false,
      requiresManual: true,
      message: '自動執行失敗，需要手動執行 SQL',
      sql: `DROP POLICY IF EXISTS "Allow public delete from invite_event_images" ON invite_event_images;
CREATE POLICY "Allow public delete from invite_event_images"
ON invite_event_images
FOR DELETE
TO public
USING (true);`,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 })
  }
}
