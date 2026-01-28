import fs from "fs";
import path from "path";

/**
 * 掃描專案資料夾結構
 */
export function scanProject(projectRoot = process.cwd(), options = {}) {
  const {
    ignoreDirs = ["node_modules", ".git", ".next", "dist", "build", ".cursor"],
    ignoreFiles = [".DS_Store", ".env"],
    maxDepth = 10,
    includeHidden = false,
  } = options;

  const structure = {
    root: projectRoot,
    files: [],
    dirs: [],
    tree: {},
    stats: {
      totalFiles: 0,
      totalDirs: 0,
      fileTypes: {},
    },
  };

  function shouldIgnore(item, isDir) {
    // 檢查隱藏檔案/資料夾
    if (!includeHidden && item.startsWith(".")) {
      return true;
    }

    if (isDir && ignoreDirs.includes(item)) {
      return true;
    }

    if (!isDir && ignoreFiles.includes(item)) {
      return true;
    }

    return false;
  }

  function scanDir(dirPath, relativePath = "", depth = 0) {
    if (depth > maxDepth) return;

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const itemName = entry.name;
        const itemPath = path.join(dirPath, itemName);
        const itemRelative = path.join(relativePath, itemName).replace(/\\/g, "/");

        if (shouldIgnore(itemName, entry.isDirectory())) {
          continue;
        }

        if (entry.isDirectory()) {
          structure.dirs.push(itemRelative);
          structure.totalDirs++;

          // 遞迴掃描子目錄
          scanDir(itemPath, itemRelative, depth + 1);
        } else {
          structure.files.push(itemRelative);
          structure.totalFiles++;

          // 統計檔案類型
          const ext = path.extname(itemName).slice(1) || "no-extension";
          structure.stats.fileTypes[ext] = (structure.stats.fileTypes[ext] || 0) + 1;
        }
      }
    } catch (err) {
      // 忽略權限錯誤等
      if (options.onError) {
        options.onError(err, dirPath);
      }
    }
  }

  scanDir(projectRoot);

  return structure;
}

/**
 * 檢查專案是否包含特定檔案/資料夾
 */
export function hasFile(projectRoot, filePath) {
  const fullPath = path.join(projectRoot, filePath);
  return fs.existsSync(fullPath);
}

/**
 * 檢查專案是否包含特定檔案類型
 */
export function hasFileType(projectRoot, extensions) {
  const exts = Array.isArray(extensions) ? extensions : [extensions];
  const structure = scanProject(projectRoot, { maxDepth: 5 });

  return structure.files.some((file) => {
    const ext = path.extname(file).slice(1);
    return exts.includes(ext);
  });
}

/**
 * 檢查專案類型（根據檔案結構推斷）
 */
export function detectProjectType(projectRoot) {
  const checks = {
    node: hasFile(projectRoot, "package.json"),
    nextjs: hasFile(projectRoot, "next.config.js") || hasFile(projectRoot, "next.config.mjs"),
    react: hasFile(projectRoot, "package.json") && hasFileType(projectRoot, ["jsx", "tsx"]),
    vite: hasFile(projectRoot, "vite.config.js") || hasFile(projectRoot, "vite.config.ts"),
    supabase: hasFile(projectRoot, "supabase/config.toml"),
    python: hasFile(projectRoot, "requirements.txt") || hasFile(projectRoot, "pyproject.toml"),
    go: hasFile(projectRoot, "go.mod"),
    rust: hasFile(projectRoot, "Cargo.toml"),
  };

  const types = Object.entries(checks)
    .filter(([_, exists]) => exists)
    .map(([type, _]) => type);

  return types.length > 0 ? types : ["unknown"];
}

/**
 * 讀取專案配置檔案
 */
export function readProjectConfig(projectRoot) {
  const configs = {};

  // package.json
  if (hasFile(projectRoot, "package.json")) {
    try {
      configs.package = JSON.parse(
        fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")
      );
    } catch (err) {
      // ignore
    }
  }

  // tsconfig.json
  if (hasFile(projectRoot, "tsconfig.json")) {
    try {
      configs.tsconfig = JSON.parse(
        fs.readFileSync(path.join(projectRoot, "tsconfig.json"), "utf8")
      );
    } catch (err) {
      // ignore
    }
  }

  // .env.example
  if (hasFile(projectRoot, ".env.example")) {
    try {
      configs.envExample = fs.readFileSync(
        path.join(projectRoot, ".env.example"),
        "utf8"
      );
    } catch (err) {
      // ignore
    }
  }

  return configs;
}
