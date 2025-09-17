// 自動計算下一個週四的日期
function getNextThursday() {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = 星期日, 1 = 星期一, ..., 4 = 星期四
    
    // 計算到下一個週四的天數
    let daysUntilThursday;
    if (currentDay === 4) { // 今天是週四
        // 檢查是否已經過了早上9點
        const currentHour = today.getHours();
        if (currentHour >= 9) {
            // 如果已經過了早上9點，跳到下週四
            daysUntilThursday = 7;
        } else {
            // 如果還沒到早上9點，今天就是會議日
            daysUntilThursday = 0;
        }
    } else if (currentDay < 4) {
        // 週一到週三
        daysUntilThursday = 4 - currentDay;
    } else {
        // 週五到週日
        daysUntilThursday = 7 - currentDay + 4;
    }
    
    const nextThursday = new Date(today);
    nextThursday.setDate(today.getDate() + daysUntilThursday);
    
    return nextThursday;
}

// 格式化日期顯示
function formatDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[date.getDay()];
    
    return `${year}年${month}月${day}日 (${weekday})`;
}

// 更新會議日期
function updateMeetingDate() {
    const nextThursday = getNextThursday();
    const dateElement = document.getElementById('nextMeetingDate');
    if (dateElement) {
        dateElement.textContent = formatDate(nextThursday);
    }
}

// 複製邀請文字到剪貼板
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

📌 想參加的話，可以幫我填寫這份連結🔗https://forms.gle/phH9QDgLBMiL1Uo96
我會幫你完成報名，並在線上等你一起來！`;

    // 使用現代瀏覽器的 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(inviteText).then(() => {
            showNotification('邀請文字已複製到剪貼板！', 'success');
        }).catch(err => {
            console.error('複製失敗:', err);
            fallbackCopyTextToClipboard(inviteText);
        });
    } else {
        // 降級處理
        fallbackCopyTextToClipboard(inviteText);
    }
}

// 降級複製方法
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // 避免滾動到底部
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('邀請文字已複製到剪貼板！', 'success');
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
function showNotification(message, type = 'info') {
    // 移除現有的通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加樣式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-weight: 500;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    
    // 添加動畫樣式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // 3秒後自動移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}

// 平滑滾動到指定區塊
function smoothScrollTo(targetId) {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
        targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// 為導航連結添加平滑滾動
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            smoothScrollTo(targetId);
        });
    });
}

// 添加滾動效果到導航欄
function initNavbarScrollEffect() {
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // 向下滾動，隱藏導航欄
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // 向上滾動，顯示導航欄
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
    });
}

// 添加卡片懸停效果
function initCardHoverEffects() {
    const cards = document.querySelectorAll('.resource-card, .faq-card, .invite-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
}

// 檢查會議狀態
function checkMeetingStatus() {
    // 會議進行中功能已取消
    // 保持原有的會議卡片顯示
}

// 複製會議ID
function copyMeetingId() {
    const meetingId = '883 8417 6239';
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(meetingId).then(() => {
            showNotification('會議ID已複製到剪貼板！', 'success');
        }).catch(err => {
            console.error('複製失敗:', err);
            fallbackCopyTextToClipboard(meetingId);
        });
    } else {
        fallbackCopyTextToClipboard(meetingId);
    }
}

// 複製華地產會議ID
function copyHuaMeetingId() {
    const meetingId = '863 5853 7640';
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(meetingId).then(() => {
            showNotification('華地產會議ID已複製到剪貼板！', 'success');
        }).catch(err => {
            console.error('複製失敗:', err);
            fallbackCopyTextToClipboard(meetingId);
        });
    } else {
        fallbackCopyTextToClipboard(meetingId);
    }
}

// 設定提醒功能
function setReminder() {
    // 計算下一個週四的日期
    const nextThursday = getNextThursday();
    
    // 設定提醒時間為週四早上6:30
    const reminderTime = new Date(nextThursday);
    reminderTime.setHours(6, 30, 0, 0);
    
    // 首先嘗試使用Web Share API分享到手機內建提醒
    if (navigator.share) {
        shareToNativeReminder(reminderTime);
    } else if ('Notification' in window) {
        // 如果不支援分享，嘗試通知API
        if (Notification.permission === 'granted') {
            scheduleNotification(reminderTime);
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    scheduleNotification(reminderTime);
                } else {
                    showCalendarReminder(reminderTime);
                }
            });
        } else {
            showCalendarReminder(reminderTime);
        }
    } else {
        // 最後備用方案：日曆提醒
        showCalendarReminder(reminderTime);
    }
}

// 分享到手機內建提醒功能
function shareToNativeReminder(reminderTime) {
    const reminderText = `華地產鑽石分會 - 每週四例會提醒
