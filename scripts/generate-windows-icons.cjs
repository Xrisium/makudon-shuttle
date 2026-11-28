// Design/export tool only. Requires an existing sharp installation, not an app dependency.
// Run: node scripts/generate-windows-icons.cjs
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'assets', 'platform', 'windows');
const sourcePath = 'assets/brand/source/makudon-shuttle-icon.svg';
const sourceHash = 'a2970c992f1ecb559fa4c1d032106092ac59f17dfc4a16ccbfa3880ede00bae7';
const sizes = [16, 20, 24, 32, 40, 48, 64, 96, 128, 256, 512, 1024];
const icoSizes = sizes.filter(size => size <= 256);
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

// Classic 32-bit icon DIB: bottom-up BGRA pixels followed by the padded AND mask.
// Use DIB frames below 256px; Windows 10 also supports a PNG frame at 256px.
function dibFrame(rgba, size) {
  const maskStride = Math.ceil(size / 32) * 4;
  const pixels = Buffer.alloc(size * size * 4);
  const mask = Buffer.alloc(maskStride * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      const dst = ((size - 1 - y) * size + x) * 4;
      pixels[dst] = rgba[src + 2];
      pixels[dst + 1] = rgba[src + 1];
      pixels[dst + 2] = rgba[src];
      pixels[dst + 3] = rgba[src + 3];
      if (rgba[src + 3] === 0) {
        mask[(size - 1 - y) * maskStride + (x >> 3)] |= 0x80 >> (x & 7);
      }
    }
  }
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(size, 4);
  header.writeInt32LE(size * 2, 8);
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);
  header.writeUInt32LE(pixels.length + mask.length, 20);
  return Buffer.concat([header, pixels, mask]);
}

