/**
 * Google Apps Script 資料載入器 (前端)
 * 華地產鑽石分會網站數據管理系統
 * 作者: 資訊長 蔡濬瑒
 * 版本: 1.0
 */

// ==================== 配置區 ====================

const APPS_SCRIPT_CONFIG = {
    // 部署後的 Web App URL
    apiUrl: 'https://script.google.com/macros/s/AKfycbzzuFuWJS_wNkv_qMi0wUQAypjYzw7uMFbHaPi3W8qdIFtW3dXT8WMO2P1VCwq25v3T/exec',
    
    // API 金鑰（選用，如果你在 Apps Script 中啟用了權限檢查）
    apiKey: '', // 留空表示公開模式
    
    // 快取設定（30分鐘快取，大幅提升效能）
    cacheEnabled: true,
    cacheDuration: 30 * 60 * 1000, // 30 分鐘（從 1 分鐘提升）
    
    // 最小刷新間隔（防止短時間內重複載入）
    minRefreshInterval: 5 * 1000, // 5 秒（從 10 秒降低）
    
    // 使用 localStorage 持久化快取
    usePersistentCache: true,
    localStorageKey: 'huadi_sheets_cache'
};

// ==================== 資料快取 ====================

let dataCache = {
    data: null,
    timestamp: null,
    lastRequestTime: null // 追蹤最後一次請求時間
};

// 防止重複初始化
let isInitializing = false;
let hasInitialized = false;

/**
 * 從 localStorage 載入快取
 */
function loadPersistentCache() {
    if (!APPS_SCRIPT_CONFIG.usePersistentCache) return null;
    
    try {
        const cached = localStorage.getItem(APPS_SCRIPT_CONFIG.localStorageKey);
        if (!cached) return null;
        
        const parsed = JSON.parse(cached);
        const now = Date.now();
        const cacheAge = now - parsed.timestamp;
        
        if (cacheAge < APPS_SCRIPT_CONFIG.cacheDuration) {
            console.log('💾 從 localStorage 載入快取資料（快取年齡：' + Math.round(cacheAge / 1000) + '秒）');
            dataCache.data = parsed.data;
            dataCache.timestamp = parsed.timestamp;
            return parsed.data;
        }
    } catch (error) {
        console.warn('⚠️ localStorage 快取讀取失敗:', error);
    }
    return null;
}

/**
 * 儲存快取到 localStorage
 */
function savePersistentCache(data) {
    if (!APPS_SCRIPT_CONFIG.usePersistentCache) return;
    
    try {
        const cacheData = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(APPS_SCRIPT_CONFIG.localStorageKey, JSON.stringify(cacheData));
        console.log('💾 快取已儲存到 localStorage');
    } catch (error) {
        console.warn('⚠️ localStorage 快取儲存失敗:', error);
    }
}

/**
 * 檢查快取是否有效
 */
function isCacheValid() {
    if (!APPS_SCRIPT_CONFIG.cacheEnabled) return false;
    if (!dataCache.data || !dataCache.timestamp) {
        // 嘗試從 localStorage 載入
        const persistentData = loadPersistentCache();
        return persistentData !== null;
    }
    
    const now = Date.now();
    const cacheAge = now - dataCache.timestamp;
    
    // 檢查快取時間是否還在有效期內
    return cacheAge < APPS_SCRIPT_CONFIG.cacheDuration;
}

/**
 * 檢查是否可以發送新請求（防止頻繁刷新）
 */
function canMakeNewRequest() {
    if (!dataCache.lastRequestTime) return true;
    
    const now = Date.now();
    const timeSinceLastRequest = now - dataCache.lastRequestTime;
    
    // 如果距離上次請求未滿最小間隔，則不允許新請求
    return timeSinceLastRequest >= APPS_SCRIPT_CONFIG.minRefreshInterval;
}

/**
 * 更新快取
 */
function updateCache(data) {
    dataCache.data = data;
    dataCache.timestamp = Date.now();
    savePersistentCache(data); // 同時儲存到 localStorage
}

/**
 * 清除快取
 */
function clearCache() {
    dataCache.data = null;
    dataCache.timestamp = null;
    dataCache.lastRequestTime = null;
    
    // 同時清除 localStorage
    if (APPS_SCRIPT_CONFIG.usePersistentCache) {
        try {
            localStorage.removeItem(APPS_SCRIPT_CONFIG.localStorageKey);
            console.log('🗑️ localStorage 快取已清除');
        } catch (error) {
            console.warn('⚠️ localStorage 清除失敗:', error);
        }
    }
}

// ==================== API 呼叫函數 ====================

/**
 * 從 Apps Script API 讀取所有資料
 */