時間：${reminderTime.getFullYear()}年${reminderTime.getMonth() + 1}月${reminderTime.getDate()}日 早上6:30
會議時間：早上7:00-8:45
會議ID：883 8417 6239
Zoom連結：https://us06web.zoom.us/j/88384176239

請將此提醒加入您的手機提醒事項中`;

    const shareData = {
        title: '華地產鑽石分會 - 每週四例會提醒',
        text: reminderText,
        url: 'https://house123.bni-checkin.com/'
    };

    navigator.share(shareData)
        .then(() => {
            showNotification('已分享到手機！請選擇「提醒事項」、「備忘錄」或「鬧鐘」應用來設定提醒', 'success');
        })
        .catch((error) => {
            console.log('分享失敗:', error);
            // 如果分享失敗，嘗試其他方法
            showNativeReminderOptions(reminderTime);
        });
}

// 顯示原生提醒選項
function showNativeReminderOptions(reminderTime) {
    const reminderText = `華地產鑽石分會 - 每週四例會提醒
時間：${reminderTime.getFullYear()}年${reminderTime.getMonth() + 1}月${reminderTime.getDate()}日 早上6:30
會議時間：早上7:00-8:45
會議ID：883 8417 6239
Zoom連結：https://us06web.zoom.us/j/88384176239`;

    // 創建選擇對話框
    const options = [
        { text: '📱 分享到手機應用', action: () => shareToNativeReminder(reminderTime) },
        { text: '📋 複製提醒文字', action: () => copyReminderText(reminderText) },
        { text: '📅 開啟日曆應用', action: () => openCalendarApp(reminderTime) },
        { text: '🔔 設定瀏覽器通知', action: () => scheduleNotification(reminderTime) },
        { text: '📖 查看設定指南', action: () => showReminderGuide() }
    ];

    showReminderOptionsDialog(options, reminderText);
}