function packIco(frames) {
  const directory = Buffer.alloc(6 + frames.length * 16);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(frames.length, 4);
  let offset = directory.length;
  frames.forEach(({ size, data }, index) => {
    const at = 6 + index * 16;
    directory[at] = size === 256 ? 0 : size;
    directory[at + 1] = size === 256 ? 0 : size;
    directory.writeUInt16LE(1, at + 4);
    directory.writeUInt16LE(32, at + 6);
    directory.writeUInt32LE(data.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([directory, ...frames.map(frame => frame.data)]);
}

async function main() {
  const source = fs.readFileSync(path.join(root, sourcePath));
  if (hash(source) !== sourceHash) throw new Error('Main logo changed; review the export design before updating its source hash.');
  const group = source.toString('utf8').match(/<g\b[\s\S]*<\/g>/)?.[0];
  if (!group) throw new Error('Missing source SVG geometry');
  // Retain the complete 100 x 100 replacement logo viewport and its group translation.
  // The platform backplate is separate from the transparent brand masters.
  if (!/viewBox="0 0 100 100"/.test(source.toString('utf8'))) throw new Error('Expected the current 100-square logo');
  const master = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" role="img" aria-labelledby="title desc">
  <title id="title">Makudon Shuttle</title>
  <desc id="desc">Windows app icon. Original logo on a paper-white rounded backplate, with transparent corners.</desc>
  <rect x="0.5" y="0.5" width="99" height="99" rx="21" fill="#F7F7F5" stroke="#E3E4DF" stroke-width="1"/>
  ${group.replace('#222222', '#272827')}
</svg>
`;
  fs.mkdirSync(path.join(outputDir, 'png'), { recursive: true });
  const outputs = new Map([['makudon-shuttle-app-icon.svg', Buffer.from(master)]]);
  const pngs = new Map();
  for (const size of sizes) {
    // Rasterize the vector at 4x the requested size, then antialias independently.
    const vector = master.replace('width="100" height="100"', `width="${size * 4}" height="${size * 4}"`);
    const png = await sharp(Buffer.from(vector))
      .resize(size, size, { kernel: 'lanczos3' }).ensureAlpha()
      .png({ compressionLevel: 9, palette: false }).toBuffer();
    pngs.set(size, png);
    outputs.set(`png/makudon-shuttle-${size}.png`, png);
  }
  const frames = [];
  for (const size of icoSizes) {
    const png = pngs.get(size);
    const data = size === 256 ? png : dibFrame(await sharp(png).ensureAlpha().raw().toBuffer(), size);
    frames.push({ size, data });
  }
  outputs.set('makudon-shuttle.ico', packIco(frames));
  // Preview at actual pixel sizes on both backgrounds; this image is not an app asset.
  const image = (size, x, y) => `<image x="${x}" y="${y}" width="${size}" height="${size}" href="data:image/png;base64,${pngs.get(size).toString('base64')}"/>`;
  let sheet = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="984" viewBox="0 0 1200 984"><rect width="1200" height="984" fill="#EEEFEA"/>';
  sheet += '<g font-family="Segoe UI, sans-serif"><text x="40" y="48" font-size="24" fill="#272827">Makudon Shuttle / Windows app icon</text><text x="40" y="78" font-size="14" fill="#686B67">Original logo geometry · 12 PNG sizes · 10 ICO frames · transparent corners</text>';
  sheet += '<rect x="32" y="104" width="552" height="340" rx="22" fill="#FFFFFF"/><rect x="616" y="104" width="552" height="340" rx="22" fill="#1E201F"/>';
  sheet += '<text x="56" y="138" font-size="12" fill="#686B67">LIGHT BACKGROUND / 256px</text><text x="640" y="138" font-size="12" fill="#A4ADA3">DARK BACKGROUND / 256px</text>';
  sheet += image(256, 180, 164) + image(256, 764, 164);
  for (const [rowY, bg, fg] of [[472, '#FFFFFF', '#686B67'], [712, '#1E201F', '#A4ADA3']]) {
    sheet += `<rect x="32" y="${rowY}" width="1136" height="216" rx="18" fill="${bg}"/>`;
    sheet += `<text x="56" y="${rowY + 30}" font-size="12" fill="${fg}">ACTUAL PIXEL SIZES / 100%</text>`;
    let x = 40;
    for (const size of icoSizes.filter(size => size < 256)) {
      const cellWidth = size + 60;
      sheet += image(size, x + 30, rowY + 48 + (128 - size) / 2);
      sheet += `<text x="${x + cellWidth / 2}" y="${rowY + 198}" text-anchor="middle" font-size="12" fill="${fg}">${size}px</text>`;
      x += cellWidth;
    }
  }
  sheet += '<text x="40" y="960" font-size="12" fill="#686B67">PNG: 16–1024px / ICO: 16–256px / vector source and per-file hashes retained</text></g></svg>';
  outputs.set('preview.png', await sharp(Buffer.from(sheet)).png().toBuffer());
  for (const [name, data] of outputs) fs.writeFileSync(path.join(outputDir, name), data);
  const provenance = {
    date: '2026-11-28',
    status: 'exported and decoded; not embedded in a Windows executable yet',
    source: sourcePath,
    source_sha256: sourceHash,
    design: {
      viewport: [0, 0, 100, 100], source_viewport: [0, 0, 100, 100],
      source_transform: 'original group translation retained; no additional transform', geometry_modifications: 'none',
      foreground: '#272827', backplate: '#F7F7F5', outline: '#E3E4DF',
      backplate_rect: { x: 0.5, y: 0.5, width: 99, height: 99, rx: 21, stroke_width: 1 },
      alpha: 'transparent corners; opaque light backplate',
    },
    png_sizes: sizes, ico_sizes: icoSizes,
    ico_encoding: '32-bit BGRA DIB + 1-bit AND mask below 256; RGBA PNG at 256',
    rasterization: 'each size independently rendered from vector at 4x, Lanczos3 downsample, RGBA PNG',
    tool: { sharp: sharp.versions.sharp, vips: sharp.versions.vips, rsvg: sharp.versions.rsvg },
    generator: 'scripts/generate-windows-icons.cjs',
    references: [
      'https://learn.microsoft.com/en-us/windows/apps/design/iconography/app-icon-construction',
      'https://learn.microsoft.com/en-us/windows/win32/menurc/about-icons',
    ],
    outputs_sha256: Object.fromEntries([...outputs].map(([name, data]) => [name, hash(data)])),
  };
  fs.writeFileSync(path.join(outputDir, 'provenance.json'), JSON.stringify(provenance, null, 2) + '\n');
  console.log(JSON.stringify({ png_sizes: sizes, ico_sizes: icoSizes, files: outputs.size + 1 }));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
