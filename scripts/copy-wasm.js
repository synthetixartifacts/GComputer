#!/usr/bin/env node

/**
 * Copy SQL WASM file to dist directory
 * This script ensures the sql.js WASM file is available for the database
 */

const fs = require('fs');
const path = require('path');

const SOURCE_WASM = path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm');
const DEST_DIR = path.join(__dirname, '../dist/main');
const DEST_WASM = path.join(DEST_DIR, 'sql-wasm.wasm');

// Ensure destination directory exists
if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

// Copy WASM file if source exists
if (fs.existsSync(SOURCE_WASM)) {
  fs.copyFileSync(SOURCE_WASM, DEST_WASM);
  console.log('[copy-wasm] Copied sql-wasm.wasm to dist/main/');
} else {
  console.error('[copy-wasm] Source WASM file not found:', SOURCE_WASM);
  process.exit(1);
}