/**
 * Service Worker - 離線快取優化
 * 華地產鑽石分會網站
 * 作者: 資訊長 蔡濬瑒
 */

const CACHE_NAME = 'huadi-cache-v1';
const STATIC_CACHE = 'huadi-static-v1';
const DYNAMIC_CACHE = 'huadi-dynamic-v1';

// 需要快取的靜態資源
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/invite.html',
    '/styles.css',
    '/script.js',
    '/sheets-data-loader-apps-script.js',
    // 添加常用的 Google Fonts 和 CDN 資源
    'https://fonts.googleapis.com/css2?family=Segoe+UI:wght@300;400;500;600;700&display=swap'
];

// 需要快取的 API 端點
const API_ENDPOINTS = [
    'https://script.google.com/macros/s/AKfycbzzuFuWJS_wNkv_qMi0wUQAypjYzw7uMFbHaPi3W8qdIFtW3dXT8WMO2P1VCwq25v3T/exec'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
    console.log('🔧 Service Worker 安裝中...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('📦 快取靜態資源...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ 靜態資源快取完成');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ 靜態資源快取失敗:', error);
            })
    );
});

// 啟動 Service Worker
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker 啟動中...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // 刪除舊的快取
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('🗑️ 刪除舊快取:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker 啟動完成');
                return self.clients.claim();
            })
    );
});

// 攔截網路請求
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // 處理 API 請求
    if (API_ENDPOINTS.some(endpoint => request.url.includes(endpoint))) {
        event.respondWith(handleAPIRequest(request));
        return;
    }
    
    // 處理靜態資源請求
    if (request.method === 'GET') {
        event.respondWith(handleStaticRequest(request));
        return;
    }
});

// 處理 API 請求（網路優先，快取備用）
async function handleAPIRequest(request) {
    try {
        // 先嘗試網路請求
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // 快取成功的回應
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            console.log('💾 API 回應已快取:', request.url);
            return networkResponse;
        }
        
        throw new Error('網路回應不成功');
    } catch (error) {
        console.log('🔄 網路請求失敗，嘗試從快取載入:', request.url);
        
        // 從快取載入
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('✅ 從快取載入 API 資料');
            return cachedResponse;
        }
        
        // 如果快取也沒有，返回錯誤頁面
        return new Response(
            JSON.stringify({
                success: false,
                error: '網路連線失敗，且無快取資料',
                offline: true
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// 處理靜態資源請求（快取優先，網路備用）
async function handleStaticRequest(request) {
    try {
        // 先嘗試從快取載入
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('⚡ 從快取載入靜態資源:', request.url);
            return cachedResponse;
        }
        
        // 快取沒有，從網路載入
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // 快取網路回應
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            console.log('💾 靜態資源已快取:', request.url);
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ 靜態資源載入失敗:', request.url, error);
        
        // 如果是 HTML 頁面，返回離線頁面
        if (request.destination === 'document') {
            return new Response(`
                <!DOCTYPE html>
                <html lang="zh-TW">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>離線模式 - 華地產鑽石分會</title>
                    <style>
                        body { 
                            font-family: 'Segoe UI', sans-serif; 
                            text-align: center; 
                            padding: 50px; 
                            background: linear-gradient(135deg, #2c3e50, #34495e);
                            color: white;
                        }
                        .offline-container {
                            max-width: 500px;
                            margin: 0 auto;
                            padding: 40px;
                            background: rgba(255,255,255,0.1);
                            border-radius: 20px;
                            backdrop-filter: blur(10px);
                        }
                        h1 { color: #ffd700; margin-bottom: 20px; }
                        p { line-height: 1.6; margin-bottom: 20px; }
                        .retry-btn {
                            background: linear-gradient(135deg, #667eea, #764ba2);
                            color: white;
                            border: none;
                            padding: 15px 30px;
                            border-radius: 25px;
                            font-size: 1.1rem;
                            cursor: pointer;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="offline-container">
                        <h1>📡 離線模式</h1>
                        <p>目前無法連接到網路，但您仍可以瀏覽已快取的內容。</p>
                        <p>請檢查您的網路連線，或稍後再試。</p>
                        <button class="retry-btn" onclick="location.reload()">重新載入</button>
                    </div>
                </body>
                </html>
            `, {
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        throw error;
    }
}

// 背景同步（當網路恢復時）
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('🔄 背景同步啟動...');
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // 清理過期的快取
        const cache = await caches.open(DYNAMIC_CACHE);
        const requests = await cache.keys();
        
        const now = Date.now();
        const maxAge = 2 * 60 * 60 * 1000; // 2小時
        
        for (const request of requests) {
            const response = await cache.match(request);
            const dateHeader = response.headers.get('date');
            
            if (dateHeader) {
                const responseTime = new Date(dateHeader).getTime();
                if (now - responseTime > maxAge) {
                    await cache.delete(request);
                    console.log('🗑️ 清理過期快取:', request.url);
                }
            }
        }
        
        console.log('✅ 背景同步完成');
    } catch (error) {
        console.error('❌ 背景同步失敗:', error);
    }
}

// 推送通知（如果需要）
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
            }
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

console.log('🔧 Service Worker 腳本載入完成');
