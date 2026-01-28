import imageCompression from 'browser-image-compression'

/**
 * 圖片壓縮選項
 */
export interface CompressionOptions {
  /** 最大檔案大小（MB），預設 2MB */
  maxSizeMB?: number
  /** 最大寬度（像素），預設 1920 */
  maxWidthOrHeight?: number
  /** 是否使用 Web Worker（可能更快但需要額外設置） */
  useWebWorker?: boolean
  /** 圖片初始品質（0-1），預設 0.8，僅適用於 JPEG 和 WebP */
  initialQuality?: number
  /** 是否保留 EXIF 資料 */
  preserveExif?: boolean
}

/**
 * 壓縮圖片檔案
 * @param file 原始圖片檔案
 * @param options 壓縮選項
 * @returns 壓縮後的檔案
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 2, // 預設壓縮到 2MB 以下
    maxWidthOrHeight = 1920, // 預設最大寬度/高度 1920px
    useWebWorker = true,
    initialQuality = 0.8, // 80% 初始品質（平衡檔案大小和品質，僅適用於 JPEG 和 WebP）
    preserveExif = false,
  } = options

  console.log('開始壓縮圖片:', {
    originalName: file.name,
    originalSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    originalType: file.type,
  })

  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker,
      initialQuality,
      preserveExif,
    })

    const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1)
    
    console.log('圖片壓縮完成:', {
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`,
      compressionRatio: `${compressionRatio}%`,
      newName: compressedFile.name,
    })

    return compressedFile
  } catch (error) {
    console.error('圖片壓縮失敗:', error)
    // 如果壓縮失敗，返回原始檔案
    console.warn('壓縮失敗，使用原始檔案')
    return file
  }
}

/**
 * 檢查檔案是否為圖片
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * 檢查檔案大小是否超過限制
 * @param file 檔案
 * @param maxSizeMB 最大大小（MB），預設 50MB（Supabase 免費方案限制）
 */
export function isFileSizeValid(file: File, maxSizeMB: number = 50): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * 格式化檔案大小顯示
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}
