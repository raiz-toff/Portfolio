import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// 1. UPDATE THIS URL once you create the new repo!
const REPO_URL = "https://github.com/raiz-toff/network-generator.git"; 
const TARGET_DIR = "src/content/docs/projects/network-generator";
const TEMP_DIR = ".temp-network-generator";

// Sidebar configuration for the synced files
const SIDEBAR_META = {
  "index.md": { title: "Overview", order: 1 },
};

console.log("🔄 Syncing Network Generator documentation...");

try {
  // Clone or Update the remote repository
  if (fs.existsSync(TEMP_DIR)) {
    console.log("  Pulling latest changes...");
    try {
        execSync(`git -C ${TEMP_DIR} pull`, { stdio: "pipe" });
    } catch (e) {
        console.warn("  Pull failed, attempting re-clone...");
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
        execSync(`git clone --depth 1 ${REPO_URL} ${TEMP_DIR}`, { stdio: "pipe" });
    }
  } else {
    console.log("  Cloning repository...");
    execSync(`git clone --depth 1 ${REPO_URL} ${TEMP_DIR}`, { stdio: "pipe" });
  }

  // Source Docs Path
  const sourceDocs = path.join(TEMP_DIR, "docs");

  if (fs.existsSync(sourceDocs)) {
    // Ensure Target Directory exists
    if (!fs.existsSync(TARGET_DIR)) {
      fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    // Recursively sync files and inject frontmatter
    const syncDir = (currentPath, targetPath) => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      entries.forEach((entry) => {
        const fullSrcPath = path.join(currentPath, entry.name);
        const fullDestPath = path.join(targetPath, entry.name);

        if (entry.isDirectory()) {
          if (!fs.existsSync(fullDestPath)) {
            fs.mkdirSync(fullDestPath, { recursive: true });
          }
          syncDir(fullSrcPath, fullDestPath);
        } else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
          let content = fs.readFileSync(fullSrcPath, "utf-8");
          
          // Get relative path from sourceDocs to find meta
          const relPath = path.relative(sourceDocs, fullSrcPath);
          const meta = SIDEBAR_META[relPath] || { 
            title: entry.name.replace(".md", "").replace(".mdx", ""), 
            order: 100 
          };

          const frontmatter = `---
title: ${meta.title}
description: Automatically synced documentation for ${meta.title}.
editUrl: ${REPO_URL.replace(".git", "")}/edit/main/docs/${relPath}
sidebar:
  order: ${meta.order}
---

`;
          // Prepend frontmatter (cleaning up existing if present)
          if (content.startsWith("---")) {
            const parts = content.split("---");
            if (parts.length > 2) {
              content = parts.slice(2).join("---").trim();
            }
          }

          fs.writeFileSync(fullDestPath, frontmatter + "\n" + content);
          console.log(`  ✅ Synced: ${relPath}`);
        }
      });
    };

    syncDir(sourceDocs, TARGET_DIR);
    console.log("✨ Network Generator documentation sync complete!");
  } else {
    console.warn("⚠️ Warning: 'docs' folder not found in the remote repository.");
  }
} catch (error) {
  console.error("❌ Error syncing Network Generator docs:", error.message);
}
