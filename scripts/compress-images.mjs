import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public');

// Images to compress
const images = [
  'logo-dark.png',
  'logo.png',
  'night.jpg',
  'rainy_dark.jpg',
  'stormy_clouds.jpg',
  'stormy_dark.jpg',
  'wind_radar.jpg',
  'wind_radar_light.jpg'
];

async function compressImage(filename) {
  const inputPath = path.join(publicDir, filename);
  const ext = path.extname(filename);
  const baseName = path.basename(filename, ext);
  const outputPath = path.join(publicDir, `${baseName}.webp`);

  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return;
  }

  try {
    const info = await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);

    const inputSize = fs.statSync(inputPath).size;
    const outputSize = info.size;
    const savings = ((inputSize - outputSize) / inputSize * 100).toFixed(1);

    console.log(`✅ ${filename} → ${baseName}.webp`);
    console.log(`   ${(inputSize/1024).toFixed(1)}KB → ${(outputSize/1024).toFixed(1)}KB (${savings}% reduction)\n`);
  } catch (error) {
    console.error(`❌ Error compressing ${filename}:`, error.message);
  }
}

console.log('🖼️  Starting image compression to WebP format...\n');

for (const image of images) {
  await compressImage(image);
}

console.log('✨ Image compression complete!');
console.log('💡 Remember to update component imports to use .webp extensions');
