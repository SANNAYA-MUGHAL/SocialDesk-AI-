import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// --- Brand Guidelines & Color System ---
export const BRAND = {
  purple: '#683DA9',       // Wordmark Purple
  lightOrchid: '#9B60E0',  // Light Orchid
  amethyst: '#8A54CC',     // Amethyst
  deepPlum: '#5E389D',     // Deep Plum
  darkPlumBg: '#1E0C30',   // Dark Plum for contrast reel backgrounds
  darkPlumCard: '#2D1448', // Card background for dark themes
  leafGreen: '#65AA3F',    // Leaf Green Accent
  softLavender: '#F7F2FC', // Light lavender background
  creamBg: '#FDFBFE',      // Off-white cream background
  white: '#FFFFFF',
  goldStar: '#FFB800',
  darkText: '#26123D',
  mutedText: '#6B5484'
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const GENERATED_DIR = path.join(ROOT_DIR, 'public', 'generated');

// Helper to safely escape XML in SVGs
export function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Convert asset file to base64 data URI
export function getAssetBase64(relativeFilename) {
  const filePath = path.join(ROOT_DIR, relativeFilename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Asset file not found: ${filePath}`);
  }
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(relativeFilename).toLowerCase().replace('.', '');
  const mime = ext === 'jpeg' || ext === 'jpg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

// Extract a clean frame from GIF using macOS sips utility
export function extractGifFrame(gifRelativeFilename) {
  const gifPath = path.join(ROOT_DIR, gifRelativeFilename);
  if (!fs.existsSync(gifPath)) {
    throw new Error(`GIF asset file not found: ${gifPath}`);
  }
  const tmpOut = path.join(GENERATED_DIR, `.tmp_frame_${Date.now()}_${Math.random().toString(36).substring(7)}.png`);
  execSync(`/usr/bin/sips -s format png "${gifPath}" --out "${tmpOut}"`, { stdio: 'pipe' });
  const buf = fs.readFileSync(tmpOut);
  fs.unlinkSync(tmpOut);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

// Render SVG string to PNG file using macOS sips
export function renderSvgToPng(svgContent, outputFilePath) {
  fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
  const tmpSvg = outputFilePath.replace(/\.png$/, `_tmp_${process.pid}_${Date.now()}_${Math.random().toString(36).substring(2)}.svg`);
  fs.writeFileSync(tmpSvg, svgContent, 'utf8');
  try {
    execSync(`/usr/bin/sips -s format png "${tmpSvg}" --out "${outputFilePath}"`, { stdio: 'pipe' });
  } finally {
    if (fs.existsSync(tmpSvg)) {
      fs.unlinkSync(tmpSvg);
    }
  }
  return outputFilePath;
}

// Base SVG defs with brand gradients, fonts, and drop shadows
function getSvgDefs() {
  return `
    <defs>
      <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${BRAND.purple}"/>
        <stop offset="100%" stop-color="${BRAND.lightOrchid}"/>
      </linearGradient>
      <linearGradient id="darkPlumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${BRAND.darkPlumBg}"/>
        <stop offset="60%" stop-color="#3A175D"/>
        <stop offset="100%" stop-color="${BRAND.deepPlum}"/>
      </linearGradient>
      <linearGradient id="lightBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${BRAND.creamBg}"/>
        <stop offset="100%" stop-color="${BRAND.softLavender}"/>
      </linearGradient>
      <linearGradient id="greenAccentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${BRAND.leafGreen}"/>
        <stop offset="100%" stop-color="#76C449"/>
      </linearGradient>
      <filter id="softShadow" x="-10%" y="-10%" width="120%" height="125%">
        <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#210C35" flood-opacity="0.14"/>
      </filter>
      <filter id="pillShadow" x="-10%" y="-20%" width="120%" height="150%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#210C35" flood-opacity="0.2"/>
      </filter>
    </defs>
  `;
}

// ==========================================
// CREATIVE BUILDERS FOR EACH OF THE 10 POSTS
// ==========================================

// Post 1: Myth Buster (Static 4:5, 1080x1350)
export function renderPost1(outputPath = path.join(GENERATED_DIR, 'post_1_static.png')) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');
  const card1B64 = getAssetBase64('Card 1.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>

      <!-- Decorative subtle brand curves -->
      <circle cx="1000" cy="120" r="320" fill="${BRAND.lightOrchid}" opacity="0.12"/>
      <circle cx="60" cy="1280" r="260" fill="${BRAND.purple}" opacity="0.10"/>

      <!-- Header: Logo & Category -->
      <image href="${logoB64}" x="60" y="44" width="250" height="85" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(680, 60)">
        <rect width="340" height="50" rx="25" fill="${BRAND.purple}"/>
        <text x="170" y="32" font-family="-apple-system, sans-serif" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle" letter-spacing="1">MYTH BUSTER • REAL TALK</text>
      </g>

      <!-- Hook Typography -->
      <text x="60" y="195" font-family="-apple-system, sans-serif" font-weight="800" font-size="44" fill="${BRAND.darkText}" letter-spacing="-0.5">“Facial shave karne se baal</text>
      <text x="60" y="248" font-family="-apple-system, sans-serif" font-weight="800" font-size="44" fill="${BRAND.darkText}" letter-spacing="-0.5">motay ho jayenge?” 👀</text>

      <!-- Stamp Badge -->
      <g transform="translate(60, 275)">
        <rect width="380" height="56" rx="28" fill="${BRAND.lightOrchid}" filter="url(#pillShadow)"/>
        <text x="190" y="37" font-family="-apple-system, sans-serif" font-weight="800" font-size="26" fill="${BRAND.white}" text-anchor="middle">NOPE. Just a myth! 💜</text>
      </g>

      <!-- Center Hero Showcase with Card 1 (Cream Razor physical integrity preserved) -->
      <clipPath id="post1Clip">
        <rect x="60" y="360" width="960" height="820" rx="28"/>
      </clipPath>
      <g filter="url(#softShadow)">
        <rect x="60" y="360" width="960" height="820" rx="28" fill="${BRAND.white}" stroke="${BRAND.purple}" stroke-width="2"/>
        <image href="${card1B64}" clip-path="url(#post1Clip)" x="60" y="360" width="960" height="820" preserveAspectRatio="xMidYMid slice"/>
      </g>

      <!-- Bottom Benefit & Offer Bar -->
      <rect x="60" y="1208" width="960" height="96" rx="24" fill="${BRAND.white}" stroke="#E8DCF5" stroke-width="2" filter="url(#softShadow)"/>
      <text x="96" y="1255" font-family="-apple-system, sans-serif" font-weight="700" font-size="26" fill="${BRAND.purple}">Girlies Glow Facial Razor</text>
      <text x="96" y="1285" font-family="-apple-system, sans-serif" font-weight="500" font-size="20" fill="${BRAND.mutedText}">Wheat-straw handle • Micro-guard blade</text>

      <!-- Pricing Badge with COD -->
      <g transform="translate(640, 1226)">
        <rect width="360" height="60" rx="30" fill="url(#greenAccentGrad)" filter="url(#pillShadow)"/>
        <text x="180" y="38" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="${BRAND.white}" text-anchor="middle">Rs. 599 • Cash on Delivery 🇵🇰</text>
      </g>
    </svg>
  `;

  return renderSvgToPng(svg, outputPath);
}

// Post 2: Product in Action (Reel 9:16, 1080x1920)
export function renderPost2(
  coverPngPath = path.join(GENERATED_DIR, 'post_2_reel.png'),
  reelMp4Path = path.join(GENERATED_DIR, 'post_2_reel.mp4')
) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');
  const frameB64 = extractGifFrame('WhatsApp GIF 2026-09-11 at 00.01.06.gif');

  // Copy GIF as reel video media asset
  fs.copyFileSync(path.join(ROOT_DIR, 'WhatsApp GIF 2026-09-11 at 00.01.06.gif'), reelMp4Path);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      ${getSvgDefs()}
      <rect width="1080" height="1920" fill="url(#darkPlumGrad)"/>

      <!-- Header Section -->
      <image href="${logoB64}" x="80" y="80" width="280" height="95" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(680, 100)">
        <rect width="320" height="54" rx="27" fill="${BRAND.lightOrchid}"/>
        <text x="160" y="34" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.white}" text-anchor="middle" letter-spacing="1">DEMO IN ACTION ✨</text>
      </g>

      <!-- Hook Headline -->
      <text x="80" y="250" font-family="-apple-system, sans-serif" font-weight="800" font-size="50" fill="${BRAND.white}">Face shave karne se</text>
      <text x="80" y="310" font-family="-apple-system, sans-serif" font-weight="800" font-size="50" fill="${BRAND.white}">baal mote ho jate hain? 👀</text>
      <g transform="translate(80, 345)">
        <rect width="440" height="60" rx="30" fill="${BRAND.purple}"/>
        <text x="220" y="40" font-family="-apple-system, sans-serif" font-weight="900" font-size="28" fill="${BRAND.white}" text-anchor="middle">Nope. That's a myth! 💜</text>
      </g>

      <!-- Central Video Frame -->
      <clipPath id="reel2Clip">
        <rect x="80" y="440" width="920" height="1140" rx="36"/>
      </clipPath>
      <g filter="url(#softShadow)">
        <rect x="80" y="440" width="920" height="1140" rx="36" fill="${BRAND.darkPlumCard}" stroke="${BRAND.lightOrchid}" stroke-width="3"/>
        <image href="${frameB64}" clip-path="url(#reel2Clip)" x="80" y="440" width="920" height="1140" preserveAspectRatio="xMidYMid slice"/>
      </g>

      <!-- Video Play Indicator -->
      <g transform="translate(540, 1010)" opacity="0.9">
        <circle r="55" fill="${BRAND.purple}" stroke="${BRAND.white}" stroke-width="4"/>
        <polygon points="-16,-26 -16,26 26,0" fill="${BRAND.white}"/>
      </g>

      <!-- Bottom Highlights & CTA -->
      <g transform="translate(80, 1620)">
        <rect width="920" height="210" rx="32" fill="${BRAND.white}" filter="url(#softShadow)"/>
        
        <text x="50" y="60" font-family="-apple-system, sans-serif" font-weight="800" font-size="34" fill="${BRAND.purple}">Instant Smooth Skin At Home ✨</text>
        <text x="50" y="98" font-family="-apple-system, sans-serif" font-weight="600" font-size="22" fill="${BRAND.darkText}">Painless dermaplaning with eco-friendly wheat-straw razor</text>

        <!-- Terms Badge -->
        <g transform="translate(50, 126)">
          <rect width="820" height="60" rx="30" fill="url(#greenAccentGrad)"/>
          <text x="410" y="38" font-family="-apple-system, sans-serif" font-weight="900" font-size="26" fill="${BRAND.white}" text-anchor="middle">Rs. 599 | CASH ON DELIVERY ACROSS PAKISTAN 🇵🇰</text>
        </g>
      </g>
    </svg>
  `;

  renderSvgToPng(svg, coverPngPath);
  // Also provide post_2_cover.png
  const altCover = path.join(GENERATED_DIR, 'post_2_cover.png');
  fs.copyFileSync(coverPngPath, altCover);
  return coverPngPath;
}

// Post 3: Makeup Benefits (Carousel 4 slides, each 1080x1350)
export function renderPost3(outputDir = GENERATED_DIR) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');
  const slide1Asset = getAssetBase64('Section 3.png');
  const slide2Asset = getAssetBase64('Card 4.png');
  const slide3Asset = getAssetBase64('car5.png');
  const slide4Asset = getAssetBase64('Single.png');

  // Slide 1: Hook
  const svg1 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      <image href="${logoB64}" x="60" y="44" width="250" height="85" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(760, 60)">
        <rect width="260" height="46" rx="23" fill="${BRAND.purple}"/>
        <text x="130" y="30" font-family="-apple-system, sans-serif" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">SLIDE 1 OF 4</text>
      </g>

      <text x="60" y="195" font-family="-apple-system, sans-serif" font-weight="800" font-size="44" fill="${BRAND.darkText}">Why isn't my makeup</text>
      <text x="60" y="248" font-family="-apple-system, sans-serif" font-weight="800" font-size="44" fill="${BRAND.darkText}">sitting smooth? 👀</text>
      <text x="60" y="295" font-family="-apple-system, sans-serif" font-weight="600" font-size="26" fill="${BRAND.purple}">Swipe to unlock the secret 👉</text>

      <clipPath id="slide1Clip"><rect x="60" y="340" width="960" height="850" rx="30"/></clipPath>
      <g filter="url(#softShadow)">
        <rect x="60" y="340" width="960" height="850" rx="30" fill="${BRAND.white}"/>
        <image href="${slide1Asset}" clip-path="url(#slide1Clip)" x="60" y="340" width="960" height="850" preserveAspectRatio="xMidYMid slice"/>
      </g>

      <g transform="translate(60, 1220)">
        <rect width="960" height="80" rx="24" fill="${BRAND.white}" filter="url(#softShadow)"/>
        <text x="50" y="48" font-family="-apple-system, sans-serif" font-weight="700" font-size="26" fill="${BRAND.purple}">Girlies Glow Facial Razor</text>
        <g transform="translate(560, 12)">
          <rect width="360" height="56" rx="28" fill="url(#greenAccentGrad)"/>
          <text x="180" y="35" font-family="-apple-system, sans-serif" font-weight="800" font-size="22" fill="${BRAND.white}" text-anchor="middle">Rs. 599 • COD Available 🇵🇰</text>
        </g>
      </g>
    </svg>
  `;

  // Slide 2: Problem
  const svg2 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      <image href="${logoB64}" x="60" y="44" width="250" height="85" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(760, 60)">
        <rect width="260" height="46" rx="23" fill="${BRAND.purple}"/>
        <text x="130" y="30" font-family="-apple-system, sans-serif" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">SLIDE 2 OF 4</text>
      </g>

      <text x="60" y="195" font-family="-apple-system, sans-serif" font-weight="800" font-size="40" fill="${BRAND.darkText}">Peach fuzz traps foundation &amp; powder</text>
      <text x="60" y="245" font-family="-apple-system, sans-serif" font-weight="500" font-size="24" fill="${BRAND.mutedText}">Tiny facial hairs prevent foundation from melting into the skin.</text>

      <clipPath id="slide2Clip"><rect x="60" y="290" width="960" height="900" rx="30"/></clipPath>
      <g filter="url(#softShadow)">
        <rect x="60" y="290" width="960" height="900" rx="30" fill="${BRAND.white}"/>
        <image href="${slide2Asset}" clip-path="url(#slide2Clip)" x="60" y="290" width="960" height="900" preserveAspectRatio="xMidYMid slice"/>
      </g>

      <g transform="translate(60, 1225)">
        <rect width="960" height="75" rx="24" fill="${BRAND.purple}"/>
        <text x="480" y="46" font-family="-apple-system, sans-serif" font-weight="700" font-size="24" fill="${BRAND.white}" text-anchor="middle">Swipe to see how to solve it 👉</text>
      </g>
    </svg>
  `;

  // Slide 3: Fix
  const svg3 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      <image href="${logoB64}" x="60" y="44" width="250" height="85" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(760, 60)">
        <rect width="260" height="46" rx="23" fill="${BRAND.purple}"/>
        <text x="130" y="30" font-family="-apple-system, sans-serif" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">SLIDE 3 OF 4</text>
      </g>

      <text x="60" y="195" font-family="-apple-system, sans-serif" font-weight="800" font-size="42" fill="${BRAND.darkText}">Remove the fuzz. Keep the glow. ✨</text>
      <text x="60" y="245" font-family="-apple-system, sans-serif" font-weight="600" font-size="24" fill="${BRAND.purple}">Safe, gentle, stainless-steel micro-guard blade</text>

      <clipPath id="slide3Clip"><rect x="60" y="290" width="960" height="900" rx="30"/></clipPath>
      <g filter="url(#softShadow)">
        <rect x="60" y="290" width="960" height="900" rx="30" fill="${BRAND.white}"/>
        <image href="${slide3Asset}" clip-path="url(#slide3Clip)" x="60" y="290" width="960" height="900" preserveAspectRatio="xMidYMid slice"/>
      </g>

      <g transform="translate(60, 1225)">
        <rect width="960" height="75" rx="24" fill="${BRAND.purple}"/>
        <text x="480" y="46" font-family="-apple-system, sans-serif" font-weight="700" font-size="24" fill="${BRAND.white}" text-anchor="middle">Swipe to meet your new beauty staple 👉</text>
      </g>
    </svg>
  `;

  // Slide 4: Result / CTA
  const svg4 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      <image href="${logoB64}" x="60" y="44" width="250" height="85" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(760, 60)">
        <rect width="260" height="46" rx="23" fill="${BRAND.purple}"/>
        <text x="130" y="30" font-family="-apple-system, sans-serif" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">SLIDE 4 OF 4</text>
      </g>

      <text x="60" y="195" font-family="-apple-system, sans-serif" font-weight="800" font-size="44" fill="${BRAND.darkText}">Your base just found</text>
      <text x="60" y="248" font-family="-apple-system, sans-serif" font-weight="800" font-size="44" fill="${BRAND.darkText}">its new bestie 💜</text>

      <clipPath id="slide4Clip"><rect x="60" y="290" width="960" height="870" rx="30"/></clipPath>
      <g filter="url(#softShadow)">
        <rect x="60" y="290" width="960" height="870" rx="30" fill="${BRAND.white}"/>
        <image href="${slide4Asset}" clip-path="url(#slide4Clip)" x="60" y="290" width="960" height="870" preserveAspectRatio="xMidYMid slice"/>
      </g>

      <g transform="translate(60, 1195)">
        <rect width="960" height="110" rx="28" fill="${BRAND.white}" stroke="#DDC8F5" stroke-width="2" filter="url(#softShadow)"/>
        <text x="40" y="52" font-family="-apple-system, sans-serif" font-weight="800" font-size="30" fill="${BRAND.purple}">Girlies Glow Wheat-Straw Razor</text>
        <text x="40" y="85" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="${BRAND.mutedText}">Baby soft skin • Butter-smooth makeup</text>
        <g transform="translate(560, 22)">
          <rect width="360" height="66" rx="33" fill="url(#greenAccentGrad)" filter="url(#pillShadow)"/>
          <text x="180" y="42" font-family="-apple-system, sans-serif" font-weight="900" font-size="24" fill="${BRAND.white}" text-anchor="middle">Rs. 599 • COD Across Pakistan 🇵🇰</text>
        </g>
      </g>
    </svg>
  `;

  renderSvgToPng(svg1, path.join(outputDir, 'post_3_slide_1.png'));
  renderSvgToPng(svg2, path.join(outputDir, 'post_3_slide_2.png'));
  renderSvgToPng(svg3, path.join(outputDir, 'post_3_slide_3.png'));
  renderSvgToPng(svg4, path.join(outputDir, 'post_3_slide_4.png'));
}

// Post 4: Salon vs Home (Static 4:5, 1080x1350)
export function renderPost4(outputPath = path.join(GENERATED_DIR, 'post_4_static.png')) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');
  const singleB64 = getAssetBase64('Single.png');
  const pairB64 = getAssetBase64('pair .png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>

      <!-- Header -->
      <image href="${logoB64}" x="60" y="44" width="250" height="85" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(680, 60)">
        <rect width="340" height="50" rx="25" fill="${BRAND.purple}"/>
        <text x="170" y="32" font-family="-apple-system, sans-serif" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">SMART BEAUTY • COST</text>
      </g>

      <!-- Hook -->
      <text x="60" y="195" font-family="-apple-system, sans-serif" font-weight="800" font-size="44" fill="${BRAND.darkText}">Parlour jaane ka mood nahi? 💅</text>
      <text x="60" y="248" font-family="-apple-system, sans-serif" font-weight="700" font-size="34" fill="${BRAND.purple}">Glow ghar par with Girlies Glow.</text>

      <!-- Side-by-side comparison cards -->
      <!-- Left: Salon -->
      <g transform="translate(60, 290)" filter="url(#softShadow)">
        <rect width="460" height="420" rx="24" fill="${BRAND.white}" stroke="#E5E5E5" stroke-width="2"/>
        <rect width="460" height="60" rx="24" fill="#6B7280"/>
        <text x="230" y="38" font-family="-apple-system, sans-serif" font-weight="800" font-size="22" fill="${BRAND.white}" text-anchor="middle">PARLOUR WAX / THREAD</text>
        <text x="36" y="120" font-family="-apple-system, sans-serif" font-weight="600" font-size="22" fill="#DC2626">❌ Traffic &amp; waiting queues</text>
        <text x="36" y="180" font-family="-apple-system, sans-serif" font-weight="600" font-size="22" fill="#DC2626">❌ Rs. 2,000+ per session</text>
        <text x="36" y="240" font-family="-apple-system, sans-serif" font-weight="600" font-size="22" fill="#DC2626">❌ Painful threading &amp; redness</text>
        <text x="36" y="300" font-family="-apple-system, sans-serif" font-weight="600" font-size="22" fill="#DC2626">❌ Time-consuming bookings</text>
        <text x="36" y="360" font-family="-apple-system, sans-serif" font-weight="700" font-size="24" fill="#4B5563">Total: Heavy monthly expense</text>
      </g>

      <!-- Right: Girlies Glow -->
      <g transform="translate(560, 290)" filter="url(#softShadow)">
        <rect width="460" height="420" rx="24" fill="${BRAND.white}" stroke="${BRAND.purple}" stroke-width="3"/>
        <rect width="460" height="60" rx="24" fill="${BRAND.purple}"/>
        <text x="230" y="38" font-family="-apple-system, sans-serif" font-weight="800" font-size="22" fill="${BRAND.white}" text-anchor="middle">GIRLIES GLOW AT HOME</text>
        <text x="36" y="120" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.leafGreen}">✓ 5-minute glow in pajamas</text>
        <text x="36" y="180" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.leafGreen}">✓ Painless micro-guard blade</text>
        <text x="36" y="240" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.leafGreen}">✓ Eco-friendly wheat-straw</text>
        <text x="36" y="300" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.leafGreen}">✓ Complete comfort &amp; ease</text>
        <text x="36" y="360" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="${BRAND.purple}">Total: Only Rs. 599 once!</text>
      </g>

      <!-- Visual Product Showcase -->
      <clipPath id="pairClip"><rect x="60" y="740" width="960" height="440" rx="28"/></clipPath>
      <g filter="url(#softShadow)">
        <rect x="60" y="740" width="960" height="440" rx="28" fill="${BRAND.white}" stroke="${BRAND.purple}" stroke-width="2"/>
        <image href="${pairB64}" clip-path="url(#pairClip)" x="60" y="740" width="960" height="440" preserveAspectRatio="xMidYMid slice"/>
      </g>

      <!-- Footer CTA -->
      <g transform="translate(60, 1210)">
        <rect width="960" height="95" rx="28" fill="${BRAND.white}" stroke="#E0D0F5" stroke-width="2" filter="url(#softShadow)"/>
        <text x="40" y="56" font-family="-apple-system, sans-serif" font-weight="800" font-size="30" fill="${BRAND.purple}">Glow Ghar Par • Rs. 599</text>
        <g transform="translate(560, 16)">
          <rect width="360" height="64" rx="32" fill="url(#greenAccentGrad)" filter="url(#pillShadow)"/>
          <text x="180" y="40" font-family="-apple-system, sans-serif" font-weight="900" font-size="24" fill="${BRAND.white}" text-anchor="middle">Cash on Delivery Nationwide 🇵🇰</text>
        </g>
      </g>
    </svg>
  `;

  return renderSvgToPng(svg, outputPath);
}

