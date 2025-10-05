// 2025 Landing Page JavaScript - 現代化功能

// DOM 載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化應用程式
function initializeApp() {
    setupNavigation();
    setupScrollEffects();
    setupCountdown();
    setupBackToTop();
    setupContactButton();
    setupImageModal();
    setupScrollReveal();
    setupMobileOptimizations();
}

// 導航功能
function setupNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
    
    // 平滑滾動
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // 考慮導航欄高度
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 滾動效果
function setupScrollEffects() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        const scrollY = window.scrollY;
        
        // 導航欄背景透明度
        if (scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
}

// 倒數計時功能
function setupCountdown() {
    function updateCountdown() {
        const now = new Date();
        const nextThursday = getNextThursday(now);
        
        // 更新會議日期顯示
        const dateElement = document.getElementById('nextMeetingDate');
        const dateElementMini = document.getElementById('nextMeetingDate');
        
        if (dateElement) {
            dateElement.textContent = formatDate(nextThursday);
        }
        
        // 計算時間差
        const timeDiff = nextThursday.getTime() - now.getTime();
        
        if (timeDiff > 0) {
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            
            // 更新倒數計時顯示
            updateCountdownDisplay('days', days);
            updateCountdownDisplay('hours', hours);
            updateCountdownDisplay('minutes', minutes);
            updateCountdownDisplay('seconds', seconds);
            
            // 更新迷你倒數計時
            updateCountdownDisplay('daysMini', days);
            updateCountdownDisplay('hoursMini', hours);
        } else {
            // 如果時間已過，計算下一個週四
            const nextNextThursday = getNextThursday(new Date(nextThursday.getTime() + 7 * 24 * 60 * 60 * 1000));
            if (dateElement) {
                dateElement.textContent = formatDate(nextNextThursday);
            }
        }
    }
    
    // 立即執行一次
    updateCountdown();
    
    // 每秒更新
    setInterval(updateCountdown, 1000);
}

// 獲取下一個週四
function getNextThursday(date) {
    const dayOfWeek = date.getDay();
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
    const nextThursday = new Date(date);
    
    if (daysUntilThursday === 0) {
        // 如果今天是週四，檢查時間是否已過 07:00
        if (date.getHours() >= 7) {
            nextThursday.setDate(date.getDate() + 7);
        }
    } else {
        nextThursday.setDate(date.getDate() + daysUntilThursday);
    }
    
    nextThursday.setHours(7, 0, 0, 0);
    return nextThursday;
}

// 格式化日期
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[date.getDay()];
    
    return `${year}/${month}/${day} (週${weekday})`;
}

// 更新倒數計時顯示
function updateCountdownDisplay(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = String(value).padStart(2, '0');
    }
}

// 返回頂部按鈕
function setupBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 聯絡按鈕功能
function setupContactButton() {
    const contactBtn = document.getElementById('contactBtn');
    const toggleBtn = document.getElementById('toggleContactBtn');
    const toggleIcon = document.getElementById('toggleIcon');
    
    let isVisible = true;
    
    toggleBtn.addEventListener('click', function() {
        isVisible = !isVisible;
        
        if (isVisible) {
            contactBtn.style.display = 'flex';
            toggleIcon.className = 'fas fa-eye';
            toggleBtn.title = '隱藏聯絡按鈕';
        } else {
            contactBtn.style.display = 'none';
            toggleIcon.className = 'fas fa-eye-slash';
            toggleBtn.title = '顯示聯絡按鈕';
        }
    });
}

// 圖片模態框功能
function setupImageModal() {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    
    // 點擊模態框外部關閉
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeImageModal();
        }
    });
    
    // ESC 鍵關閉
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeImageModal();
        }
    });
}

// 開啟圖片模態框
function openImageModal(src, caption) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    
    modalImage.src = src;
    modalCaption.textContent = caption;
    modal.style.display = 'block';
    
    // 防止背景滾動
    document.body.style.overflow = 'hidden';
}

// 關閉圖片模態框
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
    
    // 恢復背景滾動
    document.body.style.overflow = 'auto';
}

// 滾動顯示動畫
function setupScrollReveal() {
    const revealElements = document.querySelectorAll('.scroll-reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    revealElements.forEach(element => {
        observer.observe(element);
    });
}

// 複製會議ID功能
function copyMeetingId() {
    const meetingId = '883 8417 6239';
    copyToClipboard(meetingId, '會議ID已複製到剪貼板！');
}

function copyHuaMeetingId() {
    const meetingId = '863 5853 7640';
    copyToClipboard(meetingId, '華地產會議ID已複製到剪貼板！');
}

