#!/usr/bin/env node

/**
 * 直接執行 SQL 腳本
 * 使用 Supabase Management API
 */

import fetch from 'node-fetch'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sqgrnowrcvspxhuudrqc.supabase.co'
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const PROJECT_REF = 'sqgrnowrcvspxhuudrqc'

const sql = `CREATE POLICY IF NOT EXISTS "Allow public delete from invite_event_images"
ON invite_event_images
FOR DELETE
TO public
USING (true);`

async function executeSQL() {
  if (!SUPABASE_ACCESS_TOKEN) {
    console.log('❌ 未設置 SUPABASE_ACCESS_TOKEN')
    console.log('\n📋 請手動執行以下步驟：\n')
    console.log('1. 打開：https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc/sql/new')
    console.log('2. 複製並執行以下 SQL：\n')
    console.log('─'.repeat(60))
    console.log(sql)
    console.log('─'.repeat(60))
    process.exit(1)
  }

  try {
    console.log('🔧 嘗試通過 Management API 執行 SQL...')
    
    // Supabase Management API 端點
    const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sql
      })
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ SQL 執行成功！')
      console.log(data)
    } else {
      console.error('❌ 執行失敗:', data)
      throw new Error(data.message || '執行失敗')
    }
  } catch (error) {
    console.error('❌ 錯誤:', error.message)
    console.log('\n📋 請手動執行以下步驟：\n')
    console.log('1. 打開：https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc/sql/new')
    console.log('2. 複製並執行以下 SQL：\n')
    console.log('─'.repeat(60))
    console.log(sql)
    console.log('─'.repeat(60))
    process.exit(1)
  }
}

executeSQL()
