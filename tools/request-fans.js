/**
 * BabyVal Fan Request Fulfillment Script
 * Usage: node request-fans.js <fan-name> <quantity> <type>
 *
 * Examples:
 *   node request-fans.js Budi 2 short
 *   node request-fans.js "Azry" 3 medium
 *   node request-fans.js "Juninsui" 1 long
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ===== CONFIGURATION =====
const DB_PATH = 'C:/Users/Devata/.openclaw/workspace/finance-deosela/tools/request-fans-db.json';
const DIGITAL_PRODUCT_BASE = 'G:/.shortcut-targets-by-id/1s1X5XEbv_oGHelprrV3pE0JarvE4URDp/Digital Product';
const REQUEST_FANS_PATH = path.join(DIGITAL_PRODUCT_BASE, 'Request Fans');

const TYPE_MAP = {
  short:  'Short Video 0-3 min',
  medium: 'Medium Video 3-6 min',
  long:   'Long Video 6+ min',
};

// ===== HELPERS =====

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Database not found at ${DB_PATH}. Run initial scan first.`);
  }
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

/**
 * Parse a fan folder name into { name, index }
 * "trenstyp 7"  → { name: "trenstyp",    index: 7 }
 * "Azry 1"      → { name: "Azry",        index: 1 }
 * "Juninsui - Special Request" → { name: "Juninsui - Special Request", index: 0 }
 */
function parseFanName(folderName) {
  const m = folderName.match(/^(.+?) (\d+)$/);
  if (m) {
    return { name: m[1], index: parseInt(m[2], 10) };
  }
  return { name: folderName, index: 0 };
}

/**
 * Format folder name: "Budi" + 0 → "Budi", "Budi" + 4 → "Budi 4"
 */
function formatFolderName(name, index) {
  return index === 0 ? name : `${name} ${index}`;
}

/**
 * Copy a file using Node.js native fs.copyFileSync.
 * Works reliably on Windows with Google Drive paths.
 */
function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
}

/**
 * Shuffle array (Fisher-Yates)
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== COMMANDS =====

/**
 * Initial scan: walk Request Fans folders and build the database
 */
function scan() {
  console.log('\n🔍 Scanning Request Fans folder...\n');

  if (!fs.existsSync(REQUEST_FANS_PATH)) {
    console.error(`❌ Request Fans folder not found: ${REQUEST_FANS_PATH}`);
    process.exit(1);
  }

  const fans = {};

  const entries = fs.readdirSync(REQUEST_FANS_PATH, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'desktop.ini') continue;

    const fanDir = path.join(REQUEST_FANS_PATH, entry.name);
    const { name, index } = parseFanName(entry.name);

    if (!fans[name]) {
      fans[name] = { index: 0, delivered: [], folders: [] };
    }

    // Update highest index
    if (index > fans[name].index) fans[name].index = index;

    // Track folder
    if (!fans[name].folders.includes(entry.name)) {
      fans[name].folders.push(entry.name);
    }

    // Collect mp4 files delivered to this fan
    const mp4s = fs.readdirSync(fanDir).filter(f => f.toLowerCase().endsWith('.mp4'));
    for (const mp4 of mp4s) {
      if (!fans[name].delivered.includes(mp4)) {
        fans[name].delivered.push(mp4);
      }
    }
  }

  const db = { fans };
  saveDB(db);

  console.log('✅ Database built successfully!\n');
  const fanNames = Object.keys(fans).sort();
  for (const fn of fanNames) {
    const f = fans[fn];
    const fileCount = f.delivered.length;
    const folderCount = f.folders.length;
    console.log(`  📁 ${fn}`);
    console.log(`     Index: ${f.index} | Folders: ${folderCount} | Delivered files: ${fileCount}`);
    if (f.delivered.length > 0) {
      f.delivered.forEach(d => console.log(`       → ${d}`));
    }
  }
  console.log(`\n📄 Saved to: ${DB_PATH}`);
  console.log(`   Total fans: ${fanNames.length}`);
}

/**
 * Fulfill a fan request
 */
function fulfill(fanName, quantity, type) {
  // Normalize type
  const typeKey = type.toLowerCase();
  if (!TYPE_MAP[typeKey]) {
    console.error(`❌ Unknown type: "${type}". Use: short, medium, or long`);
    process.exit(1);
  }

  const db = loadDB();
  const sourceDir = path.join(DIGITAL_PRODUCT_BASE, TYPE_MAP[typeKey]);
  const quantityNum = parseInt(quantity, 10);

  // Get all mp4 files from source folder
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Source folder not found: ${sourceDir}`);
    process.exit(1);
  }

  const allFiles = fs.readdirSync(sourceDir).filter(f => f.toLowerCase().endsWith('.mp4'));

  // Get fan record (or create new)
  let fanRecord = db.fans[fanName];
  if (!fanRecord) {
    fanRecord = { index: 0, delivered: [], folders: [] };
    db.fans[fanName] = fanRecord;
  }

  // Filter out already-delivered files
  const available = allFiles.filter(f => !fanRecord.delivered.includes(f));

  if (available.length === 0) {
    console.error(`\n❌ No ${typeKey} videos left to send to ${fanName} (all already delivered).`);
    process.exit(1);
  }

  if (available.length < quantityNum) {
    console.warn(`\n⚠️  Only ${available.length} unwatched ${typeKey} videos available (requested ${quantityNum}).`);
  }

  // Pick random videos
  const shuffled = shuffle(available);
  const selected = shuffled.slice(0, quantityNum);

  // Determine next folder index
  const nextIndex = fanRecord.index + 1;
  const folderName = formatFolderName(fanName, nextIndex);
  const fanFolderPath = path.join(REQUEST_FANS_PATH, folderName);

  // Create folder
  fs.mkdirSync(fanFolderPath, { recursive: true });

  // Copy files
  console.log(`\n📂 Created folder: ${folderName}/`);
  console.log('📦 Contains:');
  for (const file of selected) {
    const src = path.join(sourceDir, file);
    const dest = path.join(fanFolderPath, file);
    copyFile(src, dest);
    console.log(`   → ${file}`);
    fanRecord.delivered.push(file);
  }

  // Update folder list
  fanRecord.index = nextIndex;
  fanRecord.folders.push(folderName);

  // Save DB
  saveDB(db);

  console.log('\n🗂️  Google Drive link:');
  console.log(`   https://drive.google.com/drive/folders/1s1X5XEbv_oGHelprrV3pE0JarvE4URDp/Digital%20Product/Request%20Fans/${encodeURIComponent(folderName)}`);
  console.log('\n✅ Done!\n');
}

// ===== CLI =====

const [, , cmd, ...args] = process.argv;

if (!cmd) {
  console.log(`
🎬 BabyVal Fan Request System

Usage:
  node request-fans.js scan                        — Build DB from existing Request Fans folders
  node request-fans.js <fan-name> <qty> <type>     — Fulfill a request

Examples:
  node request-fans.js scan
  node request-fans.js Budi 2 short
  node request-fans.js "Azry" 3 medium
  node request-fans.js "Juninsui" 1 long

Types: short (0-3 min) | medium (3-6 min) | long (6+ min)
`);
  process.exit(0);
}

if (cmd === 'scan') {
  scan();
} else {
  const [fanName, quantity, type] = args;
  if (!fanName || !quantity || !type) {
    console.error('❌ Missing arguments. Usage: node request-fans.js <fan-name> <qty> <type>');
    process.exit(1);
  }
  fulfill(fanName, quantity, type);
}