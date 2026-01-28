#!/usr/bin/env node

/**
 * 自動添加 DELETE 策略到 invite_event_images 表
 * 使用 Supabase Management API
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 從環境變數或配置文件讀取
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sqgrnowrcvspxhuudrqc.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ 錯誤：未設置 SUPABASE_SERVICE_KEY 環境變數')
  console.log('請設置環境變數：')
  console.log('export SUPABASE_SERVICE_KEY="your-service-key"')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function addDeletePolicy() {
  try {
    console.log('🔧 開始添加 DELETE 策略...')
    console.log('📋 目標表：invite_event_images')
    console.log('📋 策略名稱：Allow public delete from invite_event_images\n')

    // 讀取 SQL 文件
    const sqlPath = join(__dirname, '../../添加DELETE策略.sql')
    let sql
    try {
      sql = readFileSync(sqlPath, 'utf-8')
      // 提取 SQL 語句（去掉註釋）
      sql = sql.split('--')[0].trim()
    } catch (error) {
      // 如果文件不存在，使用內嵌 SQL
      sql = `CREATE POLICY IF NOT EXISTS "Allow public delete from invite_event_images"
ON invite_event_images
FOR DELETE
TO public
USING (true);`
    }

    console.log('📝 要執行的 SQL:')
    console.log(sql)
    console.log('\n')

    // 方法 1：嘗試使用 RPC（如果存在）
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
      if (!error) {
        console.log('✅ 通過 RPC 成功執行 SQL')
        return
      }
    } catch (rpcError) {
      console.log('ℹ️  RPC 方法不可用，嘗試其他方法...')
    }

    // 方法 2：使用 PostgREST 直接執行（不支持，PostgREST 不支持 DDL）
    // 方法 3：使用 Management API（需要 access token）

    // 由於 Supabase JS 客戶端不支持直接執行 DDL SQL，
    // 我們需要提示用戶手動執行
    console.log('⚠️  無法自動執行 SQL（Supabase JS 客戶端不支持 DDL）')
    console.log('\n📋 請手動執行以下步驟：\n')
    console.log('1. 打開 Supabase Dashboard:')
    console.log('   https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc\n')
    console.log('2. 進入 SQL Editor（左側菜單）')
    console.log('3. 點擊 "New query"')
    console.log('4. 複製並執行以下 SQL：\n')
    console.log('─'.repeat(60))
    console.log(sql)
    console.log('─'.repeat(60))
    console.log('\n5. 執行完成後，刪除功能即可正常使用\n')

    // 嘗試使用 curl 調用 Supabase Management API（如果可用）
    console.log('💡 提示：您也可以使用 Supabase CLI 執行：')
    console.log('   supabase db execute --file 添加DELETE策略.sql\n')

  } catch (error) {
    console.error('❌ 執行失敗:', error)
    process.exit(1)
  }
}

addDeletePolicy()
