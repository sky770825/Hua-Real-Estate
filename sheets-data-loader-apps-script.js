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
    
    // 🚀 更積極的快取策略
    cacheEnabled: true,
    cacheDuration: 2 * 60 * 60 * 1000, // 2 小時快取（大幅延長）
    
    // 最小刷新間隔（防止短時間內重複載入）
    minRefreshInterval: 2 * 1000, // 2 秒（進一步降低）
    
    // 使用 localStorage 持久化快取
    usePersistentCache: true,
    localStorageKey: 'huadi_sheets_cache',
    
    // 🚀 網路優化設定
    requestTimeout: 10000, // 10 秒超時
    maxRetries: 3, // 最大重試次數
    retryDelay: 1000, // 重試延遲 1 秒
    
    // 🚀 並行載入設定
    enableParallelLoading: true,
    maxConcurrentRequests: 3
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
 * 🚀 優化的網路請求函數（支援超時、重試、並行）
 */
async function fetchWithRetry(url, options = {}, retryCount = 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), APPS_SCRIPT_CONFIG.requestTimeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            // 🚀 添加請求優化標頭
            headers: {
                'Cache-Control': 'max-age=7200', // 2小時快取
                'Accept': 'application/json',
                ...options.headers
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        
        // 如果是網路錯誤且還有重試次數，則重試
        if (retryCount < APPS_SCRIPT_CONFIG.maxRetries && 
            (error.name === 'AbortError' || error.message.includes('fetch'))) {
            
            console.warn(`⚠️ 請求失敗，${APPS_SCRIPT_CONFIG.retryDelay}ms 後重試 (${retryCount + 1}/${APPS_SCRIPT_CONFIG.maxRetries}):`, error.message);
            
            await new Promise(resolve => setTimeout(resolve, APPS_SCRIPT_CONFIG.retryDelay * (retryCount + 1)));
            return fetchWithRetry(url, options, retryCount + 1);
        }
        
        throw error;
    }
}

/**
 * 從 Apps Script API 讀取所有資料
 */