// Post 5: Relatable UGC Testimonial (Reel 9:16, 1080x1920)
export function renderPost5(
  coverPngPath = path.join(GENERATED_DIR, 'post_5_reel.png'),
  reelMp4Path = path.join(GENERATED_DIR, 'post_5_reel.mp4')
) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');
  const frameB64 = extractGifFrame('WhatsApp GIF 2026-09-11 at 00.01.14.gif');

  // Copy GIF as reel video media asset
  fs.copyFileSync(path.join(ROOT_DIR, 'WhatsApp GIF 2026-09-11 at 00.01.14.gif'), reelMp4Path);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      ${getSvgDefs()}
      <rect width="1080" height="1920" fill="url(#darkPlumGrad)"/>

      <image href="${logoB64}" x="80" y="80" width="280" height="95" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(680, 100)">
        <rect width="320" height="54" rx="27" fill="${BRAND.lightOrchid}"/>
        <text x="160" y="34" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.white}" text-anchor="middle">UGC DIARIES 💜</text>
      </g>

      <!-- Hook bubble -->
      <g transform="translate(80, 210)" filter="url(#softShadow)">
        <rect width="920" height="200" rx="30" fill="${BRAND.white}"/>
        <text x="44" y="65" font-family="-apple-system, sans-serif" font-weight="800" font-size="34" fill="${BRAND.darkText}">“Mujhe bhi lagta tha shave karungi</text>
        <text x="44" y="112" font-family="-apple-system, sans-serif" font-weight="800" font-size="34" fill="${BRAND.darkText}">toh baal mote ho jayenge… 😭”</text>
        <text x="44" y="160" font-family="-apple-system, sans-serif" font-weight="700" font-size="26" fill="${BRAND.purple}">Once you see how your makeup looks, there's no going back!</text>
      </g>

      <!-- Video Demo Frame -->
      <clipPath id="reel5Clip"><rect x="80" y="440" width="920" height="1140" rx="36"/></clipPath>
      <g filter="url(#softShadow)">
        <rect x="80" y="440" width="920" height="1140" rx="36" fill="${BRAND.darkPlumCard}" stroke="${BRAND.lightOrchid}" stroke-width="3"/>
        <image href="${frameB64}" clip-path="url(#reel5Clip)" x="80" y="440" width="920" height="1140" preserveAspectRatio="xMidYMid slice"/>
      </g>

      <!-- Play button icon -->
      <g transform="translate(540, 1010)" opacity="0.9">
        <circle r="55" fill="${BRAND.purple}" stroke="${BRAND.white}" stroke-width="4"/>
        <polygon points="-16,-26 -16,26 26,0" fill="${BRAND.white}"/>
      </g>

      <!-- Bottom Banner -->
      <g transform="translate(80, 1620)">
        <rect width="920" height="210" rx="32" fill="${BRAND.white}" filter="url(#softShadow)"/>
        <text x="50" y="60" font-family="-apple-system, sans-serif" font-weight="800" font-size="34" fill="${BRAND.purple}">Girlies Glow Facial Razor</text>
        <text x="50" y="98" font-family="-apple-system, sans-serif" font-weight="600" font-size="22" fill="${BRAND.darkText}">Eco-friendly wheat straw • Micro-guard blade • Rs. 599</text>
        <g transform="translate(50, 126)">
          <rect width="820" height="60" rx="30" fill="url(#greenAccentGrad)"/>
          <text x="410" y="38" font-family="-apple-system, sans-serif" font-weight="900" font-size="26" fill="${BRAND.white}" text-anchor="middle">CASH ON DELIVERY AVAILABLE ACROSS PAKISTAN 🇵🇰</text>
        </g>
      </g>
    </svg>
  `;

  renderSvgToPng(svg, coverPngPath);
  const altCover = path.join(GENERATED_DIR, 'post_5_cover.png');
  fs.copyFileSync(coverPngPath, altCover);
  return coverPngPath;
}

// Post 6: Product Benefits & Eco-Value (Static 4:5, 1080x1350)
export function renderPost6(outputPath = path.join(GENERATED_DIR, 'post_6_static.png')) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');
  const singleB64 = getAssetBase64('Single.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>

      <image href="${logoB64}" x="60" y="44" width="250" height="85" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(680, 60)">
        <rect width="340" height="50" rx="25" fill="${BRAND.purple}"/>
        <text x="170" y="32" font-family="-apple-system, sans-serif" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">ECO-BEAUTY INNOVATION</text>
      </g>

      <text x="60" y="195" font-family="-apple-system, sans-serif" font-weight="900" font-size="48" fill="${BRAND.darkText}">Small razor. Big glow energy. ✨</text>
      <text x="60" y="245" font-family="-apple-system, sans-serif" font-weight="600" font-size="24" fill="${BRAND.purple}">Why girls across Pakistan are switching to Girlies Glow:</text>

      <!-- Center Hero Showcase with Single.png -->
      <clipPath id="singleHeroClip"><rect x="60" y="280" width="960" height="660" rx="30"/></clipPath>
      <g filter="url(#softShadow)">
        <rect x="60" y="280" width="960" height="660" rx="30" fill="${BRAND.white}" stroke="${BRAND.purple}" stroke-width="2"/>
        <image href="${singleB64}" clip-path="url(#singleHeroClip)" x="60" y="280" width="960" height="660" preserveAspectRatio="xMidYMid slice"/>
      </g>

      <!-- 4 Benefit Badges Grid -->
      <g transform="translate(60, 960)">
        <g transform="translate(0, 0)">
          <rect width="465" height="100" rx="20" fill="${BRAND.white}" stroke="#E5D7F5" stroke-width="2" filter="url(#softShadow)"/>
          <text x="24" y="44" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.purple}">🌾 Wheat-Straw Handle</text>
          <text x="24" y="76" font-family="-apple-system, sans-serif" font-weight="500" font-size="18" fill="${BRAND.mutedText}">Biodegradable, ergonomic curve</text>
        </g>
        <g transform="translate(495, 0)">
          <rect width="465" height="100" rx="20" fill="${BRAND.white}" stroke="#E5D7F5" stroke-width="2" filter="url(#softShadow)"/>
          <text x="24" y="44" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.purple}">🛡️ Micro-Guard Blade</text>
          <text x="24" y="76" font-family="-apple-system, sans-serif" font-weight="500" font-size="18" fill="${BRAND.mutedText}">Stainless-steel &amp; beginner-safe</text>
        </g>
        <g transform="translate(0, 115)">
          <rect width="465" height="100" rx="20" fill="${BRAND.white}" stroke="#E5D7F5" stroke-width="2" filter="url(#softShadow)"/>
          <text x="24" y="44" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.purple}">🌸 Painless at Home</text>
          <text x="24" y="76" font-family="-apple-system, sans-serif" font-weight="500" font-size="18" fill="${BRAND.mutedText}">Gentle glide, no irritation</text>
        </g>
        <g transform="translate(495, 115)">
          <rect width="465" height="100" rx="20" fill="${BRAND.white}" stroke="#E5D7F5" stroke-width="2" filter="url(#softShadow)"/>
          <text x="24" y="44" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.purple}">💄 Butter-Smooth Base</text>
          <text x="24" y="76" font-family="-apple-system, sans-serif" font-weight="500" font-size="18" fill="${BRAND.mutedText}">Flawless makeup application</text>
        </g>
      </g>

      <!-- Bottom Offer Bar -->
      <g transform="translate(60, 1205)">
        <rect width="960" height="95" rx="28" fill="${BRAND.white}" stroke="#E2D4F5" stroke-width="2" filter="url(#softShadow)"/>
        <text x="40" y="58" font-family="-apple-system, sans-serif" font-weight="800" font-size="32" fill="${BRAND.purple}">Only Rs. 599</text>
        <g transform="translate(520, 16)">
          <rect width="400" height="64" rx="32" fill="url(#greenAccentGrad)" filter="url(#pillShadow)"/>
          <text x="200" y="40" font-family="-apple-system, sans-serif" font-weight="900" font-size="24" fill="${BRAND.white}" text-anchor="middle">Cash on Delivery Across Pakistan 🇵🇰</text>
        </g>
      </g>
    </svg>
  `;

  return renderSvgToPng(svg, outputPath);
}

