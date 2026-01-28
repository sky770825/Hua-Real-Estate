/**
 * 伺服器端快取工具
 * 使用記憶體快取，適用於單一伺服器實例
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map()
  private readonly defaultTTL: number = 5 * 60 * 1000 // 預設 5 分鐘

  /**
   * 獲取快取數據
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // 檢查是否過期
    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  /**
   * 設置快取數據
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const cacheTTL = ttl || this.defaultTTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: cacheTTL,
    })
  }

  /**
   * 刪除快取
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * 清除所有快取
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 清除匹配前綴的快取
   */
  clearByPrefix(prefix: string): void {
    const keysToDelete: string[] = []
    const keys = Array.from(this.cache.keys())
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * 檢查快取是否存在且有效
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) {
      return false
    }

    // 檢查是否過期
    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * 獲取快取統計信息
   */
  getStats(): { size: number; keys: string[] } {
    // 清理過期項目
    const now = Date.now()
    const keysToDelete: string[] = []
    const entries = Array.from(this.cache.entries())
    for (const [key, item] of entries) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key))

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// 匯出單例實例
export const cache = new CacheManager()

// 快取鍵名稱常量
export const CACHE_KEYS = {
  MEMBERS: 'api:members',
  MEETINGS: 'api:meetings',
  PRIZES: 'api:prizes',
  CHECKINS: (date: string) => `api:checkins:${date}`,
  LOTTERY_WINNERS: (date: string) => `api:lottery:winners:${date}`,
  LOTTERY_WINNERS_WEEK: 'api:lottery:winners:week',
  INVITE_IMAGES: 'api:invite:images',
} as const

// 快取 TTL 常量（毫秒）
export const CACHE_TTL = {
  MEMBERS: 5 * 60 * 1000, // 5 分鐘
  MEETINGS: 3 * 60 * 1000, // 3 分鐘
  PRIZES: 5 * 60 * 1000, // 5 分鐘
  CHECKINS: 1 * 60 * 1000, // 1 分鐘（簽到數據變化較頻繁）
  LOTTERY_WINNERS: 2 * 60 * 1000, // 2 分鐘
  INVITE_IMAGES: 10 * 60 * 1000, // 10 分鐘（圖片數據變化較少）
} as const
