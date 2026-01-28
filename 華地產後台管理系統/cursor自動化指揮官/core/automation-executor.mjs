import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

/**
 * 自動化執行器
 */
export class AutomationExecutor {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.executedSteps = [];
    this.errors = [];
  }

  /**
   * 執行命令
   */
  runCommand(command, args = [], options = {}) {
    const {
      cwd = this.projectRoot,
      silent = false,
      check = true,
    } = options;

    const cmdStr = `${command} ${args.join(" ")}`;

    if (!silent) {
      console.log(`\n==> 執行: ${cmdStr}`);
    }

    const result = spawnSync(command, args, {
      cwd,
      stdio: silent ? "pipe" : "inherit",
      encoding: "utf8",
      ...options,
    });

    const step = {
      command: cmdStr,
      cwd,
      success: result.status === 0,
      stdout: result.stdout,
      stderr: result.stderr,
      status: result.status,
      timestamp: new Date().toISOString(),
    };

    this.executedSteps.push(step);

    if (!step.success && check) {
      this.errors.push(step);
      throw new Error(`命令執行失敗: ${cmdStr} (exit code: ${result.status})`);
    }

    return step;
  }

  /**
   * 確保檔案/資料夾存在
   */
  ensureDir(dirPath) {
    const fullPath = path.join(this.projectRoot, dirPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ 建立資料夾: ${dirPath}`);
    }
    return fullPath;
  }

  /**
   * 確保檔案存在（不存在則建立）
   */
  ensureFile(filePath, content = "", options = {}) {
    const fullPath = path.join(this.projectRoot, filePath);
    const { overwrite = false } = options;

    if (fs.existsSync(fullPath) && !overwrite) {
      return { exists: true, path: fullPath };
    }

    // 確保父資料夾存在
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content, "utf8");
    console.log(`✅ 建立檔案: ${filePath}`);

    return { exists: false, created: true, path: fullPath };
  }

  /**
   * 複製檔案
   */
  copyFile(sourcePath, targetPath, options = {}) {
    const { overwrite = false } = options;
    const targetFull = path.join(this.projectRoot, targetPath);

    if (fs.existsSync(targetFull) && !overwrite) {
      return { exists: true, path: targetFull };
    }

    // 確保目標資料夾存在
    const dir = path.dirname(targetFull);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.copyFileSync(sourcePath, targetFull);
    console.log(`✅ 複製檔案: ${targetPath}`);

    return { copied: true, path: targetFull };
  }

  /**
   * 讀取並處理檔案
   */
  readFile(filePath) {
    const fullPath = path.join(this.projectRoot, filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`檔案不存在: ${filePath}`);
    }
    return fs.readFileSync(fullPath, "utf8");
  }

  /**
   * 寫入檔案
   */
  writeFile(filePath, content) {
    const fullPath = path.join(this.projectRoot, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, "utf8");
    console.log(`✅ 寫入檔案: ${filePath}`);
  }

  /**
   * 執行指令集中的指令
   */
  async executeCommand(command, context = {}) {
    const { command: cmdStr, category, name, description } = command;

    console.log(`\n📋 執行指令: ${name}`);
    if (description) {
      console.log(`   說明: ${description}`);
    }

    try {
      // 解析命令字串
      const parts = cmdStr.split(/\s+/);
      const cmd = parts[0].replace(/^\.\//, ""); // 處理 ./cmd 格式
      const args = parts.slice(1).map((arg) => {
        // 替換變數
        return arg.replace(/\{(\w+)\}/g, (match, key) => {
          return context[key] || match;
        });
      });

      // 如果是相對路徑命令，需要解析完整路徑
      if (parts[0].startsWith("./")) {
        const cmdPath = path.join(this.projectRoot, parts[0]);
        if (fs.existsSync(cmdPath)) {
          return this.runCommand(cmdPath, args, { cwd: this.projectRoot });
        }
      }

      return this.runCommand(cmd, args);
    } catch (error) {
      console.error(`❌ 執行失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * 根據檔案結構要求建立檔案
   */
  setupFileStructure(fileStructure, sourceDir = null) {
    console.log("\n📁 建立專案結構...");

    for (const [relativePath, description] of Object.entries(fileStructure)) {
      const fullPath = path.join(this.projectRoot, relativePath);
      const dir = path.dirname(fullPath);

      // 確保資料夾存在
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 如果檔案不存在，嘗試從來源複製或建立空檔案
      if (!fs.existsSync(fullPath)) {
        if (sourceDir) {
          const sourcePath = path.join(sourceDir, relativePath);
          if (fs.existsSync(sourcePath)) {
            this.copyFile(sourcePath, relativePath);
            continue;
          }
        }

        // 建立空檔案（如果需要的話）
        if (relativePath.endsWith("/")) {
          // 這是資料夾
          fs.mkdirSync(fullPath, { recursive: true });
        } else {
          // 這是檔案
          fs.writeFileSync(fullPath, "");
          console.log(`✅ 建立: ${relativePath}`);
        }
      }
    }
  }

  /**
   * 取得執行摘要
   */
  getSummary() {
    return {
      totalSteps: this.executedSteps.length,
      successSteps: this.executedSteps.filter((s) => s.success).length,
      failedSteps: this.errors.length,
      errors: this.errors,
      steps: this.executedSteps,
    };
  }
}
