import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');

// SVG with padding for better icon appearance
const createIconSvg = (size) => {
  const padding = Math.floor(size * 0.1);
  const iconSize = size - padding * 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#1e293b" rx="${Math.floor(size * 0.15)}"/>
    <g transform="translate(${padding}, ${padding})">
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    </g>
  </svg>`;
};

// Apple touch icon (needs different styling)
const createAppleIconSvg = (size) => {
  const padding = Math.floor(size * 0.15);
  const iconSize = size - padding * 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#1e293b"/>
    <g transform="translate(${padding}, ${padding})">
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    </g>
  </svg>`;
};

async function generateIcons() {
  try {
    // Ensure public directory exists
    mkdirSync(publicDir, { recursive: true });

    // Generate PWA icons
    const sizes = [192, 512];

    for (const size of sizes) {
      const svg = Buffer.from(createIconSvg(size));
      await sharp(svg)
        .resize(size, size)
        .png()
        .toFile(join(publicDir, `pwa-${size}x${size}.png`));
      console.log(`Generated pwa-${size}x${size}.png`);
    }

    // Generate Apple Touch Icon (180x180)
    const appleSvg = Buffer.from(createAppleIconSvg(180));
    await sharp(appleSvg)
      .resize(180, 180)
      .png()
      .toFile(join(publicDir, 'apple-touch-icon.png'));
    console.log('Generated apple-touch-icon.png');

    // Generate mask icon for Safari (monochrome SVG)
    const maskIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 24 24" fill="black">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>`;

    await sharp(Buffer.from(maskIconSvg))
      .resize(512, 512)
      .toFile(join(publicDir, 'mask-icon.svg'));
    console.log('Generated mask-icon.svg');

    console.log('\nAll PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
