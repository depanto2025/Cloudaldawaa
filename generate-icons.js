import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public', 'favicon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.resolve('public', 'icon-192.png'));
  console.log('Generated icon-192.png');

  // 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public', 'icon-512.png'));
  console.log('Generated icon-512.png');

  // Apple touch icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.resolve('public', 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 32x32 PNG as favicon.png
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.resolve('public', 'favicon.png'));
  console.log('Generated favicon.png');
}

generate().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