async function loadAllData(forceRefresh = false) {
    // 🚀 優先檢查記憶體快取
    if (!forceRefresh && isCacheValid()) {
        console.log('⚡ 使用記憶體快取資料（極速載入）');
        return dataCache.data;
    }
    
    // 🚀 再檢查 localStorage 快取
    if (!forceRefresh) {
        const persistentData = loadPersistentCache();
        if (persistentData) {
            console.log('💾 使用 localStorage 快取資料（快速載入）');
            // 同時更新記憶體快取
            dataCache.data = persistentData;
            dataCache.timestamp = Date.now();
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
        
        // 🚀 使用優化的請求函數
        console.log('📡 請求 URL:', url.toString());
        const response = await fetchWithRetry(url.toString());
        const result = await response.json();
        
        console.log('📊 API 回應:', result);
        
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
        
        // 🚀 如果網路請求失敗，嘗試返回舊快取
        if (dataCache.data) {
            console.log('🔄 網路請求失敗，使用舊快取資料');
            return dataCache.data;
        }
        
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
        await initIndexPageWithData(data);
    } catch (error) {
        console.error('❌ Zoom 會議室載入失敗:', error);
        console.warn('⚠️ 將使用網頁原有的靜態內容');
    }
}

/**
 * 🚀 使用預載入資料初始化首頁
 */
async function initIndexPageWithData(data) {
    console.log('🚀 使用預載入資料初始化首頁...');
    
    if (data) {
        // 只渲染 Zoom 會議室
        renderZoomRooms(data.ZOOM_ROOMS);
    }
    
    console.log('✅ Zoom 會議室載入完成');
}

/**
 * 初始化邀請頁 (invite.html)
 */
async function initInvitePage() {
    console.log('🚀 初始化邀請頁（活動信息 + CTA按鈕）...');
    
    try {
        const data = await loadAllData();
        await initInvitePageWithData(data);
    } catch (error) {
        console.error('❌ 邀請頁加載失敗:', error);
        console.warn('⚠️ 將使用預設連結');
    }
}

/**
 * 🚀 使用預載入資料初始化邀請頁
 */
async function initInvitePageWithData(data) {
    console.log('🚀 使用預載入資料初始化邀請頁...');
    console.log('📊 接收到的資料結構:', data);
    
    if (data) {
        // 🔍 除錯：顯示所有可用的資料鍵
        console.log('📋 可用的資料鍵:', Object.keys(data));
        
        // 嘗試不同的資料結構
        let eventData = null;
        
        // 檢查不同的可能資料結構
        if (data.INVITE_EVENT) {
            eventData = data.INVITE_EVENT;
            console.log('✅ 找到 INVITE_EVENT 資料');
        } else if (data['活動展示']) {
            eventData = data['活動展示'];
            console.log('✅ 找到 活動展示 資料');
        } else if (data['INVITE_EVENT']) {
            eventData = data['INVITE_EVENT'];
            console.log('✅ 找到 INVITE_EVENT 資料（字串鍵）');
        } else if (data['Invite頁_活動展示']) {
            eventData = data['Invite頁_活動展示'];
            console.log('✅ 找到 Invite頁_活動展示 資料');
        } else if (data['Invite頁_活動展示']) {
            eventData = data['Invite頁_活動展示'];
            console.log('✅ 找到 Invite頁_活動展示 資料（字串鍵）');
        } else {
            console.warn('⚠️ 未找到活動資料，嘗試使用所有資料');
            // 如果找不到特定鍵，嘗試使用整個資料
            eventData = data;
        }
        
        console.log('🎯 將使用的活動資料:', eventData);
        
        // 渲染活動展示區塊（標題、副標題、圖片）
        renderInviteEvent(eventData);
        
        // 更新CTA按鈕連結
        if (data.INVITE_CTA || data['CTA按鈕']) {
            updateInviteCTAButtons(data.INVITE_CTA || data['CTA按鈕']);
        }
    } else {
        console.warn('⚠️ 沒有接收到資料');
    }
    
    console.log('🎉 邀請頁動態內容加載完成');
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
    
    console.log('🔍 開始篩選活動，總共', events.length, '筆資料');
    
    const now = new Date();
    const currentDay = now.getDay(); // 0=週日, 4=週四
    const currentHour = now.getHours();
    
    // 過濾出有效的活動（有標題、日期和圖片的）
    const validEvents = events
        .filter(event => {
            const hasTitle = event['B活動標題'] || event['活動標題'];
            const hasDate = event['C活動日期'] || event['活動日期'];
            const hasImage1 = event['E圖片1網址'] || event['圖片1網址'];
            const hasImage2 = event['F圖片2網址'] || event['圖片2網址'];
            
            console.log('📋 檢查活動:', {
                標題: hasTitle,
                日期: hasDate,
                圖片1: hasImage1,
                圖片2: hasImage2
            });
            
            return hasTitle && hasDate && hasImage1 && hasImage2;
        })
        .map(event => {
            const eventDateStr = event['C活動日期'] || event['活動日期'];
            const eventDate = new Date(eventDateStr);
            console.log('📅 解析日期:', eventDateStr, '->', eventDate.toISOString().split('T')[0]);
            return { ...event, eventDate };
        })
        .sort((a, b) => a.eventDate - b.eventDate); // 按日期排序
    
    console.log('✅ 有效活動數量:', validEvents.length);
    
    if (validEvents.length === 0) {
        console.warn('⚠️ 沒有有效活動，返回第一筆資料');
        return events[0]; // 沒有有效活動就顯示第一筆
    }
    
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
    
    console.log('📅 今天日期:', now.toISOString().split('T')[0]);
    console.log('📅 截止日期:', cutoffDate.toISOString().split('T')[0]);
    
    // 找出 >= cutoffDate 的最近一筆活動
    const upcomingEvent = validEvents.find(event => event.eventDate >= cutoffDate);
    
    if (upcomingEvent) {
        console.log('✅ 找到未來活動:', upcomingEvent['B活動標題'] || upcomingEvent['活動標題'], '日期:', upcomingEvent['C活動日期'] || upcomingEvent['活動日期']);
        return upcomingEvent;
    }
    
    // 如果沒有未來的活動，顯示最後一筆
    console.log('⚠️ 沒有未來活動，顯示最後一筆');
    return validEvents[validEvents.length - 1];
}

/**
 * 渲染 Invite 活動展示（支援自動切換）
 */
function renderInviteEvent(data) {
    console.log('🎨 開始渲染活動展示...');
    console.log('📊 活動資料:', data);
    
    if (!data) {
        console.warn('⚠️ 沒有活動資料');
        return;
    }
    
    if (Array.isArray(data) && data.length === 0) {
        console.warn('⚠️ 活動資料陣列為空');
        return;
    }
    
    // 🎯 自動選擇要顯示的活動
    const event = getActiveEvent(data);
    console.log('🎯 選擇的活動:', event);
    
    if (!event) {
        console.warn('⚠️ 沒有找到有效的活動');
        return;
    }
    
    const eventHeader = document.querySelector('.event-header');
    
    if (eventHeader) {
        const title = eventHeader.querySelector('.section-title');
        if (title) {
            title.textContent = event['B活動標題'] || event['活動標題'] || '華地產早會雙專講同台';
            console.log('📝 設定標題:', title.textContent);
        }
        
        const dateText = eventHeader.querySelector('.date-text');
        if (dateText) {
            dateText.textContent = event['D活動副標題'] || event['活動副標題'] || '串連更多商機 共創合作未來';
            console.log('📅 設定副標題:', dateText.textContent);
        }
    }
    
    const eventGrid = document.querySelector('.event-grid');
    console.log('🖼️ 圖片網址檢查:');
    console.log('  圖片1:', event['E圖片1網址'] || event['圖片1網址']);
    console.log('  圖片2:', event['F圖片2網址'] || event['圖片2網址']);
    
    if (eventGrid) {
        const image1Url = event['E圖片1網址'] || event['圖片1網址'];
        const image2Url = event['F圖片2網址'] || event['圖片2網址'];
        
        if (image1Url && image2Url) {
            console.log('✅ 找到圖片網址，開始渲染...');
            
            // 🚀 移除骨架屏，顯示實際內容
            eventGrid.classList.add('content-loaded');
            
            // 🚀 優化圖片載入：預載入 + 進度顯示 + 錯誤處理
            eventGrid.innerHTML = `
                <div class="event-card" onclick="openModal('${image1Url}')">
                    <div class="image-container">
                        <img src="${image1Url}" alt="專講預告 1" class="event-image" 
                             loading="eager" 
                             onload="handleImageLoad(this)" 
                             onerror="handleImageError(this)"
                             style="opacity: 0; transition: opacity 0.3s ease;">
                        <div class="image-loading">
                            <div class="loading-spinner"></div>
                            <p>載入中...</p>
                        </div>
                    </div>
                    <div class="event-overlay">
                        <span class="event-icon">🔍</span>
                        <p>點擊放大</p>
                    </div>
                </div>
                <div class="event-card" onclick="openModal('${image2Url}')">
                    <div class="image-container">
                        <img src="${image2Url}" alt="專講預告 2" class="event-image" 
                             loading="eager" 
                             onload="handleImageLoad(this)" 
                             onerror="handleImageError(this)"
                             style="opacity: 0; transition: opacity 0.3s ease;">
                        <div class="image-loading">
                            <div class="loading-spinner"></div>
                            <p>載入中...</p>
                        </div>
                    </div>
                    <div class="event-overlay">
                        <span class="event-icon">🔍</span>
                        <p>點擊放大</p>
                    </div>
                </div>
            `;
            
            // 🚀 預載入圖片到快取
            preloadImages([image1Url, image2Url]);
            
            console.log('✅ 圖片渲染完成');
        } else {
            console.warn('⚠️ 缺少圖片網址，顯示預設內容');
            // 如果沒有圖片網址，顯示預設的骨架屏
            eventGrid.innerHTML = `
                <div class="skeleton skeleton-card" style="animation-delay: 0s;"></div>
                <div class="skeleton skeleton-card" style="animation-delay: 0.1s;"></div>
            `;
        }
        
        // 💡 在控制台顯示當前顯示的活動資訊
        console.log('✅ 當前顯示活動:', {
            標題: event['B活動標題'] || event['活動標題'],
            日期: event['C活動日期'] || event['活動日期'],
            副標題: event['D活動副標題'] || event['活動副標題']
        });
    } else {
        console.warn('⚠️ 找不到 event-grid 元素');
    }
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
 * 🚀 圖片載入優化函數
 */
// 圖片快取
const imageCache = new Map();

// 預載入圖片
function preloadImages(imageUrls) {
    imageUrls.forEach(url => {
        if (!imageCache.has(url)) {
            const img = new Image();
            img.onload = () => {
                imageCache.set(url, true);
                console.log(`✅ 圖片預載入完成: ${url}`);
            };
            img.onerror = () => {
                console.warn(`⚠️ 圖片預載入失敗: ${url}`);
            };
            img.src = url;
        }
    });
}

// 處理圖片載入完成
window.handleImageLoad = function(img) {
    const container = img.closest('.image-container');
    const loading = container.querySelector('.image-loading');
    
    // 淡入效果
    img.style.opacity = '1';
    
    // 隱藏載入動畫
    if (loading) {
        loading.style.opacity = '0';
        setTimeout(() => {
            loading.style.display = 'none';
        }, 300);
    }
    
    console.log('✅ 圖片載入完成:', img.src);
};

// 處理圖片載入錯誤
window.handleImageError = function(img) {
    const container = img.closest('.image-container');
    const loading = container.querySelector('.image-loading');
    
    // 顯示錯誤訊息
    if (loading) {
        loading.innerHTML = `
            <div style="color: #ff6b6b; text-align: center;">
                <p>⚠️ 圖片載入失敗</p>
                <button onclick="retryImageLoad(this)" style="background: #667eea; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                    重試
                </button>
            </div>
        `;
    }
    
    console.error('❌ 圖片載入失敗:', img.src);
};

// 重試載入圖片
window.retryImageLoad = function(button) {
    const container = button.closest('.image-container');
    const img = container.querySelector('.event-image');
    const loading = container.querySelector('.image-loading');
    
    // 重置載入狀態
    loading.innerHTML = `
        <div class="loading-spinner"></div>
        <p>重新載入中...</p>
    `;
    
    // 重新載入圖片
    const originalSrc = img.src;
    img.src = '';
    setTimeout(() => {
        img.src = originalSrc + '?retry=' + Date.now(); // 避免快取
    }, 100);
};

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

// 🚀 更積極的預載入策略
async function preloadCriticalData() {
    try {
        // 立即開始載入資料（不等待 DOM）
        console.log('🚀 開始預載入關鍵資料...');
        
        const isInvitePage = window.location.pathname.includes('invite');
        let data;
        
        // 嘗試從快取載入
        if (isCacheValid()) {
            data = dataCache.data;
            console.log('⚡ 使用現有快取資料');
        } else {
            const persistentData = loadPersistentCache();
            if (persistentData) {
                data = persistentData;
                console.log('💾 使用 localStorage 快取');
            }
        }
        
        // 如果沒有快取，開始網路請求
        if (!data) {
            console.log('📡 開始網路請求...');
            data = await loadAllData();
        }
        
        return { data, isInvitePage };
    } catch (error) {
        console.warn('⚠️ 預載入失敗，將在 DOM 載入後重試:', error);
        return null;
    }
}

// 🚀 立即開始預載入（不等待 DOM）
const preloadPromise = preloadCriticalData();

// 使用 DOMContentLoaded 更快開始載入（不等圖片等資源）
document.addEventListener('DOMContentLoaded', async () => {
    // 防止重複初始化
    if (isInitializing || hasInitialized) {
        console.log('⏭️ 已經初始化過了，跳過');
        return;
    }
    
    isInitializing = true;
    
    console.log('📄 初始化 Google Sheets 資料系統...');
    
    try {
        // 🚀 使用預載入的資料
        const preloadResult = await preloadPromise;
        
        if (preloadResult) {
            console.log('✅ 使用預載入資料，立即渲染');
            const { data, isInvitePage } = preloadResult;
            
            if (isInvitePage) {
                await initInvitePageWithData(data);
            } else {
                await initIndexPageWithData(data);
            }
        } else {
            // 如果預載入失敗，使用原本的方式
            console.log('🔄 預載入失敗，使用標準載入流程');
            const isInvitePage = window.location.pathname.includes('invite');
            
            if (isInvitePage) {
                await initInvitePage();
            } else {
                await initIndexPage();
            }
        }
        
        hasInitialized = true;
        
        // 移除加載進度條
        setTimeout(() => {
            const loadingBar = document.getElementById('loading-bar');
            if (loadingBar) {
                loadingBar.style.display = 'none';
            }
        }, 1000); // 縮短到 1 秒
        
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