// 複製提醒文字
function copyReminderText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('提醒文字已複製！請貼到您的提醒事項應用程式中', 'success');
        }).catch(() => {
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

// 顯示提醒設定指南
function showReminderGuide() {
    const guideContent = `
        <div class="reminder-guide">
            <h3>📱 手機提醒設定指南</h3>
            <div class="guide-section">
                <h4>🍎 iPhone 用戶：</h4>
                <ol>
                    <li>點擊「分享到手機應用」</li>
                    <li>選擇「提醒事項」或「備忘錄」</li>
                    <li>在提醒事項中設定時間為週四早上6:30</li>
                    <li>或使用「時鐘」應用設定鬧鐘</li>
                </ol>
            </div>
            <div class="guide-section">
                <h4>🤖 Android 用戶：</h4>
                <ol>
                    <li>點擊「分享到手機應用」</li>
                    <li>選擇「Google Keep」或「Google Tasks」</li>
                    <li>設定提醒時間為週四早上6:30</li>
                    <li>或使用「時鐘」應用設定鬧鐘</li>
                </ol>
            </div>
            <div class="guide-section">
                <h4>💡 其他方法：</h4>
                <ul>
                    <li>複製提醒文字，手動貼到任何提醒應用</li>
                    <li>使用日曆應用設定重複提醒</li>
                    <li>設定瀏覽器通知（需要允許通知權限）</li>
                </ul>
            </div>
        </div>
    `;

    showGuideDialog(guideContent);
}

// 顯示指南對話框
function showGuideDialog(content) {
    // 移除現有對話框
    const existingDialog = document.querySelector('.guide-dialog');
    if (existingDialog) {
        existingDialog.remove();
    }

    // 創建對話框
    const dialog = document.createElement('div');
    dialog.className = 'guide-dialog';
    dialog.innerHTML = `
        <div class="dialog-overlay">
            <div class="dialog-content guide-content">
                ${content}
                <button class="dialog-close-btn">關閉</button>
            </div>
        </div>
    `;

    // 添加樣式
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;

    // 添加指南樣式
    const style = document.createElement('style');
    style.textContent = `
        .guide-content {
            background: white;
            padding: 30px;
            border-radius: 15px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .guide-content h3 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 1.4rem;
            text-align: center;
        }
        .guide-section {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 4px solid #3498db;
        }
        .guide-section h4 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 1.1rem;
        }
        .guide-section ol, .guide-section ul {
            margin: 0;
            padding-left: 20px;
        }
        .guide-section li {
            margin-bottom: 8px;
            line-height: 1.4;
            color: #555;
        }
        .dialog-close-btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            margin-top: 20px;
            width: 100%;
        }
        .dialog-close-btn:hover {
            background: #2980b9;
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(dialog);

    // 添加事件監聽器
    dialog.querySelector('.dialog-close-btn').addEventListener('click', () => {
        dialog.remove();
    });

    // 點擊背景關閉
    dialog.querySelector('.dialog-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            dialog.remove();
        }
    });
}

// 顯示提醒選項對話框
function showReminderOptionsDialog(options, reminderText) {
    // 移除現有對話框
    const existingDialog = document.querySelector('.reminder-dialog');
    if (existingDialog) {
        existingDialog.remove();
    }

    // 創建對話框
    const dialog = document.createElement('div');
    dialog.className = 'reminder-dialog';
    dialog.innerHTML = `
        <div class="dialog-overlay">
            <div class="dialog-content">
                <h3>📱 設定提醒</h3>
                <p>請選擇您偏好的提醒方式：</p>
                <div class="reminder-options">
                    ${options.map((option, index) => `
                        <button class="reminder-option-btn" data-action="${index}">
                            ${option.text}
                        </button>
                    `).join('')}
                </div>
                <button class="dialog-close-btn">關閉</button>
            </div>
        </div>
    `;

    // 添加樣式
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;

    // 添加動畫樣式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .dialog-content {
            background: white;
            padding: 30px;
            border-radius: 15px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .dialog-content h3 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        .dialog-content p {
            color: #666;
            margin-bottom: 20px;
            line-height: 1.5;
        }
        .reminder-options {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 20px;
        }
        .reminder-option-btn {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        .reminder-option-btn:hover {
            background: linear-gradient(135deg, #2980b9, #3498db);
            transform: translateY(-2px);
        }
        .dialog-close-btn {
            background: #95a5a6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
        }
        .dialog-close-btn:hover {
            background: #7f8c8d;
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(dialog);

    // 添加事件監聽器
    dialog.querySelectorAll('.reminder-option-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            options[index].action();
            dialog.remove();
        });
    });

    dialog.querySelector('.dialog-close-btn').addEventListener('click', () => {
        dialog.remove();
    });

    // 點擊背景關閉
    dialog.querySelector('.dialog-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            dialog.remove();
        }
    });
}

// 排程通知
function scheduleNotification(reminderTime) {
    const now = new Date();
    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    if (timeUntilReminder > 0) {
        setTimeout(() => {
            new Notification('華地產鑽石分會提醒', {
                body: '會議將在15分鐘後開始！請準備參加每週四例會。',
                icon: 'https://house123.bni-checkin.com/og-image.jpg',
                tag: 'bni-meeting-reminder'
            });
        }, timeUntilReminder);
        
        showNotification('提醒已設定！將在週四早上6:30通知您', 'success');
    } else {
        showNotification('提醒時間已過，請等待下次會議', 'info');
    }
}

// 開啟日曆應用程式
function openCalendarApp(reminderTime) {
    const calendarUrl = generateCalendarUrl(reminderTime);
    if (calendarUrl) {
        window.open(calendarUrl, '_blank');
        showNotification('已開啟日曆應用程式！請確認並儲存提醒', 'success');
    } else {
        showNotification('無法開啟日曆應用程式，請手動複製提醒文字', 'error');
    }
}

// 顯示日曆提醒選項
function showCalendarReminder(reminderTime) {
    const reminderText = `華地產鑽石分會 - 每週四例會提醒
時間：${reminderTime.getFullYear()}年${reminderTime.getMonth() + 1}月${reminderTime.getDate()}日 早上6:30
會議時間：早上7:00-8:45
會議ID：883 8417 6239
Zoom連結：https://us06web.zoom.us/j/88384176239`;

    // 複製提醒文字到剪貼板
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(reminderText).then(() => {
            showNotification('提醒文字已複製！請貼到您的日曆應用程式中', 'success');
        }).catch(() => {
            fallbackCopyTextToClipboard(reminderText);
        });
    } else {
        fallbackCopyTextToClipboard(reminderText);
    }
    
    // 嘗試開啟日曆應用程式
    const calendarUrl = generateCalendarUrl(reminderTime);
    if (calendarUrl) {
        setTimeout(() => {
            if (confirm('是否要開啟日曆應用程式來設定提醒？')) {
                window.open(calendarUrl, '_blank');
            }
        }, 1000);
    }
}

// 生成日曆URL
function generateCalendarUrl(reminderTime) {
    const startTime = new Date(reminderTime);
    const endTime = new Date(reminderTime);
    endTime.setHours(8, 45, 0, 0);
    
    const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const title = encodeURIComponent('華地產鑽石分會 - 每週四例會');
    const details = encodeURIComponent('每週四例會提醒\n會議時間：早上7:00-8:45\n會議ID：883 8417 6239\nZoom連結：https://us06web.zoom.us/j/88384176239');
    const location = encodeURIComponent('線上會議');
    
    // Google Calendar
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(startTime)}/${formatDate(endTime)}&details=${details}&location=${location}`;
    
    return googleUrl;
}

// 更新倒數計時器
function updateCountdown() {
    const nextThursday = getNextThursday();
    const now = new Date();
    
    // 設定會議時間為週四早上7點
    nextThursday.setHours(7, 0, 0, 0);
    
    const timeDiff = nextThursday.getTime() - now.getTime();
    
    console.log('下次會議時間:', nextThursday);
    console.log('現在時間:', now);
    console.log('時間差(毫秒):', timeDiff);
    
    if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        console.log('倒數:', days, hours, minutes, seconds);
        
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        
        if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
    } else {
        // 會議時間已到或已過
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        
        if (daysEl) daysEl.textContent = '00';
        if (hoursEl) hoursEl.textContent = '00';
        if (minutesEl) minutesEl.textContent = '00';
        if (secondsEl) secondsEl.textContent = '00';
    }
}


// 初始化返回頂部按鈕
function initBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}


// 初始化聯絡按鈕隱藏/顯示功能
function initContactToggle() {
    const contactBtn = document.getElementById('contactBtn');
    const toggleBtn = document.getElementById('toggleContactBtn');
    const toggleIcon = document.getElementById('toggleIcon');
    
    // 檢查本地儲存的隱藏狀態
    const isHidden = localStorage.getItem('contactBtnHidden') === 'true';
    if (isHidden) {
        contactBtn.classList.add('hidden');
        toggleBtn.classList.add('hidden-state');
        toggleIcon.className = 'fas fa-eye-slash';
        toggleBtn.title = '顯示聯絡按鈕';
    }
    
    // 確保按鈕在手機版上可見
    function ensureMobileVisibility() {
        if (window.innerWidth <= 768) {
            contactBtn.style.display = 'flex';
            contactBtn.style.visibility = 'visible';
            contactBtn.style.opacity = '1';
            
            // 強制確保文字在手機版上顯示
            const btnText = contactBtn.querySelector('.btn-text');
            if (btnText) {
                btnText.style.display = 'block';
                btnText.style.visibility = 'visible';
                btnText.style.opacity = '1';
            }
        }
    }
    
    // 初始檢查
    ensureMobileVisibility();
    
    // 監聽視窗大小改變
    window.addEventListener('resize', () => {
        ensureMobileVisibility();
        forceMobileContactText();
    });
    
    toggleBtn.addEventListener('click', () => {
        const isCurrentlyHidden = contactBtn.classList.contains('hidden');
        
        if (isCurrentlyHidden) {
            // 顯示按鈕
            contactBtn.classList.remove('hidden');
            toggleBtn.classList.remove('hidden-state');
            toggleIcon.className = 'fas fa-eye';
            toggleBtn.title = '隱藏聯絡按鈕';
            localStorage.setItem('contactBtnHidden', 'false');
        } else {
            // 隱藏按鈕
            contactBtn.classList.add('hidden');
            toggleBtn.classList.add('hidden-state');
            toggleIcon.className = 'fas fa-eye-slash';
            toggleBtn.title = '顯示聯絡按鈕';
            localStorage.setItem('contactBtnHidden', 'true');
        }
    });
}

// 強制顯示手機版聯絡按鈕文字
function forceMobileContactText() {
    const contactBtn = document.getElementById('contactBtn');
    const btnText = contactBtn ? contactBtn.querySelector('.btn-text') : null;
    
    if (btnText && window.innerWidth <= 768) {
        // 強制設定樣式
        btnText.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            font-size: ${window.innerWidth <= 480 ? '0.55rem' : '0.6rem'} !important;
            line-height: 1.1 !important;
            text-align: center !important;
            white-space: nowrap !important;
            font-weight: 600 !important;
            letter-spacing: 0.5px !important;
        `;
    }
}

