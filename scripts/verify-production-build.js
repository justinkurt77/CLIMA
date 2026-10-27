#!/usr/bin/env node

/**
 * Production Build Verification Script
 * 
 * Scans the built dist/ directory for console.log statements
 * to ensure all debugging code has been stripped from production
 * 
 * Usage: node verify-production-build.js
 * Exit codes:
 *   0 = Success (no console statements found)
 *   1 = Failure (console statements found)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, 'dist');
const PATTERNS = [
  /console\.log\(/g,
  /console\.warn\(/g,
  /console\.error\(/g,
  /console\.debug\(/g,
  /console\.info\(/g,
  /console\.table\(/g,
  /console\.dir\(/g,
  /console\.trace\(/g,
];

let totalFiles = 0;
let scannedFiles = 0;
const violations = [];

/**
 * Recursively scan directory for JS files
 */
function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      scanFile(fullPath);
    }
  }
}

/**
 * Scan a single file for console statements
 */
function scanFile(filePath) {
  totalFiles++;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    scannedFiles++;
    
    for (const pattern of PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        violations.push({
          file: path.relative(DIST_DIR, filePath),
          matches: matches.length,
          pattern: pattern.toString(),
        });
      }
    }
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Verifying production build...\n');
  
  // Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist/ directory not found. Run `npm run build` first.\n');
    process.exit(1);
  }
  
  // Scan all JS files
  scanDirectory(DIST_DIR);
  
  console.log(`📊 Scanned ${scannedFiles}/${totalFiles} JavaScript files\n`);
  
  // Report results
  if (violations.length === 0) {
    console.log('✅ Production build verified: No console statements found');
    console.log('✨ Build is safe for production deployment\n');
    process.exit(0);
  } else {
    console.log('❌ Console statements found in production build:\n');
    
    for (const violation of violations) {
      console.log(`  File: ${violation.file}`);
      console.log(`  Pattern: ${violation.pattern}`);
      console.log(`  Occurrences: ${violation.matches}`);
      console.log('');
    }
    
    console.log('⚠️  Build contains console statements that should be removed');
    console.log('💡 Run `npm run build` again to regenerate with terser minification\n');
    process.exit(1);
  }
}

main();
