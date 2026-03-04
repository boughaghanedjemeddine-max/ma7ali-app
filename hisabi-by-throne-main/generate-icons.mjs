/**
 * generate-icons.mjs
 * Generates all PWA icon PNGs from source-icon.jpg using sharp.
 * Run: node generate-icons.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'fs';

const SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const SOURCE = 'source-icon.jpg';
const OUT_DIR = 'public/icons';

mkdirSync(OUT_DIR, { recursive: true });

for (const size of SIZES) {
  const outPath = `${OUT_DIR}/icon-${size}x${size}.png`;
  await sharp(SOURCE)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png({ quality: 90 })
    .toFile(outPath);
  console.log(`✓ ${outPath}`);
}

// apple-touch-icon (180x180) at public root
await sharp(SOURCE)
  .resize(180, 180, { fit: 'cover', position: 'centre' })
  .png({ quality: 90 })
  .toFile('public/apple-touch-icon.png');
console.log('✓ public/apple-touch-icon.png');

// favicon (32x32)
await sharp(SOURCE)
  .resize(32, 32, { fit: 'cover', position: 'centre' })
  .png({ quality: 90 })
  .toFile('public/favicon.png');
console.log('✓ public/favicon.png');

console.log('\n🎉 All icons generated from source-icon.jpg!');
