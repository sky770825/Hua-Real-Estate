import fs from "fs";
import path from "path";

/**
 * 讀取自動化指令資料庫
 */
export function loadCommands(configPath = "automation_commands.json") {
  if (!fs.existsSync(configPath)) {
    throw new Error(`指令檔案不存在: ${configPath}`);
  }

  const content = fs.readFileSync(configPath, "utf8");
  const config = JSON.parse(content);

  return {
    metadata: config.metadata,
    categories: config.categories || [],
    commands: config.commands || [],
    file_structure: config.file_structure || {},
    setup_steps: config.setup_steps || [],
    features: config.features || [],
    notion_sop: config.notion_sop || null,
  };
}

/**
 * 讀取 SOP Markdown 檔案
 */
export function loadSOP(sopPath = "SOP_NOTION.md") {
  if (!fs.existsSync(sopPath)) {
    return null;
  }

  const content = fs.readFileSync(sopPath, "utf8");
  
  // 解析 Markdown 結構
  const sections = {};
  let currentSection = null;
  let currentContent = [];

  for (const line of content.split(/\r?\n/)) {
    // 檢查標題
    const h1Match = line.match(/^# (.+)$/);
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);

    if (h1Match) {
      if (currentSection) {
        sections[currentSection] = currentContent.join("\n");
      }
      currentSection = h1Match[1].trim();
      currentContent = [];
    } else if (h2Match) {
      if (currentSection) {
        sections[currentSection] = currentContent.join("\n");
      }
      currentSection = h2Match[1].trim();
      currentContent = [];
    } else if (h3Match) {
      if (currentSection) {
        sections[currentSection] = currentContent.join("\n");
      }
      currentSection = h3Match[1].trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentSection) {
    sections[currentSection] = currentContent.join("\n");
  }

  return {
    raw: content,
    sections,
    path: sopPath,
  };
}

/**
 * 根據分類取得指令
 */
export function getCommandsByCategory(commands, categoryId) {
  return commands.filter((cmd) => cmd.category === categoryId);
}

/**
 * 根據標籤搜尋指令
 */
export function searchCommandsByTag(commands, tag) {
  return commands.filter((cmd) => cmd.tags && cmd.tags.includes(tag));
}
