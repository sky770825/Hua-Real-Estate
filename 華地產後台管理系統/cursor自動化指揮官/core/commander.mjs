import fs from "fs";
import path from "path";
import { loadCommands, loadSOP } from "./command-loader.mjs";
import { scanProject, detectProjectType, readProjectConfig } from "./project-scanner.mjs";
import { AutomationExecutor } from "./automation-executor.mjs";

/**
 * 自動化指揮官主類別
 */
export class Commander {
  constructor(projectRoot = process.cwd(), commandSource = null) {
    this.projectRoot = path.resolve(projectRoot);
    this.commandSource = commandSource || this.projectRoot;
    this.commands = null;
    this.sop = null;
    this.projectStructure = null;
    this.executor = new AutomationExecutor(this.projectRoot);
  }

  /**
   * 初始化：讀取指令和掃描專案
   */
  async initialize() {
    console.log("🧠 Cursor 自動化指揮官 - 初始化\n");
    console.log(`專案路徑: ${this.projectRoot}`);
    console.log(`指令來源: ${this.commandSource}\n`);

    // 讀取指令
    const commandsPath = path.join(this.commandSource, "automation_commands.json");
    const sopPath = path.join(this.commandSource, "SOP_NOTION.md");

    try {
      this.commands = loadCommands(commandsPath);
      console.log(`✅ 讀取指令: ${this.commands.commands.length} 個指令`);
    } catch (err) {
      console.warn(`⚠️  無法讀取指令檔案: ${err.message}`);
      this.commands = null;
    }

    // 讀取 SOP
    try {
      this.sop = loadSOP(sopPath);
      if (this.sop) {
        console.log(`✅ 讀取 SOP: ${Object.keys(this.sop.sections).length} 個章節`);
      }
    } catch (err) {
      console.warn(`⚠️  無法讀取 SOP: ${err.message}`);
      this.sop = null;
    }

    // 掃描專案
    console.log("\n📁 掃描專案結構...");
    this.projectStructure = scanProject(this.projectRoot);
    console.log(`✅ 發現 ${this.projectStructure.totalFiles} 個檔案，${this.projectStructure.totalDirs} 個資料夾`);

    // 偵測專案類型
    const projectTypes = detectProjectType(this.projectRoot);
    console.log(`✅ 專案類型: ${projectTypes.join(", ")}`);

    // 讀取專案配置
    this.projectConfig = readProjectConfig(this.projectRoot);

    return {
      commands: this.commands,
      sop: this.sop,
      projectStructure: this.projectStructure,
      projectTypes,
      projectConfig: this.projectConfig,
    };
  }

  /**
   * 列出所有可用指令
   */
  listCommands() {
    if (!this.commands) {
      console.log("❌ 指令未載入");
      return [];
    }

    console.log("\n📋 可用指令列表:\n");

    const categories = this.commands.categories || [];
    for (const category of categories) {
      console.log(`\n📂 ${category.name} (${category.id})`);
      if (category.description) {
        console.log(`   ${category.description}`);
      }

      const categoryCommands = this.commands.commands.filter(
        (cmd) => cmd.category === category.id
      );

      for (const cmd of categoryCommands) {
        console.log(`\n   • ${cmd.name} (${cmd.id})`);
        if (cmd.description) {
          console.log(`     說明: ${cmd.description}`);
        }
        if (cmd.command) {
          console.log(`     指令: ${cmd.command}`);
        }
      }
    }

    return this.commands.commands;
  }

  /**
   * 執行特定指令
   */
  async executeCommand(commandId, context = {}) {
    if (!this.commands) {
      throw new Error("指令未載入，請先執行 initialize()");
    }

    const command = this.commands.commands.find((cmd) => cmd.id === commandId);
    if (!command) {
      throw new Error(`找不到指令: ${commandId}`);
    }

    console.log(`\n🚀 執行指令: ${command.name}\n`);

    return await this.executor.executeCommand(command, context);
  }

  /**
   * 執行分類下的所有指令
   */
  async executeCategory(categoryId, context = {}) {
    if (!this.commands) {
      throw new Error("指令未載入，請先執行 initialize()");
    }

    const categoryCommands = this.commands.commands.filter(
      (cmd) => cmd.category === categoryId
    );

    if (categoryCommands.length === 0) {
      console.log(`⚠️  分類 ${categoryId} 沒有可用指令`);
      return [];
    }

    console.log(`\n🚀 執行分類: ${categoryId} (${categoryCommands.length} 個指令)\n`);

    const results = [];
    for (const command of categoryCommands) {
      try {
        const result = await this.executor.executeCommand(command, context);
        results.push({ command, result, success: true });
      } catch (error) {
        results.push({ command, error: error.message, success: false });
        console.error(`❌ 指令 ${command.name} 執行失敗: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * 根據專案類型自動化設定
   */
  async autoSetup() {
    if (!this.commands || !this.commands.file_structure) {
      console.log("⚠️  沒有檔案結構定義，跳過自動設定");
      return;
    }

    console.log("\n🔧 自動化設定專案結構...\n");

    // 建立檔案結構
    const sourceDir = this.commandSource;
    this.executor.setupFileStructure(this.commands.file_structure, sourceDir);

    // 執行設定步驟
    if (this.commands.setup_steps) {
      console.log("\n📝 執行設定步驟:\n");
      for (const step of this.commands.setup_steps) {
        console.log(`   • ${step}`);
      }
    }
  }

  /**
   * 顯示執行摘要
   */
  showSummary() {
    const summary = this.executor.getSummary();
    
    console.log("\n" + "=".repeat(60));
    console.log("📊 執行摘要");
    console.log("=".repeat(60));
    console.log(`總步驟數: ${summary.totalSteps}`);
    console.log(`成功: ${summary.successSteps}`);
    console.log(`失敗: ${summary.failedSteps}`);

    if (summary.errors.length > 0) {
      console.log("\n❌ 錯誤列表:");
      for (const error of summary.errors) {
        console.log(`   • ${error.command}`);
        console.log(`     狀態碼: ${error.status}`);
      }
    }

    console.log("=".repeat(60) + "\n");

    return summary;
  }

  /**
   * 取得專案分析報告
   */
  getAnalysis() {
    return {
      projectRoot: this.projectRoot,
      projectTypes: detectProjectType(this.projectRoot),
      structure: this.projectStructure,
      config: this.projectConfig,
      availableCommands: this.commands?.commands.length || 0,
      availableCategories: this.commands?.categories.length || 0,
    };
  }
}
