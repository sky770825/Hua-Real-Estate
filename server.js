#!/usr/bin/env node

/**
 * 華地產網站 API 服務器
 * 提供後端 API 功能
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

class HuaRealEstateServer {
    constructor(port = 3001) {
        this.port = port;
        this.server = null;
    }

    // 處理靜態文件
    serveStaticFile(filePath, res) {
        const extname = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.wav': 'audio/wav',
            '.mp4': 'video/mp4',
            '.woff': 'application/font-woff',
            '.ttf': 'application/font-ttf',
            '.eot': 'application/vnd.ms-fontobject',
            '.otf': 'application/font-otf',
            '.wasm': 'application/wasm'
        };

        const contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code == 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 - 文件未找到</h1>', 'utf-8');
                } else {
                    res.writeHead(500);
                    res.end(`服務器錯誤: ${error.code}`, 'utf-8');
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }

    // API 路由處理
    handleAPI(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;

        // 設置 CORS 頭
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // 處理預檢請求
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // API 路由
        switch (pathname) {
            case '/api/meeting-info':
                this.getMeetingInfo(req, res);
                break;
            case '/api/member-stats':
                this.getMemberStats(req, res);
                break;
            case '/api/website-stats':
                this.getWebsiteStats(req, res);
                break;
            case '/api/contact':
                this.handleContact(req, res);
                break;
            default:
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'API 端點未找到' }));
        }
    }

    // 獲取會議信息 API
    getMeetingInfo(req, res) {
        const today = new Date();
        const currentDay = today.getDay();
        
        // 計算下一個週四
        let daysUntilThursday;
        if (currentDay === 4) { // 今天是週四
            const currentHour = today.getHours();
            const currentMinute = today.getMinutes();
            if (currentHour > 8 || (currentHour === 8 && currentMinute >= 45)) {
                daysUntilThursday = 7;
            } else {
                daysUntilThursday = 0;
            }
        } else if (currentDay < 4) {
            daysUntilThursday = 4 - currentDay;
        } else {
            daysUntilThursday = 7 - currentDay + 4;
        }
        
        const nextThursday = new Date(today);
        nextThursday.setDate(today.getDate() + daysUntilThursday);
        
        const meetingInfo = {
            nextMeetingDate: nextThursday.toISOString().split('T')[0],
            nextMeetingTime: '07:00-08:45',
            meetingId: '863 5853 7640',
            backupMeetingId: '883 8417 6239',
            zoomLink: 'https://us06web.zoom.us/j/86358537640',
            backupZoomLink: 'https://us06web.zoom.us/j/88384176239',
            checkinLink: 'https://house123.bni-checkin.com/',
            timezone: 'Asia/Taipei'
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(meetingInfo));
    }

    // 獲取會員統計 API
    getMemberStats(req, res) {
        const stats = {
            totalMembers: 45,
            activeMembers: 42,
            newMembersThisMonth: 3,
            goldAwardWinners: 3,
            meetingAttendance: {
                thisWeek: 38,
                lastWeek: 41,
                average: 39.5
            },
            topCategories: [
                { name: '包租代管', count: 12 },
                { name: '房仲業務', count: 8 },
                { name: '房產投資', count: 6 },
                { name: '建築營造', count: 5 },
                { name: '室內設計', count: 4 }
            ]
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
    }

    // 獲取網站統計 API
    getWebsiteStats(req, res) {
        const stats = {
            totalVisits: 1250,
            uniqueVisitors: 890,
            pageViews: 3420,
            averageSessionTime: '3分45秒',
            topPages: [
                { path: '/', views: 1250 },
                { path: '/#meeting', views: 890 },
                { path: '/#resources', views: 650 },
                { path: '/#invite', views: 420 }
            ],
            deviceBreakdown: {
                mobile: 65,
                desktop: 30,
                tablet: 5
            },
            browserStats: {
                chrome: 45,
                safari: 25,
                firefox: 15,
                edge: 10,
                other: 5
            }
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
    }

    // 處理聯絡表單 API
    handleContact(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '只允許 POST 請求' }));
            return;
        }

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                // 這裡可以添加保存到數據庫的邏輯
                console.log('收到聯絡表單:', data);
                
                // 模擬處理時間
                setTimeout(() => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: '聯絡信息已收到，我們會盡快回覆您！',
                        timestamp: new Date().toISOString()
                    }));
                }, 1000);
                
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '無效的 JSON 數據' }));
            }
        });
    }

    // 啟動服務器
    start() {
        this.server = http.createServer((req, res) => {
            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;

            // API 路由
            if (pathname.startsWith('/api/')) {
                this.handleAPI(req, res);
                return;
            }

            // 靜態文件服務
            let filePath = pathname === '/' ? '/index.html' : pathname;
            filePath = path.join(__dirname, filePath);
            
            this.serveStaticFile(filePath, res);
        });

        this.server.listen(this.port, () => {
            console.log(`🚀 華地產網站服務器已啟動!`);
            console.log(`📱 網站地址: http://localhost:${this.port}`);
            console.log(`🔗 API 地址: http://localhost:${this.port}/api/`);
            console.log(`📊 可用 API:`);
            console.log(`   GET  /api/meeting-info   - 會議信息`);
            console.log(`   GET  /api/member-stats   - 會員統計`);
            console.log(`   GET  /api/website-stats  - 網站統計`);
            console.log(`   POST /api/contact        - 聯絡表單`);
            console.log(`\n按 Ctrl+C 停止服務器`);
        });

        // 優雅關閉
        process.on('SIGINT', () => {
            console.log('\n🛑 正在關閉服務器...');
            this.server.close(() => {
                console.log('✅ 服務器已關閉');
                process.exit(0);
            });
        });
    }
}

// 啟動服務器
if (require.main === module) {
    const port = process.argv[2] || 3001;
    const server = new HuaRealEstateServer(parseInt(port));
    server.start();
}

module.exports = HuaRealEstateServer;
