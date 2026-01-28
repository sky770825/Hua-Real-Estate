#!/usr/bin/env node

import path from "path";
import { fileURLToPath } from "url";
import { Commander } from "../core/commander.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 取得命令列參數
const args = process.argv.slice(2);
const command = args[0];
const options = {};

// 解析選項
for (let i = 1; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith("--")) {
    const key = arg.slice(2);
    const value = args[i + 1] || true;
    options[key] = value;
    if (typeof value === "string" && !value.startsWith("--")) {
      i++;
    }
  }
}

// 專案路徑（預設當前目錄）
const projectRoot = options.project || process.cwd();

// 指令來源（預設指揮官目錄）
const commanderDir = path.resolve(__dirname, "..");
const commandSource = options.source || commanderDir;

// 建立指揮官實例
const commander = new Commander(projectRoot, commandSource);

async function main() {
  try {
    // 初始化
    await commander.initialize();

    // 根據命令執行
    switch (command) {
      case "list":
      case "ls":
        commander.listCommands();
        break;

      case "execute":
      case "run":
        const commandId = args[1];
        if (!commandId) {
          console.error("❌ 請指定指令 ID");
          console.log("用法: node automate.mjs execute <command-id>");
          process.exit(1);
        }
        await commander.executeCommand(commandId, options);
        commander.showSummary();
        break;

      case "category":
      case "cat":
        const categoryId = args[1];
        if (!categoryId) {
          console.error("❌ 請指定分類 ID");
          console.log("用法: node automate.mjs category <category-id>");
          process.exit(1);
        }
        await commander.executeCategory(categoryId, options);
        commander.showSummary();
        break;

      case "setup":
      case "auto":
        await commander.autoSetup();
        commander.showSummary();
        break;

      case "analyze":
        const analysis = commander.getAnalysis();
        console.log("\n📊 專案分析報告:\n");
        console.log(JSON.stringify(analysis, null, 2));
        break;

      case "help":
      case "--help":
      case "-h":
      default:
        console.log(`
🧠 Cursor 自動化指揮官

用法:
  node automate.mjs <command> [options]

命令:
  list, ls              列出所有可用指令
  execute, run <id>     執行特定指令
  category, cat <id>    執行分類下的所有指令
  setup, auto           自動化設定專案結構
  analyze               顯示專案分析報告
  help                  顯示此幫助訊息

選項:
  --project <path>      指定專案路徑（預設: 當前目錄）
  --source <path>       指定指令來源路徑（預設: 指揮官目錄）

範例:
  node automate.mjs list
  node automate.mjs execute cmd-start
  node automate.mjs category rag-automation
  node automate.mjs setup --project /path/to/project
        `);
        break;
    }
  } catch (error) {
    console.error("\n❌ 錯誤:", error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
