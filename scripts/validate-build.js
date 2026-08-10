import fs from 'fs';
import path from 'path';

const outputDir = path.resolve(process.cwd(), '.output');
const serverDir = path.join(outputDir, 'server');
const publicAssetsDir = path.join(outputDir, 'public', 'assets');

console.log('--- Post-build Validation ---');

if (!fs.existsSync(serverDir)) {
  console.error('❌ Error: .output/server directory does not exist.');
  process.exit(1);
}

if (!fs.existsSync(publicAssetsDir)) {
  console.error('❌ Error: .output/public/assets directory does not exist.');
  process.exit(1);
}

// Function to get all files recursively
function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const serverFiles = getAllFiles(serverDir);
const publicAssets = fs.readdirSync(publicAssetsDir);
console.log(`Found ${publicAssets.length} assets in .output/public/assets.`);

let hasError = false;

// Regex to find CSS and JS asset references
// Matches: "/assets/something.css" or "/assets/something.js"
const assetRegex = /["']\/assets\/([^"'\\]+\.(css|js))["']/g;

const checkedAssets = new Set();

for (const file of serverFiles) {
  // Only check JS/MJS/CJS/HTML files
  if (!/\.(js|mjs|cjs|html|json)$/.test(file)) continue;

  const content = fs.readFileSync(file, 'utf-8');
  let match;

  while ((match = assetRegex.exec(content)) !== null) {
    const assetName = match[1];

    // Prevent double-logging for the same asset in the same file
    if (checkedAssets.has(assetName)) continue;
    checkedAssets.add(assetName);

    const assetPath = path.join(publicAssetsDir, assetName);
    if (!fs.existsSync(assetPath)) {
      console.error(`❌ Error: Asset referenced in ${file}`);
      console.error(`   Reference: /assets/${assetName}`);
      console.error(`   Status: File does NOT exist in .output/public/assets/`);
      hasError = true;
    } else {
       console.log(`✅ Verified asset exists: ${assetName}`);
    }
  }
}

if (hasError) {
  console.error('❌ Build validation failed. There are broken asset references in the SSR build.');
  process.exit(1);
}

console.log('✅ Post-build validation passed successfully.');
