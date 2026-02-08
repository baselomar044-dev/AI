#!/usr/bin/env node
/**
 * 🎨 PWA Icon Generator
 * Generates all required icon sizes from a source SVG or PNG
 * 
 * Usage: node generate-icons.js [source-image]
 * 
 * Requirements: sharp (npm install sharp)
 */

const fs = require('fs');
const path = require('path');

// Try to load sharp, provide instructions if not available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('📦 Sharp not installed. Install it with: npm install sharp');
  console.log('📝 For now, creating placeholder SVG icons...\n');
  createPlaceholderIcons();
  process.exit(0);
}

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

async function generateIcons(sourcePath) {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const source = sourcePath || path.join(__dirname, '../public/icon-source.svg');
  
  if (!fs.existsSync(source)) {
    console.log('⚠️  Source icon not found. Creating placeholder icons...');
    createPlaceholderIcons();
    return;
  }

  console.log('🎨 Generating PWA icons...\n');

  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    
    await sharp(source)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 10, g: 15, b: 26, alpha: 1 } // #0a0f1a
      })
      .png()
      .toFile(outputPath);
    
    console.log(`  ✅ Generated: icon-${size}x${size}.png`);
  }

  // Generate badge icon (smaller, for notifications)
  await sharp(source)
    .resize(72, 72)
    .png()
    .toFile(path.join(OUTPUT_DIR, 'badge-72x72.png'));
  console.log('  ✅ Generated: badge-72x72.png');

  // Generate Apple Touch Icon
  await sharp(source)
    .resize(180, 180)
    .png()
    .toFile(path.join(OUTPUT_DIR, 'apple-touch-icon.png'));
  console.log('  ✅ Generated: apple-touch-icon.png');

  // Generate favicon
  await sharp(source)
    .resize(32, 32)
    .png()
    .toFile(path.join(OUTPUT_DIR, 'favicon-32x32.png'));
  console.log('  ✅ Generated: favicon-32x32.png');

  await sharp(source)
    .resize(16, 16)
    .png()
    .toFile(path.join(OUTPUT_DIR, 'favicon-16x16.png'));
  console.log('  ✅ Generated: favicon-16x16.png');

  console.log('\n🎉 All icons generated successfully!');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
}

function createPlaceholderIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Create SVG placeholder icons
  for (const size of ICON_SIZES) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#0a0f1a"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.35}" fill="url(#grad)"/>
  <text x="${size/2}" y="${size * 0.58}" font-family="Arial, sans-serif" font-size="${size * 0.4}" 
        font-weight="bold" fill="white" text-anchor="middle">T</text>
</svg>`;

    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.svg`);
    fs.writeFileSync(outputPath, svg);
    console.log(`  ✅ Created: icon-${size}x${size}.svg`);
  }

  // Create favicon SVG
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0a0f1a"/>
  <circle cx="16" cy="16" r="11" fill="#3b82f6"/>
  <text x="16" y="21" font-family="Arial" font-size="14" font-weight="bold" fill="white" text-anchor="middle">T</text>
</svg>`;
  fs.writeFileSync(path.join(OUTPUT_DIR, 'favicon.svg'), faviconSvg);
  console.log('  ✅ Created: favicon.svg');

  console.log('\n📝 Placeholder SVG icons created.');
  console.log('💡 For production, install sharp and provide a source image:');
  console.log('   npm install sharp');
  console.log('   node generate-icons.js path/to/your-icon.png');
}

// Run
const sourceArg = process.argv[2];
generateIcons(sourceArg);
