/**
 * 前端工具函數
 */

/**
 * 安全的 API 響應處理
 */
export async function safeApiCall<T = any>(
  response: Response,
  defaultError: string = '操作失敗'
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    // 檢查響應狀態
    if (!response.ok) {
      // 嘗試解析錯誤訊息
      let errorMessage = defaultError
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        // 如果無法解析 JSON，使用狀態碼
        errorMessage = `HTTP ${response.status}: ${response.statusText || defaultError}`
      }
      return { success: false, error: errorMessage }
    }

    // 解析成功響應
    const data = await response.json()
    
    // 檢查 API 返回的 success 字段
    if (data.success === false) {
      return { success: false, error: data.error || defaultError }
    }

    return { success: true, data: data.data || data }
  } catch (error) {
    console.error('Error parsing API response:', error)
    const errorMessage = error instanceof Error ? error.message : defaultError
    return { success: false, error: errorMessage }
  }
}

/**
 * 過濾 Vercel 相關文字
 */
export function filterVercelText(text: string): string {
  return text
    .replace(/vercel\.app/gi, '')
    .replace(/vercel/gi, '')
    .replace(/\.app/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 格式化日期為 YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

/**
 * 格式化時間為本地時間字串
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * 防抖函數
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * 節流函數
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * 延遲執行函數
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

