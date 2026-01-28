import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase'
import { apiError, apiSuccess } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// 自動添加 DELETE 策略到 invite_event_images 表
export async function POST() {
  try {
    console.log('開始添加 DELETE 策略...')

    // 使用 Supabase REST API 執行 SQL
    // 注意：Supabase JS 客戶端不直接支持執行 SQL，我們需要使用 PostgREST 的 RPC
    // 但創建策略需要直接 SQL，所以我們使用 pg 擴展的 RPC（如果可用）
    // 或者使用 Management API

    // 方法 1：嘗試使用 Supabase Management API（需要 access token）
    // 方法 2：直接使用服務端客戶端執行（如果支持）
    
    // 由於 Supabase JS 客戶端不支持直接執行 SQL，我們需要：
    // 1. 檢查策略是否已存在
    // 2. 如果不存在，提示用戶手動執行 SQL

    // 先檢查策略是否已存在
    const { data: policies, error: checkError } = await supabaseService
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'invite_event_images')
      .eq('policyname', 'Allow public delete from invite_event_images')

    if (checkError) {
      console.warn('無法檢查策略（可能需要直接執行 SQL）:', checkError)
    }

    // 嘗試使用 SQL 函數執行
    const sql = `
      CREATE POLICY IF NOT EXISTS "Allow public delete from invite_event_images"
      ON invite_event_images
      FOR DELETE
      TO public
      USING (true);
    `

    // 由於 Supabase JS 客戶端不支持直接執行 SQL，
    // 我們返回 SQL 腳本和執行說明
    return NextResponse.json({
      success: true,
      message: '請在 Supabase Dashboard 中執行以下 SQL',
      sql: sql.trim(),
      instructions: [
        '1. 打開 Supabase Dashboard',
        '2. 進入 SQL Editor',
        '3. 複製下面的 SQL 並執行',
        '4. 完成後刪除功能即可正常使用'
      ]
    })

  } catch (error) {
    console.error('Error setting up delete policy:', error)
    const errorMessage = error instanceof Error ? error.message : '未知錯誤'
    return apiError(`設置 DELETE 策略失敗：${errorMessage}`, 500)
  }
}