// Post 7: GRWM Transformation (Reel 9:16, 1080x1920)
export function renderPost7(
  coverPngPath = path.join(GENERATED_DIR, 'post_7_reel.png'),
  reelMp4Path = path.join(GENERATED_DIR, 'post_7_reel.mp4')
) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');
  const frameB64 = extractGifFrame('WhatsApp GIF 2026-09-11 at 00.01.24.gif');

  // Copy GIF as reel video media asset
  fs.copyFileSync(path.join(ROOT_DIR, 'WhatsApp GIF 2026-09-11 at 00.01.24.gif'), reelMp4Path);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      ${getSvgDefs()}
      <rect width="1080" height="1920" fill="url(#darkPlumGrad)"/>

      <image href="${logoB64}" x="80" y="80" width="280" height="95" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(680, 100)">
        <rect width="320" height="54" rx="27" fill="${BRAND.lightOrchid}"/>
        <text x="160" y="34" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.white}" text-anchor="middle">GRWM ROUTINE ✨</text>
      </g>

      <text x="80" y="240" font-family="-apple-system, sans-serif" font-weight="800" font-size="52" fill="${BRAND.white}">GRWM but first…</text>
      <text x="80" y="300" font-family="-apple-system, sans-serif" font-weight="800" font-size="52" fill="#E8D5FF">peach fuzz has to go 👀</text>
      <text x="80" y="355" font-family="-apple-system, sans-serif" font-weight="600" font-size="26" fill="${BRAND.white}">The secret to that seamless glass-skin base!</text>

      <clipPath id="reel7Clip"><rect x="80" y="400" width="920" height="1180" rx="36"/></clipPath>
      <g filter="url(#softShadow)">
        <rect x="80" y="400" width="920" height="1180" rx="36" fill="${BRAND.darkPlumCard}" stroke="${BRAND.lightOrchid}" stroke-width="3"/>
        <image href="${frameB64}" clip-path="url(#reel7Clip)" x="80" y="400" width="920" height="1180" preserveAspectRatio="xMidYMid slice"/>
      </g>

      <g transform="translate(540, 990)" opacity="0.9">
        <circle r="55" fill="${BRAND.purple}" stroke="${BRAND.white}" stroke-width="4"/>
        <polygon points="-16,-26 -16,26 26,0" fill="${BRAND.white}"/>
      </g>

      <g transform="translate(80, 1620)">
        <rect width="920" height="210" rx="32" fill="${BRAND.white}" filter="url(#softShadow)"/>
        <text x="50" y="60" font-family="-apple-system, sans-serif" font-weight="800" font-size="34" fill="${BRAND.purple}">Girlies Glow Facial Razor</text>
        <text x="50" y="98" font-family="-apple-system, sans-serif" font-weight="600" font-size="22" fill="${BRAND.darkText}">Glass-skin prep • Wheat-straw handle • Rs. 599</text>
        <g transform="translate(50, 126)">
          <rect width="820" height="60" rx="30" fill="url(#greenAccentGrad)"/>
          <text x="410" y="38" font-family="-apple-system, sans-serif" font-weight="900" font-size="26" fill="${BRAND.white}" text-anchor="middle">CASH ON DELIVERY ACROSS PAKISTAN 🇵🇰</text>
        </g>
      </g>
    </svg>
  `;

  renderSvgToPng(svg, coverPngPath);
  const altCover = path.join(GENERATED_DIR, 'post_7_cover.png');
  fs.copyFileSync(coverPngPath, altCover);
  return coverPngPath;
}

// Post 8: How to Use - Beginner Guide (Carousel 5 slides, each 1080x1350)
export function renderPost8(outputDir = GENERATED_DIR) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');
  const slide1Asset = getAssetBase64('Section 1.png');
  const slide2Asset = getAssetBase64('card 3.png');
  const slide3Asset = getAssetBase64('Card 2.png');
  const slide4Asset = getAssetBase64('packaging section one.png');
  const slide5Asset = getAssetBase64('Single.png');

  // Slide 1: Cover
  const svg1 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      <image href="${logoB64}" x="60" y="44" width="250" height="85" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(760, 60)">
        <rect width="260" height="46" rx="23" fill="${BRAND.purple}"/>
        <text x="130" y="30" font-family="-apple-system, sans-serif" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">TUTORIAL (1/5)</text>
      </g>

      <text x="60" y="195" font-family="-apple-system, sans-serif" font-weight="800" font-size="44" fill="${BRAND.darkText}">New to facial shaving?</text>
      <text x="60" y="248" font-family="-apple-system, sans-serif" font-weight="800" font-size="44" fill="${BRAND.purple}">Save this 💜 (Step-by-step)</text>

      <clipPath id="p8s1"><rect x="60" y="290" width="960" height="900" rx="30"/></clipPath>
      <g filter="url(#softShadow)">
        <rect x="60" y="290" width="960" height="900" rx="30" fill="${BRAND.white}"/>
        <image href="${slide1Asset}" clip-path="url(#p8s1)" x="60" y="290" width="960" height="900" preserveAspectRatio="xMidYMid slice"/>
      </g>

      <g transform="translate(60, 1225)">
        <rect width="960" height="75" rx="24" fill="${BRAND.purple}"/>
        <text x="480" y="46" font-family="-apple-system, sans-serif" font-weight="700" font-size="24" fill="${BRAND.white}" text-anchor="middle">Swipe to start Step 1 👉</text>
      </g>
    </svg>
  `;

  // Slide 2: Step 1
  const svg2 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      <image href="${logoB64}" x="60" y="44" width="250" height="85" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(760, 60)">
        <rect width="260" height="46" rx="23" fill="${BRAND.purple}"/>
        <text x="130" y="30" font-family="-apple-system, sans-serif" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">STEP 1 (2/5)</text>
      </g>

      <text x="60" y="195" font-family="-apple-system, sans-serif" font-weight="800" font-size="40" fill="${BRAND.darkText}">Cleanse &amp; Dry Your Skin</text>
      <text x="60" y="245" font-family="-apple-system, sans-serif" font-weight="500" font-size="24" fill="${BRAND.mutedText}">Start with clean, dry skin or light facial oil for slip.</text>

      <clipPath id="p8s2"><rect x="60" y="290" width="960" height="900" rx="30"/></clipPath>
      <g filter="url(#softShadow)">
        <rect x="60" y="290" width="960" height="900" rx="30" fill="${BRAND.white}"/>
        <image href="${slide2Asset}" clip-path="url(#p8s2)" x="60" y="290" width="960" height="900" preserveAspectRatio="xMidYMid slice"/>
      </g>

      <g transform="translate(60, 1225)">
        <rect width="960" height="75" rx="24" fill="${BRAND.purple}"/>
        <text x="480" y="46" font-family="-apple-system, sans-serif" font-weight="700" font-size="24" fill="${BRAND.white}" text-anchor="middle">Swipe to Step 2 👉</text>
      </g>
    </svg>
  `;

  // Slide 3: Step 2
  const svg3 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      <image href="${logoB64}" x="60" y="44" width="250" height="85" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(760, 60)">
        <rect width="260" height="46" rx="23" fill="${BRAND.purple}"/>
        <text x="130" y="30" font-family="-apple-system, sans-serif" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">STEP 2 (3/5)</text>
      </g>

      <text x="60" y="195" font-family="-apple-system, sans-serif" font-weight="800" font-size="40" fill="${BRAND.darkText}">Hold Skin Gently Taut</text>
      <text x="60" y="245" font-family="-apple-system, sans-serif" font-weight="500" font-size="24" fill="${BRAND.mutedText}">Use your free hand to stretch skin firm for smooth gliding.</text>

      <clipPath id="p8s3"><rect x="60" y="290" width="960" height="900" rx="30"/></clipPath>
      <g filter="url(#softShadow)">
        <rect x="60" y="290" width="960" height="900" rx="30" fill="${BRAND.white}"/>
        <image href="${slide3Asset}" clip-path="url(#p8s3)" x="60" y="290" width="960" height="900" preserveAspectRatio="xMidYMid slice"/>
      </g>

      <g transform="translate(60, 1225)">
        <rect width="960" height="75" rx="24" fill="${BRAND.purple}"/>
        <text x="480" y="46" font-family="-apple-system, sans-serif" font-weight="700" font-size="24" fill="${BRAND.white}" text-anchor="middle">Swipe to Step 3 👉</text>
      </g>
    </svg>
  `;

  // Slide 4: Step 3
  const svg4 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      <image href="${logoB64}" x="60" y="44" width="250" height="85" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(760, 60)">
        <rect width="260" height="46" rx="23" fill="${BRAND.purple}"/>
        <text x="130" y="30" font-family="-apple-system, sans-serif" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">STEP 3 (4/5)</text>
      </g>

      <text x="60" y="195" font-family="-apple-system, sans-serif" font-weight="800" font-size="40" fill="${BRAND.darkText}">45° Angle • Light Strokes</text>
      <text x="60" y="245" font-family="-apple-system, sans-serif" font-weight="500" font-size="24" fill="${BRAND.mutedText}">Use short, downward strokes with zero pressure.</text>

      <clipPath id="p8s4"><rect x="60" y="290" width="960" height="900" rx="30"/></clipPath>
      <g filter="url(#softShadow)">
        <rect x="60" y="290" width="960" height="900" rx="30" fill="${BRAND.white}"/>
        <image href="${slide4Asset}" clip-path="url(#p8s4)" x="60" y="290" width="960" height="900" preserveAspectRatio="xMidYMid slice"/>
      </g>

      <g transform="translate(60, 1225)">
        <rect width="960" height="75" rx="24" fill="${BRAND.purple}"/>
        <text x="480" y="46" font-family="-apple-system, sans-serif" font-weight="700" font-size="24" fill="${BRAND.white}" text-anchor="middle">Swipe to Step 4 &amp; Care 👉</text>
      </g>
    </svg>
  `;

  // Slide 5: Step 4 & Offer
  const svg5 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      <image href="${logoB64}" x="60" y="44" width="250" height="85" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(760, 60)">
        <rect width="260" height="46" rx="23" fill="${BRAND.purple}"/>
        <text x="130" y="30" font-family="-apple-system, sans-serif" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">FINISH (5/5)</text>
      </g>

      <text x="60" y="195" font-family="-apple-system, sans-serif" font-weight="800" font-size="40" fill="${BRAND.darkText}">Moisturize &amp; Protect</text>
      <text x="60" y="245" font-family="-apple-system, sans-serif" font-weight="500" font-size="24" fill="${BRAND.mutedText}">Clean razor, replace protective cap, and hydrate your skin!</text>

      <clipPath id="p8s5"><rect x="60" y="290" width="960" height="870" rx="30"/></clipPath>
      <g filter="url(#softShadow)">
        <rect x="60" y="290" width="960" height="870" rx="30" fill="${BRAND.white}"/>
        <image href="${slide5Asset}" clip-path="url(#p8s5)" x="60" y="290" width="960" height="870" preserveAspectRatio="xMidYMid slice"/>
      </g>

      <g transform="translate(60, 1195)">
        <rect width="960" height="110" rx="28" fill="${BRAND.white}" stroke="#DDC8F5" stroke-width="2" filter="url(#softShadow)"/>
        <text x="40" y="52" font-family="-apple-system, sans-serif" font-weight="800" font-size="30" fill="${BRAND.purple}">Ready for your glow?</text>
        <text x="40" y="85" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="${BRAND.mutedText}">Get the eco-friendly razor today</text>
        <g transform="translate(560, 22)">
          <rect width="360" height="66" rx="33" fill="url(#greenAccentGrad)" filter="url(#pillShadow)"/>
          <text x="180" y="42" font-family="-apple-system, sans-serif" font-weight="900" font-size="24" fill="${BRAND.white}" text-anchor="middle">Rs. 599 • COD Across Pakistan 🇵🇰</text>
        </g>
      </g>
    </svg>
  `;

  renderSvgToPng(svg1, path.join(outputDir, 'post_8_slide_1.png'));
  renderSvgToPng(svg2, path.join(outputDir, 'post_8_slide_2.png'));
  renderSvgToPng(svg3, path.join(outputDir, 'post_8_slide_3.png'));
  renderSvgToPng(svg4, path.join(outputDir, 'post_8_slide_4.png'));
  renderSvgToPng(svg5, path.join(outputDir, 'post_8_slide_5.png'));
}