// 複製邀請文字功能
function copyInviteText() {
    const inviteText = `哈囉，我真的很想約你來我們華地產看看！

這裡聚集了全台灣最專注在 包租代管、房地產產業的一群高手：

▋買房導客超強的 KOL
▋實戰經驗滿滿的買房老師
▋每月新增百案的包租代管龍頭
▋還有各種和建商、危老改建、房產行銷合作的夥伴

我們是【線上分會】，不需要五點起床、不用大老遠奔波，
你只要在家、打開電腦，就能一起參與這個強者雲集的圈子。

如果你對房地產有興趣，或正在經營這條路，
真的推薦你來感受一下這裡的氛圍。

📌 想參加的話，可以幫我填寫這份連結
🔗https://sky770825.github.io/Hua-Real-Estate/invite
我會幫你完成報名，並在線上等你一起來！`;

    copyToClipboard(inviteText, '邀請文字已複製到剪貼板！');
}

// 複製到剪貼板通用函數
function copyToClipboard(text, successMessage) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification(successMessage, 'success');
        }).catch(err => {
            console.error('複製失敗:', err);
            fallbackCopyTextToClipboard(text, successMessage);
        });
    } else {
        fallbackCopyTextToClipboard(text, successMessage);
    }
}

// 降級複製功能
function fallbackCopyTextToClipboard(text, successMessage) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification(successMessage, 'success');
        } else {
            showNotification('複製失敗，請手動複製', 'error');
        }
    } catch (err) {
        console.error('降級複製失敗:', err);
        showNotification('複製失敗，請手動複製', 'error');
    }
    
    document.body.removeChild(textArea);
}

// 顯示通知
function showNotification(message, type = 'success') {
    // 移除現有通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 創建新通知
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 顯示動畫
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // 自動隱藏
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 設定提醒功能
function setReminder() {
    const nextThursday = getNextThursday(new Date());
    const reminderTime = new Date(nextThursday);
    reminderTime.setHours(6, 30, 0, 0); // 提前30分鐘提醒
    
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            scheduleNotification(reminderTime);
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    scheduleNotification(reminderTime);
                }
            });
        }
    }
    
    showNotification('提醒已設定！', 'success');
}

// 排程通知
function scheduleNotification(reminderTime) {
    const now = new Date();
    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    if (timeUntilReminder > 0) {
        setTimeout(() => {
            new Notification('華地產鑽石分會會議提醒', {
                body: '會議將在15分鐘後開始，請準備參加！',
                icon: '/favicon.ico'
            });
        }, timeUntilReminder);
    }
}

// 手機版優化
function setupMobileOptimizations() {
    // 檢測觸控設備
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
        document.body.classList.add('touch-device');
        
        // 優化觸控事件
        const honorImages = document.querySelectorAll('.honor-image');
        honorImages.forEach(img => {
            img.addEventListener('touchstart', function(e) {
                e.preventDefault();
                this.style.transform = 'scale(0.95)';
            }, { passive: false });
            
            img.addEventListener('touchend', function(e) {
                e.preventDefault();
                this.style.transform = '';
            }, { passive: false });
        });
    }
    
    // 檢測LINE瀏覽器
    const isLineBrowser = /Line/i.test(navigator.userAgent);
    if (isLineBrowser) {
        document.body.classList.add('line-browser');
        
        // LINE瀏覽器特殊優化
        const honorImages = document.querySelectorAll('.honor-image');
        honorImages.forEach(img => {
            img.style.width = '100px';
            img.style.height = '100px';
            img.style.borderRadius = '50%';
            img.style.border = '4px solid #daa520';
            img.style.boxShadow = '0 4px 15px rgba(218, 165, 32, 0.4)';
        });
    }
}

// 性能優化：防抖函數
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 性能優化：節流函數
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 優化滾動事件
const optimizedScrollHandler = throttle(() => {
    const scrollY = window.scrollY;
    const navbar = document.querySelector('.navbar');
    const backToTopBtn = document.getElementById('back-to-top');
    
    // 導航欄效果
    if (scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
    
    // 返回頂部按鈕
    if (scrollY > 300) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }
}, 16); // 約60fps

window.addEventListener('scroll', optimizedScrollHandler);

// 錯誤處理
window.addEventListener('error', function(e) {
    console.error('JavaScript錯誤:', e.error);
    showNotification('發生錯誤，請重新整理頁面', 'error');
});

// 頁面載入完成後添加動畫類
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
    
    // 為主要元素添加滾動顯示類
    const elementsToReveal = document.querySelectorAll('.hero-content, .meeting-grid, .resources-grid, .invite-card, .about-content');
    elementsToReveal.forEach(element => {
        element.classList.add('scroll-reveal');
    });
});

// 導出函數供HTML使用
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.copyMeetingId = copyMeetingId;
window.copyHuaMeetingId = copyHuaMeetingId;
window.copyInviteText = copyInviteText;
window.setReminder = setReminder;
