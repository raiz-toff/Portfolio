import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://labs.rajkumarneupane.com/';
const CONTENT_DIRS = [
  'src/content/docs/labs',
  'src/content/docs/projects',
  'src/content/docs/CCNA Labs'
];

function parseFrontMatter(content) {
  const fmRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
  const match = content.match(fmRegex);
  if (!match) return null;

  const fmString = match[1];
  const fm = {};
  fmString.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Basic YAML parsing
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          fm[key] = JSON.parse(value.replace(/'/g, '"'));
        } catch (e) {
          fm[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        }
      } else if (value.startsWith('"') && value.endsWith('"')) {
        fm[key] = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        fm[key] = value.slice(1, -1);
      } else {
        fm[key] = value;
      }
    }
  });
  return fm;
}

function processDirectory(dir, parentPath = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let results = [];

  // Look for index-like files (index.md, index.mdx, overview.md, overview.mdx) case-insensitive
  const indexFile = entries.find(e => {
    const name = e.name.toLowerCase();
    return name === 'index.md' || name === 'index.mdx' || name === 'overview.md' || name === 'overview.mdx';
  });

  if (indexFile) {
    const content = fs.readFileSync(path.join(dir, indexFile.name), 'utf-8');
    const fm = parseFrontMatter(content);
    if (fm) {
      let title = fm.title || path.basename(dir);
      if (title.toLowerCase() === 'overview' || title.toLowerCase() === 'index') {
        title = path.basename(dir).replace(/[-_]/g, ' ');
        title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }

      // Format URL path: lowercase and hyphens
      const relPath = path.join(parentPath, path.basename(dir))
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/\\/g, '/');
      const externalUrl = `${BASE_URL}${relPath}/`;
      
      // Clean up date (ensure it's YYYY-MM-DD)
      let date = fm.date || '2025-01-01';
      if (typeof date === 'string' && date.includes('T')) {
        date = date.split('T')[0];
      }

      results.push({
        title: title,
        date: date,
        description: fm.description || '',
        tags: Array.isArray(fm.tags) ? fm.tags : (fm.tags ? [fm.tags] : []),
        categories: Array.isArray(fm.categories) ? fm.categories : (fm.categories ? [fm.categories] : ['Development']),
        externalUrl: externalUrl
      });
    }
  }

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'images') {
      const subResults = processDirectory(path.join(dir, entry.name), path.join(parentPath, path.basename(dir)));
      results = results.concat(subResults);
    }
  }

  return results;
}

const allResults = [];
CONTENT_DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    const results = processDirectory(dir);
    allResults.push(...results);
  }
});

allResults.forEach(res => {
  console.log('---');
  console.log(`title: "${res.title.replace(/"/g, '\\"')}"`);
  console.log(`date: ${res.date}`);
  console.log(`description: "${res.description.replace(/"/g, '\\"')}"`);
  console.log(`tags: ${JSON.stringify(res.tags)}`);
  console.log(`categories: ${JSON.stringify(res.categories)}`);
  console.log(`externalUrl: "${res.externalUrl}"`);
  console.log('---\n');
});