// Post 9: Creator UGC Review (Static 4:5, 1080x1350)
export function renderPost9(outputPath = path.join(GENERATED_DIR, 'post_9_static.png')) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');
  const card6B64 = getAssetBase64('Card 6.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>

      <image href="${logoB64}" x="60" y="44" width="250" height="85" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(680, 60)">
        <rect width="340" height="50" rx="25" fill="${BRAND.purple}"/>
        <text x="170" y="32" font-family="-apple-system, sans-serif" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">CREATOR SHOWCASE</text>
      </g>

      <!-- Hook speech bubble -->
      <g transform="translate(60, 160)" filter="url(#softShadow)">
        <rect width="960" height="150" rx="26" fill="${BRAND.white}"/>
        <text x="40" y="54" font-family="-apple-system, sans-serif" font-weight="800" font-size="30" fill="${BRAND.darkText}">“I was SO scared my facial hair would come</text>
        <text x="40" y="94" font-family="-apple-system, sans-serif" font-weight="800" font-size="30" fill="${BRAND.darkText}">back thicker 😭 Turns out I was stressing over a myth!”</text>
        <text x="40" y="130" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="${BRAND.purple}">Now I understand the hype around that smooth makeup base 💜</text>
      </g>

      <!-- Center image Card 6 -->
      <clipPath id="p9Clip"><rect x="60" y="340" width="960" height="830" rx="28"/></clipPath>
      <g filter="url(#softShadow)">
        <rect x="60" y="340" width="960" height="830" rx="28" fill="${BRAND.white}" stroke="${BRAND.purple}" stroke-width="2"/>
        <image href="${card6B64}" clip-path="url(#p9Clip)" x="60" y="340" width="960" height="830" preserveAspectRatio="xMidYMid slice"/>
      </g>

      <!-- Star Rating Stamp -->
      <g transform="translate(100, 1080)">
        <rect width="340" height="54" rx="27" fill="${BRAND.darkText}" opacity="0.88"/>
        <text x="170" y="36" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="${BRAND.goldStar}" text-anchor="middle">★★★★★ 5/5 Community Rating</text>
      </g>

      <!-- Bottom Offer Bar -->
      <g transform="translate(60, 1200)">
        <rect width="960" height="96" rx="28" fill="${BRAND.white}" stroke="#E5D6F5" stroke-width="2" filter="url(#softShadow)"/>
        <text x="40" y="58" font-family="-apple-system, sans-serif" font-weight="800" font-size="30" fill="${BRAND.purple}">Try Girlies Glow — Rs. 599</text>
        <g transform="translate(540, 16)">
          <rect width="380" height="64" rx="32" fill="url(#greenAccentGrad)" filter="url(#pillShadow)"/>
          <text x="190" y="40" font-family="-apple-system, sans-serif" font-weight="900" font-size="24" fill="${BRAND.white}" text-anchor="middle">Cash on Delivery Available 🇵🇰</text>
        </g>
      </g>
    </svg>
  `;

  return renderSvgToPng(svg, outputPath);
}

// Post 10: Special Conversion Offer (Static 4:5, 1080x1350)
export function renderPost10(outputPath = path.join(GENERATED_DIR, 'post_10_offer.png')) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');
  const pkgB64 = getAssetBase64('packaging section one.png');
  const singleB64 = getAssetBase64('Single.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <!-- High conversion purple gradient -->
      <rect width="1080" height="1350" fill="url(#purpleGrad)"/>

      <!-- Header: Logo & Badge -->
      <image href="${logoB64}" x="60" y="40" width="280" height="95" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(720, 60)">
        <rect width="300" height="52" rx="26" fill="${BRAND.white}"/>
        <text x="150" y="34" font-family="-apple-system, sans-serif" font-weight="800" font-size="22" fill="${BRAND.purple}" text-anchor="middle">SPECIAL OFFER 🛍️</text>
      </g>

      <!-- Headline -->
      <text x="60" y="195" font-family="-apple-system, sans-serif" font-weight="900" font-size="52" fill="${BRAND.white}">Ready to ditch</text>
      <text x="60" y="255" font-family="-apple-system, sans-serif" font-weight="900" font-size="52" fill="#FFE27A">the peach fuzz? ✨</text>
      <text x="60" y="305" font-family="-apple-system, sans-serif" font-weight="600" font-size="24" fill="${BRAND.white}">Girlies Glow Eco-Friendly Facial Razor</text>

      <!-- Split Hero Showcase (Packaging + Single Razor) -->
      <g transform="translate(60, 340)">
        <!-- Left: Packaging photo -->
        <clipPath id="pkgClip"><rect x="0" y="0" width="465" height="500" rx="28"/></clipPath>
        <g filter="url(#softShadow)">
          <rect width="465" height="500" rx="28" fill="${BRAND.white}"/>
          <image href="${pkgB64}" clip-path="url(#pkgClip)" width="465" height="500" preserveAspectRatio="xMidYMid slice"/>
        </g>

        <!-- Right: Single Razor photo -->
        <clipPath id="singleOfferClip"><rect x="495" y="0" width="465" height="500" rx="28"/></clipPath>
        <g filter="url(#softShadow)">
          <rect x="495" width="465" height="500" rx="28" fill="${BRAND.white}"/>
          <image href="${singleB64}" clip-path="url(#singleOfferClip)" x="495" width="465" height="500" preserveAspectRatio="xMidYMid slice"/>
        </g>
      </g>

      <!-- Value Props Box -->
      <g transform="translate(60, 870)" filter="url(#softShadow)">
        <rect width="960" height="150" rx="28" fill="${BRAND.white}"/>
        <text x="40" y="50" font-family="-apple-system, sans-serif" font-weight="700" font-size="24" fill="${BRAND.purple}">✓ Biodegradable wheat-straw curved handle</text>
        <text x="40" y="90" font-family="-apple-system, sans-serif" font-weight="700" font-size="24" fill="${BRAND.purple}">✓ Stainless-steel micro-guard safety blade</text>
        <text x="40" y="130" font-family="-apple-system, sans-serif" font-weight="700" font-size="24" fill="${BRAND.purple}">✓ Protective travel cap included with every razor</text>
      </g>

      <!-- Prominent Pricing & Cash on Delivery CTA Section -->
      <g transform="translate(60, 1050)">
        <!-- Giant Price Badge -->
        <g transform="translate(0, 0)" filter="url(#softShadow)">
          <rect width="960" height="110" rx="28" fill="${BRAND.darkPlumCard}"/>
          <text x="60" y="74" font-family="-apple-system, sans-serif" font-weight="900" font-size="64" fill="#FFE27A">Rs. 599</text>
          <text x="360" y="52" font-family="-apple-system, sans-serif" font-weight="700" font-size="26" fill="${BRAND.white}">Only Rs. 599 • Order Today</text>
          <text x="360" y="86" font-family="-apple-system, sans-serif" font-weight="500" font-size="20" fill="#D3B7F5">Tap the link in bio or send a direct message!</text>
        </g>

        <!-- Huge COD Banner -->
        <g transform="translate(0, 130)" filter="url(#pillShadow)">
          <rect width="960" height="90" rx="45" fill="url(#greenAccentGrad)"/>
          <text x="480" y="56" font-family="-apple-system, sans-serif" font-weight="900" font-size="30" fill="${BRAND.white}" text-anchor="middle" letter-spacing="1">CASH ON DELIVERY AVAILABLE ACROSS PAKISTAN 🇵🇰</text>
        </g>
      </g>
    </svg>
  `;

  return renderSvgToPng(svg, outputPath);
}

