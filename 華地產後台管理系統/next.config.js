/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 確保 API 路由在生產環境正常工作
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // 圖片優化配置
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    // 允許從 Supabase Storage 載入圖片
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // 輸出配置（standalone 模式，適用於各種部署環境）
  output: 'standalone',
  // 排除 cursor自動化指揮官目錄（這是獨立的工具，不應被 Next.js 編譯）
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**', '**/cursor自動化指揮官/**'],
    }
    return config
  },
}

module.exports = nextConfig