async function loadAllData(forceRefresh = false) {
    // 優先檢查記憶體快取
    if (!forceRefresh && isCacheValid()) {
        console.log('⚡ 使用記憶體快取資料（極速載入）');
        return dataCache.data;
    }
    
    // 再檢查 localStorage 快取
    if (!forceRefresh) {
        const persistentData = loadPersistentCache();
        if (persistentData) {
            return persistentData;
        }
    }
    
    // 檢查請求頻率限制
    if (!forceRefresh && !canMakeNewRequest()) {
        const waitTime = Math.ceil((APPS_SCRIPT_CONFIG.minRefreshInterval - (Date.now() - dataCache.lastRequestTime)) / 1000);
        console.log(`⏳ 請稍候 ${waitTime} 秒後再刷新（防止頻繁請求）`);
        
        // 如果有舊快取，返回舊快取
        if (dataCache.data) {
            return dataCache.data;
        }
    }
    
    console.log('📥 從 Google Apps Script API 載入最新資料...');
    
    // 記錄請求時間
    dataCache.lastRequestTime = Date.now();
    
    try {
        // 建立 API URL
        const url = new URL(APPS_SCRIPT_CONFIG.apiUrl);
        url.searchParams.append('action', 'getAll');
        
        // 如果有設定 API 金鑰，加入參數
        if (APPS_SCRIPT_CONFIG.apiKey) {
            url.searchParams.append('apiKey', APPS_SCRIPT_CONFIG.apiKey);
        }
        
        // 呼叫 API
        const response = await fetch(url.toString());
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || '未知錯誤');
        }
        
        console.log('✅ 資料載入完成（共 ' + result.sheetsFound + ' 個工作表）');
        
        // 更新快取
        updateCache(result.data);
        
        return result.data;
    } catch (error) {
        console.error('❌ 資料載入失敗:', error);
        console.error('   錯誤類型:', error.name);
        console.error('   錯誤訊息:', error.message);
        console.error('   錯誤堆疊:', error.stack);
        throw error;
    }
}

/**
 * 讀取單一工作表資料
 */
async function loadSheetData(sheetKey) {
    console.log(`📥 載入工作表: ${sheetKey}`);
    
    try {
        const url = new URL(APPS_SCRIPT_CONFIG.apiUrl);
        url.searchParams.append('action', 'getSheet');
        url.searchParams.append('sheet', sheetKey);
        
        if (APPS_SCRIPT_CONFIG.apiKey) {
            url.searchParams.append('apiKey', APPS_SCRIPT_CONFIG.apiKey);
        }
        
        const response = await fetch(url.toString());
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || '未知錯誤');
        }
        
        console.log(`✅ 工作表 ${sheetKey} 載入完成`);
        
        return result.data;
    } catch (error) {
        console.error(`❌ 工作表 ${sheetKey} 載入失敗:`, error);
        return null;
    }
}

/**
 * 取得 API 版本資訊
 */
async function getAPIVersion() {
    try {
        const url = new URL(APPS_SCRIPT_CONFIG.apiUrl);
        url.searchParams.append('action', 'getVersion');
        
        const response = await fetch(url.toString());
        const result = await response.json();
        
        if (result.success) {
            console.log('📌 API v' + result.version + ' - ' + result.sheets + ' 個工作表');
            return result;
        }
    } catch (error) {
        return null;
    }
}

// ==================== 圖片快取函數（提前定義以供立即執行函數使用）====================

/**
 * 🚀 優化：從 localStorage 讀取上次的圖片 URL
 */
function getCachedImageUrls() {
    try {
        const cacheKey = 'invite_event_images';
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return null;
        
        const imageData = JSON.parse(cached);
        const cacheAge = Date.now() - imageData.timestamp;
        
        // 如果快取超過 7 天，視為過期
        if (cacheAge > 7 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(cacheKey);
            return null;
        }
        
        return {
            image1: imageData.image1,
            image2: imageData.image2
        };
    } catch (error) {
        return null;
    }
}

/**
 * 🚀 優化：儲存圖片 URL 到 localStorage 以便下次快速載入
 */
function saveImageUrlsToCache(image1Url, image2Url) {
    try {
        const cacheKey = 'invite_event_images';
        const imageData = {
            image1: image1Url,
            image2: image2Url,
            timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(imageData));
        console.log('💾 圖片 URL 已儲存到快取');
    } catch (error) {
        console.warn('⚠️ 無法儲存圖片 URL 到快取:', error);
    }
}

// ==================== 渲染函數 ====================

/**
 * 渲染網站基本設定
 */
function renderSiteConfig(data) {
    if (!data) return;
    
    const config = {};
    data.forEach(item => {
        const key = item['A欄位名稱'];
        const value = item['B數值'];
        if (key && value) config[key] = value;
    });
    
    if (config['網站標題']) {
        document.title = config['網站標題'];
    }
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && config['網站描述']) {
        metaDesc.setAttribute('content', config['網站描述']);
    }
    
}

/**
 * 渲染導航選單
 */
function renderNavigation(data) {
    if (!data) return;
    
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;
    
    const activeItems = data
        .filter(item => item['E是否啟用'] === 'TRUE' || item['E是否啟用'] === 'true')
        .sort((a, b) => parseInt(a['D排序'] || 0) - parseInt(b['D排序'] || 0));
    
    navMenu.innerHTML = activeItems.map(item => 
        `<a href="${item['C錨點連結']}" class="nav-link">${item['B選單文字']}</a>`
    ).join('');
    
}