// 圖片放大功能
function openImageModal(imageSrc, imageTitle) {
    // 移除現有的模態框
    const existingModal = document.querySelector('.image-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 創建模態框
    const modal = document.createElement('div');
    modal.className = 'image-modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <img src="${imageSrc}" alt="${imageTitle}" class="modal-image">
            <div class="modal-title">${imageTitle}</div>
        </div>
    `;
    
    // 添加到頁面
    document.body.appendChild(modal);
    
    // 添加事件監聽器
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        closeImageModal(modal);
    });
    
    // 點擊背景關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeImageModal(modal);
        }
    });
    
    // ESC鍵關閉
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeImageModal(modal);
            document.removeEventListener('keydown', escHandler);
        }
    });
    
    // 防止背景滾動
    document.body.style.overflow = 'hidden';
}

function closeImageModal(modal) {
    if (modal && modal.parentNode) {
        modal.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
                // 恢復背景滾動
                document.body.style.overflow = 'auto';
            }
        }, 300);
    }
}

// 初始化跑馬燈功能
function initMarquee() {
    const marqueeContent = document.querySelector('.marquee-content');
    if (!marqueeContent) return;
    
    // 暫停/恢復跑馬燈功能
    let isPaused = false;
    
    marqueeContent.addEventListener('mouseenter', () => {
        if (!isPaused) {
            marqueeContent.style.animationPlayState = 'paused';
        }
    });
    
    marqueeContent.addEventListener('mouseleave', () => {
        if (!isPaused) {
            marqueeContent.style.animationPlayState = 'running';
        }
    });
    
    // 點擊暫停/恢復功能
    marqueeContent.addEventListener('click', (e) => {
        if (e.target.classList.contains('praise-image') || e.target.classList.contains('praise-text')) {
            return; // 如果是點擊圖片或文字，不觸發暫停
        }
        
        isPaused = !isPaused;
        if (isPaused) {
            marqueeContent.style.animationPlayState = 'paused';
            showNotification('跑馬燈已暫停', 'info');
        } else {
            marqueeContent.style.animationPlayState = 'running';
            showNotification('跑馬燈已恢復', 'info');
        }
    });
}

// 頁面載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化各種功能
    updateMeetingDate();
    updateCountdown();
    initSmoothScrolling();
    initNavbarScrollEffect();
    initCardHoverEffects();
    initBackToTop();
    initContactToggle();
    initMarquee();
    
    // 強制顯示手機版文字
    forceMobileContactText();
    
    // 每秒更新倒數計時器
    setInterval(updateCountdown, 1000);
    
    // 每小時更新一次日期（防止跨日）
    setInterval(updateMeetingDate, 3600000);
    
    console.log('華地產鑽石分會網頁已載入完成！');
});

// 添加鍵盤快捷鍵
document.addEventListener('keydown', function(e) {
    // Ctrl + / 顯示快捷鍵幫助
    if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        showNotification('快捷鍵：Ctrl+/ 顯示幫助', 'info');
    }
    
    // Ctrl + 1-4 快速導航
    if (e.ctrlKey && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const sections = ['meeting', 'resources', 'invite', 'faq'];
        const sectionIndex = parseInt(e.key) - 1;
        if (sections[sectionIndex]) {
            smoothScrollTo(sections[sectionIndex]);
        }
    }
});
