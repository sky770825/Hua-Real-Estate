import { NextResponse } from 'next/server'

/**
 * 統一的 API 錯誤響應格式
 */
export function apiError(message: string, status: number = 500, details?: any) {
  console.error('API Error:', { message, status, details })
  return NextResponse.json(
    { 
      success: false,
      error: message,
      ...(details && { details })
    },
    { status }
  )
}

/**
 * 統一的 API 成功響應格式
 */
export function apiSuccess(data?: any, message?: string) {
  return NextResponse.json(
    {
      success: true,
      ...(data && { data }),
      ...(message && { message })
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  )
}

/**
 * 驗證日期格式 (YYYY-MM-DD)
 */
export function validateDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

/**
 * 驗證會員 ID
 */
export function validateMemberId(id: any): boolean {
  return typeof id === 'number' && id > 0 && Number.isInteger(id)
}

/**
 * 驗證字串長度
 */
export function validateStringLength(str: string | null | undefined, min: number, max: number): boolean {
  if (str === null || str === undefined) return min === 0
  return str.length >= min && str.length <= max
}

/**
 * 驗證數字範圍
 */
export function validateNumberRange(num: any, min: number, max: number): boolean {
  const n = typeof num === 'number' ? num : parseFloat(String(num))
  return !isNaN(n) && n >= min && n <= max
}

/**
 * 安全的 JSON 解析
 */
export async function safeJsonParse<T = any>(request: Request): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await request.json()
    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Invalid JSON format'
    }
  }
}

/**
 * 處理資料庫錯誤，返回中文錯誤訊息
 */
export function handleDatabaseError(error: any, defaultMessage: string = '資料庫錯誤'): string {
  if (!error) return defaultMessage
  
  const errorMessage = String(error.message || '')
  const errorCode = String((error as any).code || '')
  
  // 外鍵約束錯誤
  if (errorCode === '23503' || errorMessage.includes('foreign key')) {
    return '資料關聯錯誤：請先刪除相關記錄'
  }
  
  // 唯一約束錯誤
  if (errorCode === '23505' || errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
    return '資料已存在，請使用其他值'
  }
  
  // 非空約束錯誤
  if (errorCode === '23502' || errorMessage.includes('not null')) {
    return '必填欄位不能為空'
  }
  
  // 速率限制
  if (errorCode === '429' || errorMessage.includes('Too many requests') || errorMessage.includes('rate limit')) {
    return '請求過於頻繁，請稍候 1-2 分鐘後再試'
  }
  
  return errorMessage || defaultMessage
}

