// Design-only contact sheet. Run with an existing sharp installation (NODE_PATH if needed).
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const brand = path.join(root, 'assets', 'brand');
function mark(name, x, y, w, color) {
  const source = fs.readFileSync(path.join(brand, `makudon-shuttle-${name}.svg`), 'utf8');
  const box = source.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  return source
    .replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${w * box[3] / box[2]}" `)
    .replaceAll('currentColor', color);
}
function text(x, y, value, size = 14, color = '#686B67', weight = 400) {
  return `<text x="${x}" y="${y}" font-family="Segoe UI, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${value}</text>`;
}
function rect(x, y, w, h, fill, r = 0, stroke = 'none') {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
}
const ink = '#272827', soft = '#E0E3DD';
let body = rect(0, 0, 1440, 1040, '#EEEFEA');
body += text(56, 56, 'MAKUDON SHUTTLE / BRAND ASSETS', 15, ink, 600);
body += text(56, 87, 'Fredoka Semibold 600 · outlined wordmark · original Shuttle symbol', 17);
body += rect(48, 118, 660, 206, '#F7F7F5', 22);
body += rect(732, 118, 660, 206, '#1E201F', 22);
body += text(76, 154, '01 / PAPER WHITE', 12);
body += text(760, 154, '02 / NIGHT INK', 12, '#A4ADA3');
body += mark('lockup', 84, 203, 580, ink);
body += mark('lockup', 768, 203, 580, soft);
body += rect(48, 348, 1344, 166, '#FFFFFF', 22);
body += text(76, 383, '03 / SYMBOL + WORDMARK', 12);
body += mark('icon', 88, 397, 92, ink);
body += mark('wordmark', 242, 410, 481.248, ink);
body += text(830, 421, 'Same family. Its own destination.', 21, ink, 500);
body += text(830, 451, 'Single color / transparent / no font dependency', 14);
body += text(56, 556, '04 / PLACEMENT STUDIES', 13, ink, 600);
body += text(1058, 556, 'Design studies · no native app yet', 13);
// Wide sidebar: a real-size 248-unit lockup leaves file content the main role.
body += rect(48, 580, 820, 384, '#F7F7F5', 18, '#D8DAD4');
body += rect(48, 580, 820, 36, '#FFFFFF', 18);
body += rect(48, 598, 820, 18, '#FFFFFF');
body += text(64, 604, 'Makudon Shuttle', 12, ink);
body += text(790, 604, '–    □    ×', 13, ink);
body += rect(48, 616, 288, 348, '#EEEFEA');
body += mark('lockup', 68, 645, 248, ink);
body += rect(64, 704, 256, 44, '#DFE1D9', 12);
body += text(86, 733, 'Files', 16, ink, 500);
body += text(86, 789, 'Transfer', 16, ink);
body += text(86, 845, 'Settings', 16, ink);
body += text(86, 933, 'LOCAL / ZIP', 11);
body += text(368, 665, 'Files', 26, ink, 600);
body += text(368, 701, 'Workspace', 13);
body += rect(368, 718, 460, 44, '#FFFFFF', 10, '#E3E4DF');
body += text(384, 746, 'D:\\Makudon', 14, ink);
body += text(368, 801, 'Backups', 13);
body += rect(368, 820, 460, 68, '#FFFFFF', 14);
body += text(388, 847, 'Writing library.zip', 16, ink, 500);
body += text(388, 872, '42 documents · 8 images', 13);
// About page: full lockup, simple supporting information.
body += rect(892, 580, 500, 384, '#1E201F', 18);
body += text(920, 619, 'Settings / About', 13, '#A4ADA3');
body += mark('lockup', 982, 711, 320, soft);
body += text(1091, 790, 'Version 0.x', 15, '#A4ADA3');
body += text(1026, 832, 'Free, open source, local first.', 14, '#A4ADA3');
body += text(1031, 900, 'Project     ·     Open source', 14, soft);
body += text(56, 1008, 'PATHS ONLY / THEMEABLE SVG MASTERS', 12);
body += text(946, 1008, 'Source geometry preserved · Fredoka not bundled', 12);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1040" viewBox="0 0 1440 1040">${body}</svg>`;
sharp(Buffer.from(svg)).png().toFile(path.join(brand, 'preview.png'))
  .then(() => console.log('assets/brand/preview.png'))
  .catch(err => { console.error(err); process.exitCode = 1; });