/**
 * 渲染金質獎榮譽榜
 */
function renderHonorBoard(data) {
    if (!data) return;
    
    const honorContent = document.querySelector('.honor-content');
    if (!honorContent) return;
    
    const visibleItems = data
        .filter(item => item['F是否顯示'] === 'TRUE' || item['F是否顯示'] === 'true')
        .sort((a, b) => parseInt(a['E排序'] || 0) - parseInt(b['E排序'] || 0));
    
    honorContent.innerHTML = visibleItems.map(item => `
        <div class="honor-item">
            <img src="${item['D圖片網址']}" 
                 alt="${item['C獎項名稱']}" 
                 class="honor-image" 
                 onclick="openImageModal('${item['D圖片網址']}', '${item['C獎項名稱']}')">
            <div class="honor-text">
                <h3>${item['C獎項名稱']}</h3>
            </div>
        </div>
    `).join('');
    
}

/**
 * 渲染 Zoom 會議室
 */
function renderZoomRooms(data) {
    if (!data) return;
    
    const meetingRoomsRow = document.querySelector('.meeting-rooms-row');
    if (!meetingRoomsRow) return;
    
    const sortedRooms = data.sort((a, b) => 
        parseInt(a['G排序'] || 0) - parseInt(b['G排序'] || 0)
    );
    
    meetingRoomsRow.innerHTML = sortedRooms.map(room => {
        const isPriority = room['E是否優先'] === 'TRUE' || room['E是否優先'] === 'true';
        const priorityNotice = isPriority ? `
            <div class="priority-notice">
                <div class="notice-icon"><i class="fas fa-star"></i></div>
                <span class="notice-text">${room['F優先提示文字']}</span>
            </div>
        ` : '';
        
        return `
            <div class="meeting-room ${isPriority ? 'zoom-hua-container' : ''}">
                ${priorityNotice}
                <a href="${room['C會議室網址']}" target="_blank" class="btn btn-primary">
                    <i class="fas fa-video"></i>
                    ${room['B會議室名稱']}
                </a>
                <div class="meeting-id-container">
                    <p class="meeting-id">${isPriority ? '華地產' : ''}會議ID: ${room['D會議ID']}</p>
                    <button class="btn-copy" onclick="copyMeetingId('${room['D會議ID']}')" title="複製會議ID">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
}

/**
 * 渲染資源連結卡片
 */
function renderResourceCards(data) {
    if (!data) return;
    
    const resourcesGrid = document.querySelector('.resources-grid');
    if (!resourcesGrid) return;
    
    const sortedCards = data.sort((a, b) => 
        parseInt(a['G排序'] || 0) - parseInt(b['G排序'] || 0)
    );
    
    resourcesGrid.innerHTML = sortedCards.map(card => `
        <div class="resource-card">
            <h3>${card['B卡片標題']}</h3>
            <p>${card['C卡片描述']}</p>
            <a href="${card['D連結網址']}" target="_blank" class="btn btn-outline">
                <i class="${card['F圖示']}"></i>
                ${card['E按鈕文字']}
            </a>
        </div>
    `).join('');
}

/**
 * 渲染常見問題 FAQ
 */
function renderFAQ(data) {
    if (!data) return;
    
    const faqGrid = document.querySelector('.faq-grid');
    if (!faqGrid) return;
    
    const sortedFAQs = data.sort((a, b) => 
        parseInt(a['E排序'] || 0) - parseInt(b['E排序'] || 0)
    );
    
    faqGrid.innerHTML = sortedFAQs.map(faq => {
        const pcSteps = (faq['C答案_電腦版'] || '').split('\\n').filter(s => s);
        const mobileSteps = (faq['D答案_手機版'] || '').split('\\n').filter(s => s);
        
        return `
            <div class="faq-card">
                <h3>${faq['B問題標題']}</h3>
                <div class="faq-content">
                    <h4>〔電腦版〕</h4>
                    <ul>${pcSteps.map(step => `<li>${step}</li>`).join('')}</ul>
                    ${mobileSteps.length > 0 ? `
                        <h4>〔手機版〕</h4>
                        <ul>${mobileSteps.map(step => `<li>${step}</li>`).join('')}</ul>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * 渲染頁尾資訊
 */
function renderFooter(data) {
    if (!data) return;
    
    const footer = document.querySelector('.footer .container');
    if (!footer) return;
    
    const footerData = {};
    data.forEach(item => {
        footerData[item['A欄位名稱']] = item['B內容'];
    });
    
    footer.innerHTML = `
        <p>${footerData['版權文字'] || '© 2025 華地產鑽石分會 | 付出者收穫 · 共好利他'}</p>
        <p class="footer-note">${footerData['製作者資訊'] || '本系統由 資訊長 蔡濬瑒 提供'} ${footerData['版本號'] || 'v3.1'}</p>
    `;
}

// ==================== 初始化函數 ====================

/**
 * 初始化首頁 (index.html)
 * 優化版：只載入 Zoom 會議室，其他使用靜態內容
 */
async function initIndexPage() {
    console.log('🚀 初始化首頁（僅載入 Zoom 會議室）...');
    
    try {
        const data = await loadAllData();
        
        // 只渲染 Zoom 會議室
        renderZoomRooms(data.ZOOM_ROOMS);
        
        console.log('✅ Zoom 會議室載入完成');
    } catch (error) {
        console.error('❌ Zoom 會議室載入失敗:', error);
        console.warn('⚠️ 將使用網頁原有的靜態內容');
    }
}

/**
 * 🚀 優化：快速載入活動數據（只載入活動相關的數據）
 * 這是關鍵優化：只載入活動數據可以大幅減少API回應時間
 */
async function loadInviteEventDataFast() {
    console.log('⚡ 快速載入活動數據...');
    
    try {
        // 優先從快取讀取
        if (isCacheValid() && dataCache.data && dataCache.data.INVITE_EVENT) {
            console.log('⚡ 從記憶體快取載入活動數據（極速）');
            return dataCache.data.INVITE_EVENT;
        }
        
        // 檢查 localStorage
        const persistentData = loadPersistentCache();
        if (persistentData && persistentData.INVITE_EVENT) {
            console.log('⚡ 從 localStorage 載入活動數據（快速）');
            return persistentData.INVITE_EVENT;
        }
        
        // 🚀 關鍵優化：只載入活動數據（而不是全部數據），大幅減少API回應時間
        console.log('⚡ 從API載入活動數據（僅載入活動工作表）');
        const eventData = await loadSheetData('INVITE_EVENT');
        
        // 如果載入成功，更新快取（以便下次使用）
        if (eventData) {
            // 更新記憶體快取中的活動數據
            if (dataCache.data) {
                dataCache.data.INVITE_EVENT = eventData;
            }
            // 更新 localStorage（如果有的話）
            const existingCache = loadPersistentCache();
            if (existingCache) {
                existingCache.INVITE_EVENT = eventData;
                savePersistentCache(existingCache);
            }
        }
        
        return eventData;
    } catch (error) {
        console.error('❌ 快速載入活動數據失敗:', error);
        return null;
    }
}

/**
 * 🚀 優化：快速提取圖片URL並立即開始載入（不等待完整數據）
 */
function extractAndPreloadImages(eventData) {
    if (!eventData || !Array.isArray(eventData) || eventData.length === 0) return;
    
    try {
        // 快速選擇活動（簡化版，不需要完整邏輯）
        const validEvents = eventData
            .filter(event => event['C活動日期'])
            .sort((a, b) => {
                const dateA = new Date(a['C活動日期']);
                const dateB = new Date(b['C活動日期']);
                return dateB - dateA; // 最新的在前
            });
        
        const event = validEvents[0] || eventData[0];
        
        const image1Url = event['E圖片1網址'];
        const image2Url = event['F圖片2網址'];
        
        if (image1Url && image2Url) {
            // 立即開始預載入圖片
            preloadImagesImmediately(image1Url, image2Url);
            console.log('⚡ 已從API回應中提取圖片URL並立即開始載入');
        }
    } catch (error) {
        console.warn('⚠️ 快速提取圖片URL失敗:', error);
    }
}

/**
 * 初始化邀請頁 (invite.html)
 * 🚀 優化：先顯示快取的圖片，再更新最新數據，並立即開始載入新圖片
 */
async function initInvitePage() {
    console.log('🚀 初始化邀請頁（活動信息 + CTA按鈕）...');
    
    // 🚀 優化：立即嘗試從快取顯示圖片
    try {
        const cachedData = loadPersistentCache();
        if (cachedData && cachedData.INVITE_EVENT) {
            console.log('⚡ 立即顯示快取的活動數據');
            renderInviteEvent(cachedData.INVITE_EVENT);
        }
    } catch (error) {
        console.warn('⚠️ 無法從快取載入，將等待 API 回應');
    }
    
    try {
        // 🚀 優化：優先快速載入活動數據，一旦獲取就立即開始預載入圖片
        const fastEventPromise = loadInviteEventDataFast().then(data => {
            if (data) {
                // 立即提取圖片URL並開始載入（不等待完整渲染）
                extractAndPreloadImages(data);
                return data;
            }
            return null;
        });
        
        // 並行載入所有數據和快速載入活動數據
        const [allData, fastEventData] = await Promise.allSettled([
            loadAllData(),
            fastEventPromise
        ]);
        
        // 優先使用快速載入的數據（如果成功）
        if (fastEventData.status === 'fulfilled' && fastEventData.value) {
            console.log('⚡ 使用快速載入的活動數據');
            renderInviteEvent(fastEventData.value);
        } else if (allData.status === 'fulfilled' && allData.value) {
            // 如果快速載入失敗，使用完整數據
            if (allData.value.INVITE_EVENT) {
                // 確保圖片已開始預載入
                extractAndPreloadImages(allData.value.INVITE_EVENT);
                renderInviteEvent(allData.value.INVITE_EVENT);
            }
        }
        
        // 更新CTA按鈕連結
        if (allData.status === 'fulfilled' && allData.value && allData.value.INVITE_CTA) {
            updateInviteCTAButtons(allData.value.INVITE_CTA);
        }
        
        console.log('🎉 邀請頁動態內容加載完成');
    } catch (error) {
        console.error('❌ 邀請頁加載失敗:', error);
        console.warn('⚠️ 將使用預設連結');
    }
}

/**
 * 渲染 Invite Hero 區塊
 */
function renderInviteHero(data) {
    if (!data) return;
    
    const heroData = {};
    data.forEach(item => {
        heroData[item['A欄位名稱']] = item['B內容'];
    });
    
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    const container = hero.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <h1>
                <span class="bni-text">${heroData['主標題_BNI'] || 'BNI'}</span>
                <span class="huadi-text">${heroData['主標題_華地產'] || '華地產'}</span>
                <span class="online-text">${heroData['主標題_線上'] || '線上'}</span>
                <span class="diamond-text">${heroData['主標題_鑽石'] || '鑽石'}</span>
                <span class="chapter-text">${heroData['主標題_分會'] || '分會'}</span>
            </h1>
            <p class="subtitle">
                ${heroData['副標題_第1行'] || '全台唯一'}<span class="highlight-text">${heroData['副標題_高亮1'] || '房地產主題式'}</span> ${heroData['副標題_第2行'] || 'BNI 分會'}<br class="mobile-break">
                ${heroData['副標題_第3行'] || '新分會會員成長速度'}<span class="highlight-text">${heroData['副標題_高亮2'] || '全球前10名'}</span>
            </p>
            <a href="${heroData['CTA按鈕連結'] || '#'}" class="cta-button pulse" target="_blank">
                ${heroData['CTA按鈕文字'] || '🚀 加入高速成長的頂尖分會'}
            </a>
        `;
    }
}

/**
 * 🎯 自動選擇要顯示的活動（週四 09:00 後自動切換到下週）
 */
function getActiveEvent(events) {
    if (!events || events.length === 0) return null;
    
    const now = new Date();
    const currentDay = now.getDay(); // 0=週日, 4=週四
    const currentHour = now.getHours();
    
    // 過濾出有效的活動（有日期的）
    const validEvents = events
        .filter(event => event['C活動日期'])
        .map(event => {
            const eventDate = new Date(event['C活動日期']);
            return { ...event, eventDate };
        })
        .sort((a, b) => a.eventDate - b.eventDate); // 按日期排序
    
    if (validEvents.length === 0) return events[0]; // 沒有日期就顯示第一筆
    
    // 判斷是否已過本週四 09:00
    let cutoffDate = new Date(now);
    
    if (currentDay === 4) { // 今天是週四
        if (currentHour >= 9) {
            // 已過今天 09:00，找下週四
            cutoffDate.setDate(cutoffDate.getDate() + 7);
        }
    } else if (currentDay > 4 || currentDay === 0) {
        // 週五、週六、週日，找下週四
        const daysUntilNextThursday = currentDay === 0 ? 4 : (11 - currentDay);
        cutoffDate.setDate(cutoffDate.getDate() + daysUntilNextThursday);
    } else {
        // 週一到週三，找本週四
        const daysUntilThursday = 4 - currentDay;
        cutoffDate.setDate(cutoffDate.getDate() + daysUntilThursday);
    }
    
    cutoffDate.setHours(0, 0, 0, 0); // 重置為當天 00:00
    
    // 找出 >= cutoffDate 的最近一筆活動
    const upcomingEvent = validEvents.find(event => event.eventDate >= cutoffDate);
    
    if (upcomingEvent) {
        console.log('📅 顯示活動:', upcomingEvent['B活動標題'], '日期:', upcomingEvent['C活動日期']);
        return upcomingEvent;
    }
    
    // 如果沒有未來的活動，顯示最後一筆
    console.log('⚠️ 沒有未來活動，顯示最後一筆');
    return validEvents[validEvents.length - 1];
}

/**
 * 🚀 優化：立即預載入圖片（一旦獲取URL就開始載入，不等待DOM）
 */
function preloadImagesImmediately(image1Url, image2Url) {
    if (!image1Url || !image2Url) return;
    
    // 方法1: 使用 Image 對象立即開始載入（最快）
    const img1 = new Image();
    img1.src = image1Url;
    img1.decode().catch(() => {}); // 非阻塞解碼
    
    const img2 = new Image();
    img2.src = image2Url;
    img2.decode().catch(() => {}); // 非阻塞解碼
    
    // 方法2: 使用 preload 連結（瀏覽器優先級更高）
    if (document.head) {
        const link1 = document.createElement('link');
        link1.rel = 'preload';
        link1.as = 'image';
        link1.href = image1Url;
        link1.fetchPriority = 'high';
        document.head.appendChild(link1);
        
        const link2 = document.createElement('link');
        link2.rel = 'preload';
        link2.as = 'image';
        link2.href = image2Url;
        link2.fetchPriority = 'high';
        document.head.appendChild(link2);
    }
    
    console.log('⚡ 已立即開始預載入圖片');
}

/**
 * 渲染 Invite 活動展示（支援自動切換）
 * 🚀 優化：立即使用快取的圖片 URL，然後更新為最新數據
 */
function renderInviteEvent(data) {
    if (!data || data.length === 0) return;
    
    // 🎯 自動選擇要顯示的活動
    const event = getActiveEvent(data);
    if (!event) return;
    
    // 檢查圖片URL是否存在（優先提取URL以便立即載入）
    let image1Url = event['E圖片1網址'];
    let image2Url = event['F圖片2網址'];
    
    // 🚀 優化：如果 URL 缺失，嘗試從快取獲取
    if (!image1Url || !image2Url) {
        const cachedUrls = getCachedImageUrls();
        if (cachedUrls) {
            console.log('⚡ 使用快取的圖片 URL');
            image1Url = image1Url || cachedUrls.image1;
            image2Url = image2Url || cachedUrls.image2;
        }
    }
    
    if (!image1Url || !image2Url) {
        console.warn('⚠️ 活動圖片URL缺失，無法顯示');
        return;
    }
    
    // 🚀 優化：立即開始預載入圖片（在渲染之前）
    preloadImagesImmediately(image1Url, image2Url);
    
    // 🚀 優化：立即儲存圖片 URL 到快取
    saveImageUrlsToCache(image1Url, image2Url);
    
    const eventHeader = document.querySelector('.event-header');
    
    if (eventHeader) {
        const title = eventHeader.querySelector('.section-title');
        if (title) title.textContent = event['B活動標題'] || '';
        
        const dateText = eventHeader.querySelector('.date-text');
        if (dateText) dateText.textContent = event['D活動副標題'] || '';
    }
    
    const eventGrid = document.querySelector('.event-grid');
    if (!eventGrid) return;
    
    // 轉義URL中的特殊字符，避免HTML注入和路徑問題
    const escapeHtml = (str) => {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };
    
    // 為 onclick 準備安全編碼的URL（需要特殊處理單引號）
    const escapeForOnclick = (str) => {
        if (!str) return '';
        return str.replace(/'/g, "\\'").replace(/\\/g, '\\\\');
    };
    
    // 轉義後的URL（用於src屬性）
    const image1Escaped = escapeHtml(image1Url);
    const image2Escaped = escapeHtml(image2Url);
    
    // 用於onclick的URL（需要不同的轉義）
    const image1ForClick = escapeForOnclick(image1Url);
    const image2ForClick = escapeForOnclick(image2Url);
    
    // 占位圖（圖片載入失敗時顯示）
    const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lm77niYfliqDovb3lpLHotKU8L3RleHQ+PC9zdmc+';
    
    // 🚀 立即移除骨架屏並顯示圖片容器（避免一直轉圈）
    eventGrid.classList.add('content-loaded');
    
    // 🚀 優化：插入圖片HTML（骨架屏會被 innerHTML 替換）
    // 圖片已經在 preloadImagesImmediately 中開始載入了，這裡直接顯示
    eventGrid.innerHTML = `
        <div class="event-card" onclick="openModal('${image1ForClick}')">
            <img src="${image1Escaped}" alt="專講預告 1" class="event-image" 
                 fetchpriority="high"
                 decoding="async"
                 loading="eager"
                 onload="this.classList.add('loaded');"
                 onerror="this.onerror=null; this.src='${placeholderImage}'; this.classList.add('loaded'); console.error('❌ 圖片1載入失敗');">
            <div class="event-overlay">
                <span class="event-icon">🔍</span>
                <p>點擊放大</p>
            </div>
        </div>
        <div class="event-card" onclick="openModal('${image2ForClick}')">
            <img src="${image2Escaped}" alt="專講預告 2" class="event-image" 
                 fetchpriority="high"
                 decoding="async"
                 loading="eager"
                 onload="this.classList.add('loaded');"
                 onerror="this.onerror=null; this.src='${placeholderImage}'; this.classList.add('loaded'); console.error('❌ 圖片2載入失敗');">
            <div class="event-overlay">
                <span class="event-icon">🔍</span>
                <p>點擊放大</p>
            </div>
        </div>
    `;
    
    // 🚀 監聽圖片載入狀態（用於調試和日誌）
    const images = eventGrid.querySelectorAll('.event-image');
    let loadedCount = 0;
    const totalImages = images.length;
    
    images.forEach((img, index) => {
        // 如果圖片已經載入完成（從快取）
        if (img.complete && img.naturalHeight !== 0) {
            loadedCount++;
            img.classList.add('loaded'); // 🚀 優化：標記為已載入
            const imageUrl = index === 0 ? image1Url : image2Url;
            console.log(`✅ 圖片${index + 1}已載入（快取）: ${imageUrl}`);
        } else {
            // 🚀 優化：使用 load 事件，載入完成後標記
            img.addEventListener('load', () => {
                loadedCount++;
                img.classList.add('loaded'); // 標記為已載入，觸發漸入動畫
                console.log(`✅ 圖片${index + 1}載入完成`);
                
                // 所有圖片載入完成後記錄
                if (loadedCount === totalImages) {
                    console.log('🎉 所有活動圖片載入完成');
                    // 🚀 優化：確保骨架屏完全移除
                    eventGrid.classList.add('content-loaded');
                }
            }, { once: true }); // 🚀 優化：只監聽一次，避免重複觸發
            
            // 監聽載入錯誤
            img.addEventListener('error', () => {
                console.error(`❌ 圖片${index + 1}載入失敗`);
                img.classList.add('loaded'); // 即使失敗也顯示
                // 即使失敗也計入，避免一直等待
                loadedCount++;
                
                if (loadedCount === totalImages) {
                    console.warn('⚠️ 部分圖片載入失敗，已顯示占位圖');
                    // 🚀 優化：確保骨架屏完全移除
                    eventGrid.classList.add('content-loaded');
                }
            }, { once: true });
        }
    });
    
    // 如果所有圖片都已載入（從快取），記錄日誌
    if (loadedCount === totalImages) {
        console.log('⚡ 所有圖片已從快取載入');
    }
    
    // 設置超時保護：10秒後記錄警告（骨架屏已移除，只是記錄狀態）
    setTimeout(() => {
        if (loadedCount < totalImages) {
            console.warn('⏰ 部分圖片載入時間較長（超過10秒）');
        }
    }, 10000);
    
    // 💡 在控制台顯示當前顯示的活動資訊
    console.log('✅ 當前顯示活動:', {
        標題: event['B活動標題'],
        日期: event['C活動日期'],
        副標題: event['D活動副標題'],
        圖片1: image1Url,
        圖片2: image2Url
    });
}

/**
 * 渲染 Invite 特色資源
 */
function renderInviteFeatures(data) {
    if (!data) return;
    
    const featuresGrid = document.querySelector('.features-grid');
    if (!featuresGrid) return;
    
    const sortedFeatures = data.sort((a, b) => 
        parseInt(a['E排序'] || 0) - parseInt(b['E排序'] || 0)
    );
    
    featuresGrid.innerHTML = sortedFeatures.map(feature => `
        <div class="feature-card">
            <div class="feature-icon">${feature['B圖示']}</div>
            <h3>${feature['C標題']}</h3>
            <p>${feature['D描述']}</p>
        </div>
    `).join('');
}

/**
 * 渲染 Invite 資源分類
 */
function renderInviteCategories(data) {
    if (!data) return;
    
    const resourcesGrid = document.querySelector('.resources-showcase .resources-grid');
    if (!resourcesGrid) return;
    
    const sortedCategories = data.sort((a, b) => 
        parseInt(a['I排序'] || 0) - parseInt(b['I排序'] || 0)
    );
    
    resourcesGrid.innerHTML = sortedCategories.map(category => {
        const items = [
            category['D項目1'],
            category['E項目2'],
            category['F項目3'],
            category['G項目4'],
            category['H項目5']
        ].filter(item => item);
        
        return `
            <div class="resource-category">
                <h3>${category['B分類圖示']} ${category['C分類標題']}</h3>
                <ul>
                    ${items.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `;
    }).join('');
}

/**
 * 渲染 Invite 優勢說明
 */
function renderInviteBenefits(data) {
    if (!data) return;
    
    const benefitsData = {};
    data.forEach(item => {
        benefitsData[item['A欄位名稱']] = item['B內容'];
    });
    
    const benefitsContent = document.querySelector('.benefits-content');
    if (!benefitsContent) return;
    
    benefitsContent.innerHTML = `
        <div class="benefits-text">
            <h2>${benefitsData['區塊標題'] || '系統化的商務合作模式'}</h2>
            <div style="text-align: center; margin-bottom: 30px;">
                <a href="${benefitsData['新聞連結網址'] || '#'}" 
                   target="_blank" 
                   style="display: inline-block; background: linear-gradient(45deg, #ff6b6b, #ffa500); color: white; padding: 12px 25px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3); transition: all 0.3s ease; text-align: center; line-height: 1.4;">
                    ${benefitsData['新聞連結標題'] || '📰 雅虎新聞報導'}
                </a>
            </div>
            <ul class="benefits-list">
                <li>${benefitsData['優勢列表_1'] || ''}</li>
                <li>${benefitsData['優勢列表_2'] || ''}</li>
                <li>${benefitsData['優勢列表_3'] || ''}</li>
                <li>${benefitsData['優勢列表_4'] || ''}</li>
                <li>${benefitsData['優勢列表_5'] || ''}</li>
                <li>${benefitsData['優勢列表_6'] || ''}</li>
            </ul>
        </div>
        <div class="highlight-box">
            <h3>${benefitsData['適合對象_標題'] || '🎯 適合對象'}</h3>
            <p style="margin-top: 20px; font-size: 1.1rem; line-height: 1.8;">
                ${benefitsData['適合對象_1'] || ''}<br><br>
                ${benefitsData['適合對象_2'] || ''}<br><br>
                ${benefitsData['適合對象_3'] || ''}
            </p>
        </div>
    `;
}

/**
 * 更新邀請頁CTA按鈕連結（簡化版，只更新連結不動其他內容）
 */
function updateInviteCTAButtons(data) {
    if (!data || data.length === 0) return;
    
    const ctaData = {};
    data.forEach(item => {
        ctaData[item['A欄位名稱']] = item['B內容'];
    });
    
    const ctaLink = ctaData['CTA按鈕連結'];
    
    if (!ctaLink) return;
    
    // 更新頂部按鈕
    const heroButton = document.getElementById('hero-cta-button');
    if (heroButton) {
        heroButton.href = ctaLink;
        console.log('✅ 已更新頂部CTA按鈕連結');
    }
    
    // 更新底部按鈕
    const bottomButton = document.getElementById('bottom-cta-button');
    if (bottomButton) {
        bottomButton.href = ctaLink;
        console.log('✅ 已更新底部CTA按鈕連結');
    }
}

/**
 * 渲染 Invite CTA 區塊（完整版，保留以備不時之需）
 */
function renderInviteCTA(data) {
    if (!data) return;
    
    const ctaData = {};
    data.forEach(item => {
        ctaData[item['A欄位名稱']] = item['B內容'];
    });
    
    const ctaSection = document.querySelector('.cta-section');
    if (!ctaSection) return;
    
    const container = ctaSection.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <h2>${ctaData['主標題'] || ''}</h2>
            <p>${ctaData['副標題'] || ''}</p>
            <a href="${ctaData['CTA按鈕連結'] || '#'}" class="cta-button" target="_blank" id="bottom-cta-button">
                ${ctaData['CTA按鈕文字'] || '📝 立即填寫報名表單'}
            </a>
            <p style="margin-top: 30px; font-size: 1rem; opacity: 0.8;">
                ${ctaData['補充說明'] || ''}
            </p>
        `;
    }
}


/**
 * 手動重新載入資料
 */
async function refreshData() {
    console.log('🔄 重新載入資料...');
    clearCache();
    hasInitialized = false; // 重置初始化標記
    
    if (window.location.pathname.includes('invite')) {
        await initInvitePage();
    } else {
        await initIndexPage();
    }
    
    console.log('✅ 完成');
}

// ==================== 工具函數 ====================

/**
 * 複製會議ID
 */
window.copyMeetingId = function(meetingId) {
    navigator.clipboard.writeText(meetingId).then(() => {
        alert('✅ 會議ID已複製: ' + meetingId);
    }).catch(err => {
        console.error('複製失敗:', err);
    });
};

// ==================== 匯出 ====================

window.SheetsDataLoader = {
    loadAllData,
    loadSheetData,
    refreshData,
    getAPIVersion,
    clearCache,
    initIndexPage,
    initInvitePage
};

// ==================== 自動初始化 ====================

// 🚀 優化：提前開始載入數據（不等待 DOMContentLoaded）
// 對於邀請頁，立即嘗試顯示快取的圖片
(function() {
    if (typeof window === 'undefined') return;
    
    const isInvitePage = window.location.pathname.includes('invite');
    
    if (isInvitePage) {
        // 🚀 立即嘗試從快取顯示圖片（不需要等待 DOM）
        try {
            const cachedUrls = getCachedImageUrls();
            if (cachedUrls && cachedUrls.image1 && cachedUrls.image2) {
                // 在 DOM 準備好之前就開始預載入圖片
                const link1 = document.createElement('link');
                link1.rel = 'prefetch';
                link1.as = 'image';
                link1.href = cachedUrls.image1;
                document.head.appendChild(link1);
                
                const link2 = document.createElement('link');
                link2.rel = 'prefetch';
                link2.as = 'image';
                link2.href = cachedUrls.image2;
                document.head.appendChild(link2);
                
                console.log('⚡ 已開始預載入快取的圖片');
            }
        } catch (error) {
            // 忽略錯誤，繼續正常流程
        }
    }
})();

// 使用 DOMContentLoaded 進行完整的初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 防止重複初始化
    if (isInitializing || hasInitialized) {
        console.log('⏭️ 已經初始化過了，跳過');
        return;
    }
    
    isInitializing = true;
    
    console.log('📄 初始化 Google Sheets 資料系統...');
    
    // 🚀 移除延遲，立即載入以提升速度
    // await new Promise(resolve => setTimeout(resolve, 100)); // 已移除
    
    try {
        const isInvitePage = window.location.pathname.includes('invite');
        
        if (isInvitePage) {
            await initInvitePage();
        } else {
            await initIndexPage();
        }
        
        hasInitialized = true;
        
        // 🚀 優化：移除加載進度條（減少時間以更快移除）
        setTimeout(() => {
            const loadingBar = document.getElementById('loading-bar');
            if (loadingBar) {
                loadingBar.style.display = 'none';
            }
        }, 1500); // 從2000ms減少到1500ms
        
    } catch (error) {
        console.error('❌ 初始化失敗:', error);
        console.error('錯誤詳情:', error.stack);
        
        // 加載失敗也移除進度條
        const loadingBar = document.getElementById('loading-bar');
        if (loadingBar) {
            loadingBar.style.background = 'linear-gradient(90deg, #ff6b6b, #ff4757)';
            setTimeout(() => loadingBar.style.display = 'none', 2000);
        }
    } finally {
        isInitializing = false;
    }
});


