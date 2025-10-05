#!/usr/bin/env node

/**
 * 華地產網站數據分析工具
 * 分析網站使用情況和會員數據
 */

const fs = require('fs');
const path = require('path');

class WebsiteAnalytics {
    constructor() {
        this.data = {
            visits: [],
            members: [],
            meetings: []
        };
    }

    // 生成模擬數據
    generateMockData() {
        // 生成訪問數據
        for (let i = 0; i < 100; i++) {
            this.data.visits.push({
                date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                page: ['/', '/#meeting', '/#resources', '/#invite'][Math.floor(Math.random() * 4)],
                device: ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)],
                duration: Math.floor(Math.random() * 300) + 30 // 30-330秒
            });
        }

        // 生成會員數據
        const categories = ['包租代管', '房仲業務', '房產投資', '建築營造', '室內設計', '法律服務', '財務規劃'];
        for (let i = 0; i < 45; i++) {
            this.data.members.push({
                id: i + 1,
                name: `會員${i + 1}`,
                category: categories[Math.floor(Math.random() * categories.length)],
                joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
                attendance: Math.floor(Math.random() * 20) + 1,
                referrals: Math.floor(Math.random() * 5)
            });
        }

        // 生成會議數據
        for (let i = 0; i < 12; i++) {
            this.data.meetings.push({
                date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
                attendance: Math.floor(Math.random() * 10) + 35,
                newMembers: Math.floor(Math.random() * 3),
                referrals: Math.floor(Math.random() * 8) + 2
            });
        }
    }

    // 分析訪問數據
    analyzeVisits() {
        console.log('\n📊 網站訪問分析:');
        console.log('='.repeat(40));

        const totalVisits = this.data.visits.length;
        const uniquePages = [...new Set(this.data.visits.map(v => v.page))];
        const deviceStats = this.data.visits.reduce((acc, visit) => {
            acc[visit.device] = (acc[visit.device] || 0) + 1;
            return acc;
        }, {});

        const avgDuration = this.data.visits.reduce((sum, visit) => sum + visit.duration, 0) / totalVisits;

        console.log(`總訪問次數: ${totalVisits}`);
        console.log(`平均停留時間: ${Math.round(avgDuration)}秒`);
        console.log(`訪問頁面數: ${uniquePages.length}`);
        
        console.log('\n設備分布:');
        Object.entries(deviceStats).forEach(([device, count]) => {
            const percentage = ((count / totalVisits) * 100).toFixed(1);
            console.log(`  ${device}: ${count} (${percentage}%)`);
        });

        console.log('\n熱門頁面:');
        const pageStats = this.data.visits.reduce((acc, visit) => {
            acc[visit.page] = (acc[visit.page] || 0) + 1;
            return acc;
        }, {});
        
        Object.entries(pageStats)
            .sort(([,a], [,b]) => b - a)
            .forEach(([page, count]) => {
                const percentage = ((count / totalVisits) * 100).toFixed(1);
                console.log(`  ${page}: ${count} (${percentage}%)`);
            });
    }

    // 分析會員數據
    analyzeMembers() {
        console.log('\n👥 會員分析:');
        console.log('='.repeat(40));

        const totalMembers = this.data.members.length;
        const categoryStats = this.data.members.reduce((acc, member) => {
            acc[member.category] = (acc[member.category] || 0) + 1;
            return acc;
        }, {});

        const avgAttendance = this.data.members.reduce((sum, member) => sum + member.attendance, 0) / totalMembers;
        const totalReferrals = this.data.members.reduce((sum, member) => sum + member.referrals, 0);

        console.log(`總會員數: ${totalMembers}`);
        console.log(`平均出席次數: ${avgAttendance.toFixed(1)}`);
        console.log(`總推薦數: ${totalReferrals}`);

        console.log('\n專業類別分布:');
        Object.entries(categoryStats)
            .sort(([,a], [,b]) => b - a)
            .forEach(([category, count]) => {
                const percentage = ((count / totalMembers) * 100).toFixed(1);
                console.log(`  ${category}: ${count} (${percentage}%)`);
            });

        // 找出最活躍的會員
        const topMembers = this.data.members
            .sort((a, b) => b.attendance - a.attendance)
            .slice(0, 5);

        console.log('\n最活躍會員 (前5名):');
        topMembers.forEach((member, index) => {
            console.log(`  ${index + 1}. ${member.name} - ${member.attendance}次出席`);
        });
    }

    // 分析會議數據
    analyzeMeetings() {
        console.log('\n📅 會議分析:');
        console.log('='.repeat(40));

        const totalMeetings = this.data.meetings.length;
        const avgAttendance = this.data.meetings.reduce((sum, meeting) => sum + meeting.attendance, 0) / totalMeetings;
        const totalNewMembers = this.data.meetings.reduce((sum, meeting) => sum + meeting.newMembers, 0);
        const totalReferrals = this.data.meetings.reduce((sum, meeting) => sum + meeting.referrals, 0);

        console.log(`分析期間會議數: ${totalMeetings}`);
        console.log(`平均出席人數: ${avgAttendance.toFixed(1)}`);
        console.log(`新增會員數: ${totalNewMembers}`);
        console.log(`總推薦數: ${totalReferrals}`);

        // 找出最佳表現的會議
        const bestMeeting = this.data.meetings.reduce((best, current) => 
            current.attendance > best.attendance ? current : best
        );

        console.log(`\n最佳出席會議: ${bestMeeting.date.toLocaleDateString()} (${bestMeeting.attendance}人)`);
    }

    // 生成報告
    generateReport() {
        console.log('🏠 華地產鑽石分會 - 數據分析報告');
        console.log('='.repeat(50));
        console.log(`報告生成時間: ${new Date().toLocaleString()}`);

        this.generateMockData();
        this.analyzeVisits();
        this.analyzeMembers();
        this.analyzeMeetings();

        console.log('\n✅ 分析完成!');
    }

    // 導出數據為 JSON
    exportData() {
        this.generateMockData();
        const exportData = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalVisits: this.data.visits.length,
                totalMembers: this.data.members.length,
                totalMeetings: this.data.meetings.length
            },
            data: this.data
        };

        const filename = `analytics-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
        console.log(`📄 數據已導出到: ${filename}`);
    }
}

// 主程序
function main() {
    const analytics = new WebsiteAnalytics();
    const command = process.argv[2] || 'report';

    switch (command) {
        case 'report':
            analytics.generateReport();
            break;
        case 'export':
            analytics.exportData();
            break;
        case 'visits':
            analytics.generateMockData();
            analytics.analyzeVisits();
            break;
        case 'members':
            analytics.generateMockData();
            analytics.analyzeMembers();
            break;
        case 'meetings':
            analytics.generateMockData();
            analytics.analyzeMeetings();
            break;
        default:
            console.log('可用命令:');
            console.log('  node analytics.js report   - 生成完整報告');
            console.log('  node analytics.js export   - 導出數據');
            console.log('  node analytics.js visits   - 訪問分析');
            console.log('  node analytics.js members  - 會員分析');
            console.log('  node analytics.js meetings - 會議分析');
    }
}

if (require.main === module) {
    main();
}

module.exports = WebsiteAnalytics;