// Generate creative for a specific post id ('1' through '10')
export function generateCreativeForPost(postId) {
  const id = String(postId);
  fs.mkdirSync(GENERATED_DIR, { recursive: true });

  switch (id) {
    case '1':
      return [renderPost1()];
    case '2':
      renderPost2();
      return [
        path.join(GENERATED_DIR, 'post_2_reel.png'),
        path.join(GENERATED_DIR, 'post_2_cover.png'),
        path.join(GENERATED_DIR, 'post_2_reel.mp4')
      ];
    case '3':
      renderPost3();
      return [
        path.join(GENERATED_DIR, 'post_3_slide_1.png'),
        path.join(GENERATED_DIR, 'post_3_slide_2.png'),
        path.join(GENERATED_DIR, 'post_3_slide_3.png'),
        path.join(GENERATED_DIR, 'post_3_slide_4.png')
      ];
    case '4':
      return [renderPost4()];
    case '5':
      renderPost5();
      return [
        path.join(GENERATED_DIR, 'post_5_reel.png'),
        path.join(GENERATED_DIR, 'post_5_cover.png'),
        path.join(GENERATED_DIR, 'post_5_reel.mp4')
      ];
    case '6':
      return [renderPost6()];
    case '7':
      renderPost7();
      return [
        path.join(GENERATED_DIR, 'post_7_reel.png'),
        path.join(GENERATED_DIR, 'post_7_cover.png'),
        path.join(GENERATED_DIR, 'post_7_reel.mp4')
      ];
    case '8':
      renderPost8();
      return [
        path.join(GENERATED_DIR, 'post_8_slide_1.png'),
        path.join(GENERATED_DIR, 'post_8_slide_2.png'),
        path.join(GENERATED_DIR, 'post_8_slide_3.png'),
        path.join(GENERATED_DIR, 'post_8_slide_4.png'),
        path.join(GENERATED_DIR, 'post_8_slide_5.png')
      ];
    case '9':
      return [renderPost9()];
    case '10':
      return [renderPost10()];
    default:
      throw new Error(`Unknown post ID: ${postId}`);
  }
}

// Generate all creatives for the 10 scheduled posts
export async function generateAllCreatives() {
  console.log('Generating Girlies Glow creatives in public/generated/...');
  fs.mkdirSync(GENERATED_DIR, { recursive: true });

  const generated = [];
  for (let i = 1; i <= 10; i++) {
    console.log(`Generating Post ${i}...`);
    const files = generateCreativeForPost(i);
    generated.push(...files);
  }

  console.log(`Generated ${generated.length} creative media assets.`);
  return generated;
}

// CLI runner
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  try {
    const postArgIndex = process.argv.indexOf('--post');
    if (postArgIndex !== -1 && process.argv[postArgIndex + 1]) {
      const postId = process.argv[postArgIndex + 1];
      console.log(`Generating creative for Post ${postId}...`);
      generateCreativeForPost(postId);
      console.log(`Done.`);
    } else {
      await generateAllCreatives();
    }
  } catch (err) {
    console.error('Failed to generate creatives:', err);
    process.exit(1);
  }
}
