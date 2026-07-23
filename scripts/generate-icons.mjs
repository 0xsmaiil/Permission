import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

function createPNG(size) {
  const width = size;
  const height = size;
  const channels = 4;

  // Minimal PNG with a yellow background and dark text "P"
  // We'll create a simple solid yellow square PNG
  const rawData = new Uint8Array(width * height * channels);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const corner = Math.min(x, y, width - 1 - x, height - 1 - y);
      const r = Math.min(width, height) * 0.2;

      if (corner < r) {
        const d = Math.sqrt(
          Math.pow(corner === x ? x : (corner === y ? y : (corner === width - 1 - x ? width - 1 - x : height - 1 - y)), 2) +
          Math.pow(corner === x ? y : (corner === y ? x : (corner === width - 1 - x ? y : x)), 2)
        );
        if (d > r) {
          rawData[idx] = 248; rawData[idx + 1] = 249; rawData[idx + 2] = 252; rawData[idx + 3] = 0;
          continue;
        }
      }

      rawData[idx] = 234; rawData[idx + 1] = 179; rawData[idx + 2] = 8; rawData[idx + 3] = 255;
    }
  }

  // Write as raw RGBA for simplicity
  return rawData;
}

import { deflateSync } from "zlib";

for (const size of [192, 512]) {
  const rawData = createPNG(size);

  // Minimal valid PNG structure
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const typeBytes = new TextEncoder().encode(type);
    const length = new Uint8Array(4);
    new DataView(length.buffer).setUint32(0, data.length);

    const crcData = new Uint8Array(typeBytes.length + data.length);
    crcData.set(typeBytes, 0);
    crcData.set(data, typeBytes.length);

    const crc = new Uint8Array(4);
    let c = 0xffffffff;
    for (let i = 0; i < crcData.length; i++) {
      c ^= crcData[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    c ^= 0xffffffff;
    new DataView(crc.buffer).setUint32(0, c >>> 0);

    const result = new Uint8Array(4 + 4 + data.length + 4);
    result.set(length, 0);
    result.set(typeBytes, 4);
    result.set(data, 8);
    result.set(crc, 8 + data.length);
    return result;
  }

  // IHDR
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, size);
  dv.setUint32(4, size);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT - raw pixel data with filter byte (0) per row
  const scanlines = [];
  for (let y = 0; y < size; y++) {
    scanlines.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      scanlines.push(rawData[idx]);
      scanlines.push(rawData[idx + 1]);
      scanlines.push(rawData[idx + 2]);
      scanlines.push(rawData[idx + 3]);
    }
  }

  const compressed = deflateSync(new Uint8Array(scanlines));

  // IEND
  const iend = new Uint8Array(0);

  const png = new Uint8Array([
    ...signature,
    ...chunk("IHDR", ihdr),
    ...chunk("IDAT", compressed),
    ...chunk("IEND", iend),
  ]);

  writeFileSync(join(outDir, `icon-${size}.png`), png);
  console.log(`Created icon-${size}.png (${size}x${size})`);
}
