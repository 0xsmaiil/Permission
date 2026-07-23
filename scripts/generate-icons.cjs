const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

const svgIcon = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fbbf24"/>
      <stop offset="100%" style="stop-color:#eab308"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <text x="${size / 2}" y="${size * 0.62}" font-size="${size * 0.45}" font-weight="800" fill="#1e293b" text-anchor="middle" font-family="system-ui, sans-serif">P</text>
</svg>`;

async function generate() {
  for (const size of [192, 512]) {
    const svg = svgIcon(size);
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, `icon-${size}.png`));
    console.log(`Created icon-${size}.png`);
  }
}

generate().catch(console.error);
