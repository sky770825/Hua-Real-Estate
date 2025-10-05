#!/usr/bin/env node

/**
 * 華地產網站開發工具
 * 提供各種實用的開發和維護功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 顏色輸出
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 工具函數
class DevTools {
    constructor() {
        this.projectRoot = process.cwd();
    }

    // 檢查文件大小
    checkFileSizes() {
        log('\n📊 檢查文件大小:', 'cyan');
        const files = ['index.html', 'styles.css', 'script.js'];
        
        files.forEach(file => {
            if (fs.existsSync(file)) {
                const stats = fs.statSync(file);
                const sizeKB = (stats.size / 1024).toFixed(2);
                const color = sizeKB > 100 ? 'red' : sizeKB > 50 ? 'yellow' : 'green';
                log(`  ${file}: ${sizeKB} KB`, color);
            }
        });
    }

    // 檢查圖片優化
    checkImages() {
        log('\n🖼️  檢查圖片文件:', 'cyan');
        const imageDir = path.join(this.projectRoot, '金質獎章');
        
        if (fs.existsSync(imageDir)) {
            const files = fs.readdirSync(imageDir);
            files.forEach(file => {
                if (file.match(/\.(jpg|jpeg|png|gif)$/i)) {
                    const filePath = path.join(imageDir, file);
                    const stats = fs.statSync(filePath);
                    const sizeKB = (stats.size / 1024).toFixed(2);
                    const color = sizeKB > 500 ? 'red' : sizeKB > 200 ? 'yellow' : 'green';
                    log(`  ${file}: ${sizeKB} KB`, color);
                }
            });
        }
    }

    // 生成網站統計
    generateStats() {
        log('\n📈 網站統計信息:', 'cyan');
        
        // 計算代碼行數
        const files = ['index.html', 'styles.css', 'script.js'];
        let totalLines = 0;
        
        files.forEach(file => {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                const lines = content.split('\n').length;
                totalLines += lines;
                log(`  ${file}: ${lines} 行`, 'blue');
            }
        });
        
        log(`  總代碼行數: ${totalLines} 行`, 'green');
        
        // 檢查功能模塊
        if (fs.existsSync('script.js')) {
            const scriptContent = fs.readFileSync('script.js', 'utf8');
            const functions = scriptContent.match(/function\s+\w+/g) || [];
            log(`  JavaScript 函數: ${functions.length} 個`, 'blue');
        }
    }

    // 檢查性能指標
    checkPerformance() {
        log('\n⚡ 性能檢查:', 'cyan');
        
        // 檢查 CSS 大小
        if (fs.existsSync('styles.css')) {
            const cssContent = fs.readFileSync('styles.css', 'utf8');
            const cssSize = (cssContent.length / 1024).toFixed(2);
            log(`  CSS 文件大小: ${cssSize} KB`, cssSize > 50 ? 'yellow' : 'green');
            
            // 檢查未使用的 CSS
            const selectors = cssContent.match(/\.\w+(-\w+)*\s*{/g) || [];
            log(`  CSS 選擇器數量: ${selectors.length}`, 'blue');
        }
        
        // 檢查 JavaScript 大小
        if (fs.existsSync('script.js')) {
            const jsContent = fs.readFileSync('script.js', 'utf8');
            const jsSize = (jsContent.length / 1024).toFixed(2);
            log(`  JavaScript 文件大小: ${jsSize} KB`, jsSize > 30 ? 'yellow' : 'green');
        }
    }

    // 創建備份
    createBackup() {
        log('\n💾 創建備份:', 'cyan');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = `backup-${timestamp}`;
        
        try {
            fs.mkdirSync(backupDir);
            const files = ['index.html', 'styles.css', 'script.js'];
            
            files.forEach(file => {
                if (fs.existsSync(file)) {
                    fs.copyFileSync(file, path.join(backupDir, file));
                }
            });
            
            log(`  備份已創建: ${backupDir}`, 'green');
        } catch (error) {
            log(`  備份失敗: ${error.message}`, 'red');
        }
    }

    // 檢查 SEO 優化
    checkSEO() {
        log('\n🔍 SEO 檢查:', 'cyan');
        
        if (fs.existsSync('index.html')) {
            const htmlContent = fs.readFileSync('index.html', 'utf8');
            
            // 檢查 meta 標籤
            const hasTitle = htmlContent.includes('<title>');
            const hasDescription = htmlContent.includes('name="description"');
            const hasKeywords = htmlContent.includes('name="keywords"');
            const hasViewport = htmlContent.includes('name="viewport"');
            
            log(`  Title 標籤: ${hasTitle ? '✅' : '❌'}`, hasTitle ? 'green' : 'red');
            log(`  Description: ${hasDescription ? '✅' : '❌'}`, hasDescription ? 'green' : 'red');
            log(`  Keywords: ${hasKeywords ? '✅' : '❌'}`, hasKeywords ? 'green' : 'red');
            log(`  Viewport: ${hasViewport ? '✅' : '❌'}`, hasViewport ? 'green' : 'red');
            
            // 檢查結構化數據
            const hasStructuredData = htmlContent.includes('application/ld+json');
            log(`  結構化數據: ${hasStructuredData ? '✅' : '❌'}`, hasStructuredData ? 'green' : 'red');
        }
    }

    // 顯示幫助信息
    showHelp() {
        log('\n🛠️  華地產網站開發工具', 'bright');
        log('='.repeat(40), 'cyan');
        log('可用命令:', 'yellow');
        log('  node dev-tools.js stats     - 顯示網站統計');
        log('  node dev-tools.js files     - 檢查文件大小');
        log('  node dev-tools.js images    - 檢查圖片文件');
        log('  node dev-tools.js perf      - 性能檢查');
        log('  node dev-tools.js seo       - SEO 檢查');
        log('  node dev-tools.js backup    - 創建備份');
        log('  node dev-tools.js all       - 運行所有檢查');
        log('  node dev-tools.js help      - 顯示幫助');
    }

    // 運行所有檢查
    runAll() {
        this.checkFileSizes();
        this.checkImages();
        this.generateStats();
        this.checkPerformance();
        this.checkSEO();
        log('\n✅ 所有檢查完成!', 'green');
    }
}

// 主程序
function main() {
    const tools = new DevTools();
    const command = process.argv[2] || 'help';
    
    log('🏠 華地產鑽石分會 - 開發工具', 'bright');
    
    switch (command) {
        case 'stats':
            tools.generateStats();
            break;
        case 'files':
            tools.checkFileSizes();
            break;
        case 'images':
            tools.checkImages();
            break;
        case 'perf':
            tools.checkPerformance();
            break;
        case 'seo':
            tools.checkSEO();
            break;
        case 'backup':
            tools.createBackup();
            break;
        case 'all':
            tools.runAll();
            break;
        case 'help':
        default:
            tools.showHelp();
            break;
    }
}

// 運行程序
if (require.main === module) {
    main();
}

module.exports = DevTools;
