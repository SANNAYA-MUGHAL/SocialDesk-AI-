import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// --- Luxury Skincare Brand System (Benchmarked against @sayuriofficialpk) ---
export const BRAND = {
  purple: '#683DA9',       // Primary Wordmark Purple
  deepPlum: '#2B1245',     // Deep Editorial Plum for Serif Headlines
  lightOrchid: '#9B60E0',  // Lilac / Orchid Accent
  softLavender: '#F4EFFB', // Delicate Lavender Background
  warmCream: '#FAF7F2',    // Luxury Warm Skincare Cream Background
  white: '#FFFFFF',
  leafGreen: '#2E7D32',    // Rich Forest Green for COD / Eco Badges
  lightGreenBg: '#F0FDF4', // Light green pill background
  darkText: '#1F1030',     // Luxury deep charcoal/plum text
  mutedText: '#6E5C82',    // Elegant muted subtitle text
  borderLight: 'rgba(104, 61, 169, 0.12)',
  cardShadow: 'rgba(43, 18, 69, 0.08)'
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const GENERATED_DIR = path.join(ROOT_DIR, 'public', 'generated');

// Helper to escape XML characters
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

// Shared SVG Definitions (Gradients & Drop Shadows)
function getSvgDefs() {
  return `
    <defs>
      <linearGradient id="bgWarmGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FAF7F2"/>
        <stop offset="50%" stop-color="#F7F1FA"/>
        <stop offset="100%" stop-color="#F2EAF8"/>
      </linearGradient>
      <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#2E7D32"/>
        <stop offset="100%" stop-color="#388E3C"/>
      </linearGradient>
      <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${BRAND.purple}"/>
        <stop offset="100%" stop-color="${BRAND.lightOrchid}"/>
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFD700"/>
        <stop offset="100%" stop-color="#F59E0B"/>
      </linearGradient>
      <filter id="softShadow" x="-10%" y="-10%" width="125%" height="130%">
        <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#2B1245" flood-opacity="0.08"/>
      </filter>
      <filter id="cardShadow" x="-10%" y="-10%" width="125%" height="130%">
        <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#2B1245" flood-opacity="0.06"/>
      </filter>
    </defs>
  `;
}

// Brand Header (Logo + Editorial Pill)
function drawHeader(logoB64, categoryText = 'DERMAPLANING 101') {
  return `
    <image href="${logoB64}" x="60" y="45" width="220" height="75" preserveAspectRatio="xMidYMid meet"/>
    <g transform="translate(680, 55)">
      <rect width="340" height="46" rx="23" fill="${BRAND.purple}"/>
      <text x="170" y="29" font-family="'Avenir Next', -apple-system, sans-serif" font-weight="700" font-size="15" fill="${BRAND.white}" text-anchor="middle" letter-spacing="1.5">${escapeXml(categoryText)}</text>
    </g>
  `;
}

// Bottom Conversion & Pricing Bar (Rs. 599 + COD Across Pakistan)
function drawBottomPricingBar(y = 1215) {
  return `
    <g transform="translate(60, ${y})" filter="url(#softShadow)">
      <rect width="960" height="85" rx="24" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
      <text x="35" y="38" font-family="Didot, 'Bodoni 72', Georgia, serif" font-weight="bold" font-size="24" fill="${BRAND.deepPlum}">Girlies Glow At-Home Facial Razor</text>
      <text x="35" y="65" font-family="'Avenir Next', -apple-system, sans-serif" font-weight="600" font-size="16" fill="${BRAND.mutedText}">Eco Wheat-Straw Handle • Stainless Micro-Guard Blade</text>

      <g transform="translate(540, 15)">
        <rect width="385" height="55" rx="20" fill="url(#greenGrad)"/>
        <text x="192" y="35" font-family="'Avenir Next', -apple-system, sans-serif" font-weight="800" font-size="16" fill="${BRAND.white}" text-anchor="middle" letter-spacing="0.5">🚚 Rs. 599 • CASH ON DELIVERY</text>
      </g>
    </g>
  `;
}

// Helper: 5 Gold Stars
function drawGoldStars(x, y, size = 26, gap = 34) {
  let stars = '';
  for (let i = 0; i < 5; i++) {
    const cx = x + i * gap;
    stars += `
      <polygon points="${cx},${y - size/2} ${cx + size*0.2},${y - size*0.1} ${cx + size*0.5},${y - size*0.1} ${cx + size*0.25},${y + size*0.1} ${cx + size*0.35},${y + size*0.45} ${cx},${y + size*0.25} ${cx - size*0.35},${y + size*0.45} ${cx - size*0.25},${y + size*0.1} ${cx - size*0.5},${y - size*0.1} ${cx - size*0.2},${y - size*0.1}" fill="url(#goldGrad)"/>
    `;
  }
  return stars;
}

// ==========================================
// 10 SAYURI-GRADE EDITORIAL POST CREATIVES
// ==========================================

// Post 1: Myth Buster (Static 4:5, 1080x1350)
export function renderPost1(outputPath = path.join(GENERATED_DIR, 'post_1_static.png')) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');
  const photoB64 = getAssetBase64('Card 1.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p1Clip">
          <rect x="60" y="270" width="960" height="490" rx="28" ry="28"/>
        </clipPath>
      </defs>

      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawHeader(logoB64, 'DERMAPLANING MYTHS')}

      <!-- Editorial Headline -->
      <text x="60" y="175" font-family="Didot, 'Bodoni 72', Georgia, serif" font-weight="bold" font-size="46" fill="${BRAND.deepPlum}">Will Shaving Make Facial Hair</text>
      <text x="60" y="230" font-family="Didot, 'Bodoni 72', Georgia, serif" font-weight="bold" font-size="46" fill="${BRAND.purple}">Grow Back Thicker? 💭</text>

      <!-- Real Macro Studio Asset -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p1Clip)">
          <image href="${photoB64}" x="60" y="210" width="960" height="600" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="270" width="960" height="490" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <!-- Floating Badge on Photo -->
      <g transform="translate(90, 300)">
        <rect width="280" height="44" rx="22" fill="rgba(255, 255, 255, 0.92)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="140" y="28" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="15" fill="${BRAND.purple}" text-anchor="middle">✨ REAL PEACH FUZZ REMOVAL</text>
      </g>

      <!-- Myth vs Fact Floating Card -->
      <g transform="translate(60, 785)" filter="url(#softShadow)">
        <rect width="960" height="410" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="2"/>

        <!-- Myth Box -->
        <g transform="translate(35, 30)">
          <rect width="890" height="155" rx="20" fill="#FFF5F5" stroke="#FECDD3" stroke-width="1.5"/>
          <g transform="translate(25, 20)">
            <rect width="160" height="36" rx="18" fill="#E11D48"/>
            <text x="80" y="24" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="15" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">❌ THE MYTH</text>
          </g>
          <text x="25" y="95" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="24" fill="#881337">“Shaving causes hair to grow back thicker, darker, and faster.”</text>
          <text x="25" y="130" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="18" fill="#9F1239">A common misconception passed down without scientific evidence.</text>
        </g>

        <!-- Fact Box -->
        <g transform="translate(35, 205)">
          <rect width="890" height="175" rx="20" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1.5"/>
          <g transform="translate(25, 20)">
            <rect width="160" height="36" rx="18" fill="#15803D"/>
            <text x="80" y="24" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="15" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">✅ THE TRUTH</text>
          </g>
          <text x="25" y="95" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="24" fill="#14532D">“Dermaplaning only blunts hair at the surface of the skin.”</text>
          <text x="25" y="130" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="18" fill="#166534">Hair follicle thickness, DNA, and growth rate are 100% unaffected.</text>
          <text x="25" y="155" font-family="'Avenir Next', sans-serif" font-weight="600" font-size="17" fill="#15803D">Result: Glass skin, zero peach fuzz, and seamless foundation base!</text>
        </g>
      </g>

      ${drawBottomPricingBar(1215)}
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
  const photoB64 = getAssetBase64('Card 2.png');

  // Copy reference video/GIF if exists
  const refGif = path.join(ROOT_DIR, 'WhatsApp GIF 2026-09-11 at 00.01.06.gif');
  if (fs.existsSync(refGif)) fs.copyFileSync(refGif, reelMp4Path);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p2Clip">
          <rect x="60" y="320" width="960" height="880" rx="36" ry="36"/>
        </clipPath>
      </defs>

      <rect width="1080" height="1920" fill="url(#bgWarmGrad)"/>

      <!-- Header -->
      <image href="${logoB64}" x="60" y="55" width="240" height="80" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(660, 70)">
        <rect width="360" height="52" rx="26" fill="${BRAND.purple}"/>
        <text x="180" y="33" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="16" fill="${BRAND.white}" text-anchor="middle" letter-spacing="1.5">HOW TO DERMAPLANE ✨</text>
      </g>

      <!-- Headline -->
      <text x="60" y="210" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="52" fill="${BRAND.deepPlum}">The Secret to Flawless,</text>
      <text x="60" y="275" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="52" fill="${BRAND.purple}">Butter-Smooth Glass Skin 🌸</text>

      <!-- Real Macro Studio Asset (Card 2) -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p2Clip)">
          <image href="${photoB64}" x="60" y="250" width="960" height="1000" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="320" width="960" height="880" rx="36" ry="36" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <!-- Floating Badges on Photo -->
      <g transform="translate(90, 360)">
        <rect width="300" height="48" rx="24" fill="rgba(255, 255, 255, 0.95)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="150" y="30" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="16" fill="${BRAND.purple}" text-anchor="middle">✨ REAL PEACH FUZZ CAPTURE</text>
      </g>

      <g transform="translate(90, 1130)">
        <rect width="330" height="44" rx="22" fill="rgba(43, 18, 69, 0.85)"/>
        <text x="165" y="28" font-family="'Avenir Next', sans-serif" font-weight="600" font-size="15" fill="${BRAND.white}" text-anchor="middle">🛡️ Stainless Micro-Guard Safety Edge</text>
      </g>

      <!-- 3 Step Highlights -->
      <g transform="translate(60, 1230)" filter="url(#softShadow)">
        <rect width="960" height="420" rx="32" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>

        <!-- Step 1 -->
        <g transform="translate(40, 35)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">01</text>
          <text x="75" y="26" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="26" fill="${BRAND.deepPlum}">Cleanse &amp; Prep</text>
          <text x="75" y="55" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="18" fill="${BRAND.mutedText}">Wash face thoroughly. Shave on dry skin or with a few drops of facial oil.</text>
        </g>

        <!-- Step 2 -->
        <g transform="translate(40, 135)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">02</text>
          <text x="75" y="26" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="26" fill="${BRAND.deepPlum}">Hold at 45° Angle</text>
          <text x="75" y="55" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="18" fill="${BRAND.mutedText}">Pull skin taut with your free hand. Glide with light, short downward strokes.</text>
        </g>

        <!-- Step 3 -->
        <g transform="translate(40, 235)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">03</text>
          <text x="75" y="26" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="26" fill="${BRAND.deepPlum}">Hydrate &amp; Protect</text>
          <text x="75" y="55" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="18" fill="${BRAND.mutedText}">Apply your favorite barrier cream or hydrating serum for glowing glass skin.</text>
        </g>

        <rect x="40" y="325" width="880" height="65" rx="18" fill="${BRAND.softLavender}"/>
        <text x="480" y="365" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="20" fill="${BRAND.purple}" text-anchor="middle">🌾 Eco Wheat-Straw Handle • Beginner Friendly • Zero Cuts</text>
      </g>

      <!-- Bottom Order Pill -->
      <g transform="translate(60, 1680)" filter="url(#softShadow)">
        <rect width="960" height="150" rx="36" fill="url(#greenGrad)"/>
        <text x="480" y="65" font-family="'Avenir Next', sans-serif" font-weight="900" font-size="30" fill="${BRAND.white}" text-anchor="middle">Rs. 599 • CASH ON DELIVERY NATIONWIDE</text>
        <text x="480" y="105" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">DM @girli_esglow or tap link in bio to order now</text>
      </g>
    </svg>
  `;

  renderSvgToPng(svg, coverPngPath);
  const altCover = path.join(GENERATED_DIR, 'post_2_cover.png');
  fs.copyFileSync(coverPngPath, altCover);
  return coverPngPath;
}

// Post 3: Makeup Benefits (Carousel 4 slides, each 1080x1350)
export function renderPost3(outputDir = GENERATED_DIR) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');
  const cakeyB64 = getAssetBase64('card7.png');
  const drySkinB64 = getAssetBase64('car5.png');
  const razorActionB64 = getAssetBase64('Card 1.png');
  const flatlayB64 = getAssetBase64('Section 1.png');

  // Slide 1: Hook (Why your foundation looks cakey)
  const svg1 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p3s1Clip"><rect x="60" y="270" width="960" height="660" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawHeader(logoB64, 'BEAUTY SECRETS 💄')}

      <text x="60" y="175" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.deepPlum}">Why Does Your Foundation</text>
      <text x="60" y="230" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.purple}">Look Cakey &amp; Textured? 👀</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p3s1Clip)">
          <image href="${cakeyB64}" x="60" y="180" width="960" height="800" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="270" width="960" height="660" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 305)">
        <rect width="320" height="44" rx="22" fill="rgba(255, 255, 255, 0.94)" stroke="rgba(225, 29, 72, 0.3)" stroke-width="1.5"/>
        <text x="160" y="28" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="15" fill="#E11D48" text-anchor="middle">⚠️ CAKEY FOUNDATION CLINGING</text>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="28" fill="${BRAND.deepPlum}">It’s Not Your Skincare — It’s Peach Fuzz!</text>
        <text x="40" y="95" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">Microscopic facial hair and dead skin trap liquid pigment and powder,</text>
        <text x="40" y="125" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">causing your base to look patchy and separate throughout the day.</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="${BRAND.softLavender}"/>
          <text x="440" y="33" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="18" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO SEE HOW DERMAPLANING FIXES THIS 👉</text>
        </g>
      </g>

      ${drawBottomPricingBar(1220)}
    </svg>
  `;

  // Slide 2: The Root Cause (Dead skin & hair)
  const svg2 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p3s2Clip"><rect x="60" y="270" width="960" height="660" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawHeader(logoB64, 'THE ROOT CAUSE 🔍')}

      <text x="60" y="175" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.deepPlum}">The Hidden Barrier Between</text>
      <text x="60" y="230" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.purple}">You and Flawless Skin 🔬</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p3s2Clip)">
          <image href="${drySkinB64}" x="60" y="180" width="960" height="800" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="270" width="960" height="660" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 305)">
        <rect width="320" height="44" rx="22" fill="rgba(255, 255, 255, 0.94)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="160" y="28" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="15" fill="${BRAND.purple}" text-anchor="middle">🔍 MICROSCOPIC DRY TEXTURE</text>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="28" fill="${BRAND.deepPlum}">Why Standard Exfoliation Falls Short</text>
        <text x="40" y="95" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">Scrubs only aggravate skin, and toners cannot remove physical vellus hair.</text>
        <text x="40" y="125" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">Dermaplaning physically clears dead cellular debris and peach fuzz in minutes.</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="${BRAND.softLavender}"/>
          <text x="440" y="33" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="18" fill="${BRAND.purple}" text-anchor="middle">SWIPE FOR THE 5-MINUTE FIX 👉</text>
        </g>
      </g>

      ${drawBottomPricingBar(1220)}
    </svg>
  `;

  // Slide 3: The Solution (Dermaplaning with Girlies Glow)
  const svg3 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p3s3Clip"><rect x="60" y="270" width="960" height="660" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawHeader(logoB64, 'THE SOLUTION ✨')}

      <text x="60" y="175" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.deepPlum}">Dermaplane First.</text>
      <text x="60" y="230" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.purple}">Melt Foundation Later. 🌸</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p3s3Clip)">
          <image href="${razorActionB64}" x="60" y="200" width="960" height="780" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="270" width="960" height="660" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 305)">
        <rect width="280" height="44" rx="22" fill="rgba(255, 255, 255, 0.94)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="140" y="28" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="15" fill="${BRAND.purple}" text-anchor="middle">✨ EFFORTLESS GLOW AT HOME</text>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="28" fill="${BRAND.deepPlum}">Baby Soft, Reflective Canvas</text>
        <text x="40" y="95" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">Light strokes glide smoothly over the skin surface with our micro-guard.</text>
        <text x="40" y="125" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">Zero pain, zero cuts. Makeup applies like melted butter.</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="${BRAND.softLavender}"/>
          <text x="440" y="33" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="18" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO MEET YOUR NEW BEAUTY BESTIE 👉</text>
        </g>
      </g>

      ${drawBottomPricingBar(1220)}
    </svg>
  `;

  // Slide 4: The Result & Offer (Travertine flatlay + Rs. 599 COD)
  const svg4 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p3s4Clip"><rect x="60" y="270" width="960" height="660" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawHeader(logoB64, 'GLOW AT HOME 🇵🇰')}

      <text x="60" y="175" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.deepPlum}">Meet The Girlies Glow</text>
      <text x="60" y="230" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.purple}">Wheat-Straw Facial Razor ✨</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p3s4Clip)">
          <image href="${flatlayB64}" x="60" y="220" width="960" height="740" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="270" width="960" height="660" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 305)">
        <rect width="330" height="44" rx="22" fill="rgba(255, 255, 255, 0.94)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="165" y="28" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="15" fill="${BRAND.purple}" text-anchor="middle">🌾 BIODEGRADABLE WHEAT STRAW</text>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="28" fill="${BRAND.deepPlum}">Your Base Just Found Its Match 💜</text>
        <text x="40" y="95" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">3x Eco-friendly wheat straw razors with precision micro-guards.</text>
        <text x="40" y="125" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">Safe for sensitive skin. Lasts months. Cash on Delivery nationwide.</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="url(#greenGrad)"/>
          <text x="440" y="33" font-family="'Avenir Next', sans-serif" font-weight="900" font-size="20" fill="${BRAND.white}" text-anchor="middle">ORDER NOW FOR Rs. 599 • CASH ON DELIVERY 🇵🇰</text>
        </g>
      </g>

      ${drawBottomPricingBar(1220)}
    </svg>
  `;

  const s1 = renderSvgToPng(svg1, path.join(outputDir, 'post_3_slide_1.png'));
  const s2 = renderSvgToPng(svg2, path.join(outputDir, 'post_3_slide_2.png'));
  const s3 = renderSvgToPng(svg3, path.join(outputDir, 'post_3_slide_3.png'));
  const s4 = renderSvgToPng(svg4, path.join(outputDir, 'post_3_slide_4.png'));
  return [s1, s2, s3, s4];
}

// Post 4: Salon vs. Home (Static 4:5, 1080x1350)
export function renderPost4(outputPath = path.join(GENERATED_DIR, 'post_4_static.png')) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');
  const photoB64 = getAssetBase64('Section 1.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p4PhotoClip"><rect x="60" y="900" width="960" height="290" rx="24" ry="24"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawHeader(logoB64, 'SMART BEAUTY • COMPARISON')}

      <text x="60" y="175" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.deepPlum}">Parlour Jaane Ka Mood Nahi?</text>
      <text x="60" y="230" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.purple}">Glow Ghar Par 💅</text>

      <!-- Side-by-Side Comparison Grid -->
      <g transform="translate(60, 275)" filter="url(#softShadow)">
        <!-- Parlour Column -->
        <g transform="translate(0, 0)">
          <rect width="465" height="595" rx="28" fill="${BRAND.white}" stroke="#FEE2E2" stroke-width="2"/>
          <rect x="35" y="35" width="220" height="42" rx="21" fill="#FEE2E2"/>
          <text x="145" y="62" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="16" fill="#DC2626" text-anchor="middle">SALON WAXING / THREADING</text>

          <text x="35" y="125" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="34" fill="#991B1B">Rs. 1,500 – 2,500</text>
          <text x="35" y="155" font-family="'Avenir Next', sans-serif" font-weight="600" font-size="16" fill="#B91C1C">Every single parlour appointment</text>

          <g transform="translate(35, 195)">
            <text x="0" y="30" font-family="'Avenir Next', sans-serif" font-weight="600" font-size="18" fill="#7F1D1D">✕ 1-2 hours lost in traffic &amp; waiting</text>
            <text x="0" y="80" font-family="'Avenir Next', sans-serif" font-weight="600" font-size="18" fill="#7F1D1D">✕ Painful hair pulling &amp; skin stretching</text>
            <text x="0" y="130" font-family="'Avenir Next', sans-serif" font-weight="600" font-size="18" fill="#7F1D1D">✕ Post-waxing redness &amp; breakout risk</text>
            <text x="0" y="180" font-family="'Avenir Next', sans-serif" font-weight="600" font-size="18" fill="#7F1D1D">✕ High recurring monthly expense</text>
          </g>

          <rect x="35" y="475" width="395" height="80" rx="18" fill="#FEF2F2"/>
          <text x="232" y="515" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="16" fill="#991B1B" text-anchor="middle">Over Rs. 24,000/year spent</text>
          <text x="232" y="538" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="14" fill="#B91C1C" text-anchor="middle">on routine salon visits</text>
        </g>

        <!-- Girlies Glow Column -->
        <g transform="translate(495, 0)">
          <rect width="465" height="595" rx="28" fill="${BRAND.white}" stroke="#BBF7D0" stroke-width="2"/>
          <rect x="35" y="35" width="180" height="42" rx="21" fill="#DCFCE7"/>
          <text x="125" y="62" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="16" fill="#15803D" text-anchor="middle">GIRLIES GLOW ✨</text>

          <text x="35" y="125" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="34" fill="#166534">Rs. 599 ONLY</text>
          <text x="35" y="155" font-family="'Avenir Next', sans-serif" font-weight="600" font-size="16" fill="#15803D">Complete set • Reusable for months</text>

          <g transform="translate(35, 195)">
            <text x="0" y="30" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="18" fill="#14532D">✓ 5 minutes in your own bedroom</text>
            <text x="0" y="80" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="18" fill="#14532D">✓ 100% Painless micro-guard blade</text>
            <text x="0" y="130" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="18" fill="#14532D">✓ Instant glass skin &amp; smooth base</text>
            <text x="0" y="180" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="18" fill="#14532D">✓ Biodegradable eco wheat-straw</text>
          </g>

          <rect x="35" y="475" width="395" height="80" rx="18" fill="url(#greenGrad)"/>
          <text x="232" y="515" font-family="'Avenir Next', sans-serif" font-weight="900" font-size="18" fill="${BRAND.white}" text-anchor="middle">SAVE OVER Rs. 20,000</text>
          <text x="232" y="540" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="14" fill="${BRAND.white}" text-anchor="middle">Same salon results from home</text>
        </g>
      </g>

      <!-- Real Photo Showcase at Bottom -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p4PhotoClip)">
          <image href="${photoB64}" x="60" y="870" width="960" height="360" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="900" width="960" height="290" rx="24" ry="24" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
        
        <g transform="translate(90, 930)">
          <rect width="280" height="42" rx="21" fill="rgba(255, 255, 255, 0.95)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
          <text x="140" y="27" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="15" fill="${BRAND.purple}" text-anchor="middle">🌾 WHEAT-STRAW PACK OF 3</text>
        </g>
      </g>

      ${drawBottomPricingBar(1220)}
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
  const photoB64 = getAssetBase64('Card 4.png');

  const refGif = path.join(ROOT_DIR, 'WhatsApp GIF 2026-09-11 at 00.01.14.gif');
  if (fs.existsSync(refGif)) fs.copyFileSync(refGif, reelMp4Path);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p5Clip"><rect x="60" y="320" width="960" height="880" rx="36" ry="36"/></clipPath>
      </defs>
      <rect width="1080" height="1920" fill="url(#bgWarmGrad)"/>

      <!-- Header -->
      <image href="${logoB64}" x="60" y="55" width="240" height="80" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(640, 70)">
        <rect width="380" height="52" rx="26" fill="${BRAND.purple}"/>
        <text x="190" y="33" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="16" fill="${BRAND.white}" text-anchor="middle" letter-spacing="1.5">REAL CUSTOMER REVIEW ⭐</text>
      </g>

      <!-- Headline -->
      <text x="60" y="210" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="52" fill="${BRAND.deepPlum}">“I was terrified to shave my face</text>
      <text x="60" y="275" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="52" fill="${BRAND.purple}">until I tried Girlies Glow!” 💜</text>

      <!-- Real Lifestyle Photo (Card 4) -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p5Clip)">
          <image href="${photoB64}" x="60" y="260" width="960" height="980" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="320" width="960" height="880" rx="36" ry="36" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <!-- Floating Badge on Photo -->
      <g transform="translate(90, 360)">
        <rect width="280" height="48" rx="24" fill="rgba(255, 255, 255, 0.95)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="140" y="30" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="16" fill="${BRAND.purple}" text-anchor="middle">🌸 10,000+ HAPPY GIRLS</text>
      </g>

      <!-- Luxury Testimonial Card -->
      <g transform="translate(60, 1230)" filter="url(#softShadow)">
        <rect width="960" height="420" rx="32" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>

        <!-- Gold Stars & Verified Badge -->
        <g transform="translate(50, 45)">
          ${drawGoldStars(20, 20, 30, 40)}
          <rect x="235" y="2" width="180" height="38" rx="19" fill="#ECFDF5"/>
          <text x="325" y="26" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="15" fill="#047857" text-anchor="middle">VERIFIED BUYER ✓</text>
        </g>

        <!-- Quote -->
        <g transform="translate(50, 115)">
          <text x="0" y="35" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="28" fill="${BRAND.deepPlum}">“Honestly, my parlour lady always said baal motay ho jayenge.”</text>
          <text x="0" y="80" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="20" fill="${BRAND.mutedText}">“Finally ordered Girlies Glow for Rs. 599. My foundation has</text>
          <text x="0" y="115" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="20" fill="${BRAND.purple}">NEVER looked this smooth! Zero cuts, zero redness. Best at-home decision!”</text>
        </g>

        <!-- Customer Signature -->
        <g transform="translate(50, 290)">
          <circle cx="30" cy="30" r="30" fill="${BRAND.softLavender}"/>
          <text x="30" y="39" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="22" fill="${BRAND.purple}" text-anchor="middle">A</text>
          <text x="75" y="28" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="22" fill="${BRAND.deepPlum}">Ayesha K. — Lahore</text>
          <text x="75" y="52" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="16" fill="${BRAND.mutedText}">Cash on Delivery order • 5-Star Experience</text>
        </g>
      </g>

      <!-- Bottom Order Pill -->
      <g transform="translate(60, 1680)" filter="url(#softShadow)">
        <rect width="960" height="150" rx="36" fill="url(#greenGrad)"/>
        <text x="480" y="65" font-family="'Avenir Next', sans-serif" font-weight="900" font-size="30" fill="${BRAND.white}" text-anchor="middle">Rs. 599 • CASH ON DELIVERY NATIONWIDE</text>
        <text x="480" y="105" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">Order via DM @girli_esglow or link in bio</text>
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
  const photoB64 = getAssetBase64('Single.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p6Clip"><rect x="60" y="270" width="960" height="490" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawHeader(logoB64, 'ECO-LUXURY BEAUTY 🌿')}

      <text x="60" y="175" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.deepPlum}">Small Razor. Big Glow Energy ✨</text>
      <text x="60" y="230" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.purple}">Designed Specifically For Female Skin</text>

      <!-- Real Studio Flatlay Asset -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p6Clip)">
          <image href="${photoB64}" x="60" y="180" width="960" height="660" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="270" width="960" height="490" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 305)">
        <rect width="320" height="44" rx="22" fill="rgba(255, 255, 255, 0.94)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="160" y="28" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="15" fill="${BRAND.purple}" text-anchor="middle">🌾 NATURAL WHEAT-STRAW BODY</text>
      </g>

      <!-- 4 Core Benefits Grid -->
      <g transform="translate(60, 785)" filter="url(#softShadow)">
        <rect width="960" height="410" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>

        <!-- Benefit 1 -->
        <g transform="translate(40, 35)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">🌾</text>
          <text x="75" y="26" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="24" fill="${BRAND.deepPlum}">Biodegradable Wheat Straw</text>
          <text x="75" y="52" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="17" fill="${BRAND.mutedText}">Sustainable cream body with organic beige speckles. Zero cheap plastic.</text>
        </g>

        <!-- Benefit 2 -->
        <g transform="translate(40, 125)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">🛡️</text>
          <text x="75" y="26" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="24" fill="${BRAND.deepPlum}">Micro-Guard Safety Blade</text>
          <text x="75" y="52" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="17" fill="${BRAND.mutedText}">Stainless-steel protective ribs ensure 100% painless glide with zero nicks.</text>
        </g>

        <!-- Benefit 3 -->
        <g transform="translate(40, 215)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">✨</text>
          <text x="75" y="26" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="24" fill="${BRAND.deepPlum}">Instant 2-in-1 Exfoliation</text>
          <text x="75" y="52" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="17" fill="${BRAND.mutedText}">Removes dulling peach fuzz and sweeps away dry dead skin cells in minutes.</text>
        </g>

        <!-- Benefit 4 -->
        <g transform="translate(40, 305)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">💧</text>
          <text x="75" y="26" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="24" fill="${BRAND.deepPlum}">3x Skincare Absorption</text>
          <text x="75" y="52" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="17" fill="${BRAND.mutedText}">Serums, hyaluronic acid, and creams penetrate deeply for true glass skin.</text>
        </g>
      </g>

      ${drawBottomPricingBar(1215)}
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
  const photoB64 = getAssetBase64('Card 1.png');

  const refGif = path.join(ROOT_DIR, 'WhatsApp GIF 2026-09-11 at 00.01.24.gif');
  if (fs.existsSync(refGif)) fs.copyFileSync(refGif, reelMp4Path);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p7Clip"><rect x="60" y="320" width="960" height="880" rx="36" ry="36"/></clipPath>
      </defs>
      <rect width="1080" height="1920" fill="url(#bgWarmGrad)"/>

      <!-- Header -->
      <image href="${logoB64}" x="60" y="55" width="240" height="80" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(650, 70)">
        <rect width="370" height="52" rx="26" fill="${BRAND.purple}"/>
        <text x="185" y="33" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="16" fill="${BRAND.white}" text-anchor="middle" letter-spacing="1.5">SUNDAY NIGHT RESET 🧖‍♀️</text>
      </g>

      <!-- Headline -->
      <text x="60" y="210" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="52" fill="${BRAND.deepPlum}">GRWM But First…</text>
      <text x="60" y="275" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="52" fill="${BRAND.purple}">Peach Fuzz Has To Go! ✨</text>

      <!-- Real Macro Studio Asset (Card 1) -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p7Clip)">
          <image href="${photoB64}" x="60" y="240" width="960" height="1000" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="320" width="960" height="880" rx="36" ry="36" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <!-- Floating Badge on Photo -->
      <g transform="translate(90, 360)">
        <rect width="310" height="48" rx="24" fill="rgba(255, 255, 255, 0.95)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="155" y="30" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="16" fill="${BRAND.purple}" text-anchor="middle">🌸 STEP 0 IN EVERY MAKEUP PREP</text>
      </g>

      <!-- 3-Step Glass Skin Guide -->
      <g transform="translate(60, 1230)" filter="url(#softShadow)">
        <rect width="960" height="420" rx="32" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>

        <!-- Routine Step 1 -->
        <g transform="translate(40, 35)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">01</text>
          <text x="75" y="26" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="26" fill="${BRAND.deepPlum}">Wash &amp; Apply Facial Oil</text>
          <text x="75" y="55" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="18" fill="${BRAND.mutedText}">2 drops of squalane or aloe gel give the razor effortless glide.</text>
        </g>

        <!-- Routine Step 2 -->
        <g transform="translate(40, 135)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">02</text>
          <text x="75" y="26" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="26" fill="${BRAND.deepPlum}">Girlies Glow At 45° Angle</text>
          <text x="75" y="55" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="18" fill="${BRAND.mutedText}">Pull skin taut, use light downward strokes. Watch peach fuzz melt away.</text>
        </g>

        <!-- Routine Step 3 -->
        <g transform="translate(40, 235)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">03</text>
          <text x="75" y="26" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="26" fill="${BRAND.deepPlum}">Barrier Cream &amp; Sleep</text>
          <text x="75" y="55" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="18" fill="${BRAND.mutedText}">Hydrate deeply. Wake up with ultra-soft, reflective glass skin!</text>
        </g>

        <rect x="40" y="325" width="880" height="65" rx="18" fill="${BRAND.softLavender}"/>
        <text x="480" y="365" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="20" fill="${BRAND.purple}" text-anchor="middle">💄 Next Morning: Foundation Glides On Seamlessly Like A Filter</text>
      </g>

      <!-- Bottom Order Pill -->
      <g transform="translate(60, 1680)" filter="url(#softShadow)">
        <rect width="960" height="150" rx="36" fill="url(#greenGrad)"/>
        <text x="480" y="65" font-family="'Avenir Next', sans-serif" font-weight="900" font-size="30" fill="${BRAND.white}" text-anchor="middle">Rs. 599 • CASH ON DELIVERY NATIONWIDE</text>
        <text x="480" y="105" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">Tap link in bio or DM @girli_esglow to get yours</text>
      </g>
    </svg>
  `;

  renderSvgToPng(svg, coverPngPath);
  const altCover = path.join(GENERATED_DIR, 'post_7_cover.png');
  fs.copyFileSync(coverPngPath, altCover);
  return coverPngPath;
}

// Post 8: How to Use (Beginner Guide Carousel 5 slides, each 1080x1350)
export function renderPost8(outputDir = GENERATED_DIR) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');
  const mirrorB64 = getAssetBase64('Card 4.png');
  const cleanSkinB64 = getAssetBase64('Card 6.png');
  const tautB64 = getAssetBase64('Card 1.png');
  const bladeB64 = getAssetBase64('Card 2.png');
  const hydrateB64 = getAssetBase64('Section 1.png');

  // Slide 1: Cover
  const svg1 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs><clipPath id="p8s1Clip"><rect x="60" y="270" width="960" height="660" rx="28" ry="28"/></clipPath></defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawHeader(logoB64, 'DERMAPLANING 101')}

      <text x="60" y="175" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.deepPlum}">New to Facial Shaving?</text>
      <text x="60" y="230" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.purple}">Save This Beginner Guide 💜</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p8s1Clip)">
          <image href="${mirrorB64}" x="60" y="200" width="960" height="780" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="270" width="960" height="660" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="28" fill="${BRAND.deepPlum}">4 Simple Steps To Glow At Home</text>
        <text x="40" y="95" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">No pain, no cuts, no stubble. Dermaplaning is the gentlest way</text>
        <text x="40" y="125" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">to exfoliate dead skin and remove peach fuzz for radiant skin.</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="${BRAND.softLavender}"/>
          <text x="440" y="33" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="18" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO START STEP 1 👉</text>
        </g>
      </g>
      ${drawBottomPricingBar(1220)}
    </svg>
  `;

  // Slide 2: Step 1 (Cleanse)
  const svg2 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs><clipPath id="p8s2Clip"><rect x="60" y="270" width="960" height="660" rx="28" ry="28"/></clipPath></defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawHeader(logoB64, 'STEP 01 • PREPARATION')}

      <text x="60" y="175" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.deepPlum}">Step 1: Cleanse Thoroughly</text>
      <text x="60" y="230" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.purple}">Never Shave Over Makeup or Dirt 🧴</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p8s2Clip)">
          <image href="${cleanSkinB64}" x="60" y="200" width="960" height="780" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="270" width="960" height="660" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="28" fill="${BRAND.deepPlum}">Clean Canvas Is Essential</text>
        <text x="40" y="95" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">Wash with a gentle cleanser. Pat completely dry with a clean towel.</text>
        <text x="40" y="125" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">Beginners can apply 2 drops of squalane oil for extra smooth blade glide.</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="${BRAND.softLavender}"/>
          <text x="440" y="33" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="18" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO STEP 2 (THE ANGLE) 👉</text>
        </g>
      </g>
      ${drawBottomPricingBar(1220)}
    </svg>
  `;

  // Slide 3: Step 2 (Taut Skin at 45°)
  const svg3 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs><clipPath id="p8s3Clip"><rect x="60" y="270" width="960" height="660" rx="28" ry="28"/></clipPath></defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawHeader(logoB64, 'STEP 02 • THE TECHNIQUE')}

      <text x="60" y="175" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.deepPlum}">Step 2: Hold Skin Taut</text>
      <text x="60" y="230" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.purple}">Maintain a Precise 45° Angle 📐</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p8s3Clip)">
          <image href="${tautB64}" x="60" y="200" width="960" height="780" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="270" width="960" height="660" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="28" fill="${BRAND.deepPlum}">The Golden Rule of Dermaplaning</text>
        <text x="40" y="95" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">Use fingers from your free hand to gently pull your cheek taut.</text>
        <text x="40" y="125" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">Angle the Girlies Glow razor at 45° so the micro-guard protects your skin.</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="${BRAND.softLavender}"/>
          <text x="440" y="33" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="18" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO STEP 3 (THE STROKES) 👉</text>
        </g>
      </g>
      ${drawBottomPricingBar(1220)}
    </svg>
  `;

  // Slide 4: Step 3 (Feather-Light Strokes)
  const svg4 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs><clipPath id="p8s4Clip"><rect x="60" y="270" width="960" height="660" rx="28" ry="28"/></clipPath></defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawHeader(logoB64, 'STEP 03 • THE GLIDE')}

      <text x="60" y="175" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.deepPlum}">Step 3: Light Downward Strokes</text>
      <text x="60" y="230" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.purple}">Never Press Hard • Let The Blade Work ✨</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p8s4Clip)">
          <image href="${bladeB64}" x="60" y="200" width="960" height="780" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="270" width="960" height="660" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="28" fill="${BRAND.deepPlum}">Gentle, Short Feather Strokes</text>
        <text x="40" y="95" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">Move in short downward strokes following hair growth. Wipe blade periodically.</text>
        <text x="40" y="125" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">Watch peach fuzz and dull dead skin cells cleanly sweep away!</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="${BRAND.softLavender}"/>
          <text x="440" y="33" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="18" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO STEP 4 (AFTERCARE) 👉</text>
        </g>
      </g>
      ${drawBottomPricingBar(1220)}
    </svg>
  `;

  // Slide 5: Step 4 & CTA (Hydrate & Order)
  const svg5 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs><clipPath id="p8s5Clip"><rect x="60" y="270" width="960" height="660" rx="28" ry="28"/></clipPath></defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawHeader(logoB64, 'STEP 04 • AFTERCARE &amp; GLOW')}

      <text x="60" y="175" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.deepPlum}">Step 4: Hydrate &amp; Protect</text>
      <text x="60" y="230" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.purple}">Lock In Moisture For Glass Skin 💧</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p8s5Clip)">
          <image href="${hydrateB64}" x="60" y="200" width="960" height="780" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="270" width="960" height="660" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="28" fill="${BRAND.deepPlum}">Skip Active Acids For 24 Hours</text>
        <text x="40" y="95" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">Apply your favorite ceramide cream or hyaluronic serum.</text>
        <text x="40" y="125" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">Wipe razor with alcohol, snap the cap on, and store safely!</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="url(#greenGrad)"/>
          <text x="440" y="33" font-family="'Avenir Next', sans-serif" font-weight="900" font-size="20" fill="${BRAND.white}" text-anchor="middle">ORDER YOUR SET FOR Rs. 599 • CASH ON DELIVERY 🇵🇰</text>
        </g>
      </g>
      ${drawBottomPricingBar(1220)}
    </svg>
  `;

  const s1 = renderSvgToPng(svg1, path.join(outputDir, 'post_8_slide_1.png'));
  const s2 = renderSvgToPng(svg2, path.join(outputDir, 'post_8_slide_2.png'));
  const s3 = renderSvgToPng(svg3, path.join(outputDir, 'post_8_slide_3.png'));
  const s4 = renderSvgToPng(svg4, path.join(outputDir, 'post_8_slide_4.png'));
  const s5 = renderSvgToPng(svg5, path.join(outputDir, 'post_8_slide_5.png'));
  return [s1, s2, s3, s4, s5];
}

// Post 9: Real Results / Before & After (Static 4:5, 1080x1350)
export function renderPost9(outputPath = path.join(GENERATED_DIR, 'post_9_static.png')) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');
  const photoB64 = getAssetBase64('card 3.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p9Clip"><rect x="60" y="270" width="960" height="580" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawHeader(logoB64, 'REAL RESULTS • UNFILTERED')}

      <text x="60" y="175" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.deepPlum}">Before vs. After: Real Results</text>
      <text x="60" y="230" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.purple}">What Dermaplaning Truly Does ✨</text>

      <!-- Real Before & After Studio Asset (card 3) -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p9Clip)">
          <image href="${photoB64}" x="60" y="210" width="960" height="700" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="270" width="960" height="580" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
        
        <!-- Center Divider Line -->
        <line x1="540" y1="270" x2="540" y2="850" stroke="#FFFFFF" stroke-width="3" opacity="0.8"/>
      </g>

      <!-- Floating Labels on Before & After -->
      <g transform="translate(90, 305)">
        <rect width="210" height="42" rx="21" fill="rgba(43, 18, 69, 0.85)"/>
        <text x="105" y="27" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="15" fill="${BRAND.white}" text-anchor="middle">BEFORE: PEACH FUZZ</text>
      </g>

      <g transform="translate(570, 305)">
        <rect width="220" height="42" rx="21" fill="rgba(46, 125, 50, 0.90)"/>
        <text x="110" y="27" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="15" fill="${BRAND.white}" text-anchor="middle">AFTER: GLASS SKIN ✨</text>
      </g>

      <!-- Review Card -->
      <g transform="translate(60, 875)" filter="url(#softShadow)">
        <rect width="960" height="315" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>

        <g transform="translate(45, 35)">
          ${drawGoldStars(20, 20, 28, 38)}
          <rect x="230" y="2" width="180" height="38" rx="19" fill="#ECFDF5"/>
          <text x="320" y="26" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="15" fill="#047857" text-anchor="middle">VERIFIED BUYER ✓</text>
        </g>

        <g transform="translate(45, 95)">
          <text x="0" y="32" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="28" fill="${BRAND.deepPlum}">“No filter, no editing. My makeup glides on like silk now!”</text>
          <text x="0" y="72" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">“I was terrified to shave my face because of the old myth. But Girlies Glow has</text>
          <text x="0" y="104" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="19" fill="${BRAND.mutedText}">completely transformed my skin texture. Best Rs. 599 I ever spent!”</text>
        </g>

        <!-- Customer Signature -->
        <g transform="translate(45, 230)">
          <circle cx="25" cy="25" r="25" fill="${BRAND.softLavender}"/>
          <text x="25" y="33" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="18" fill="${BRAND.purple}" text-anchor="middle">M</text>
          <text x="65" y="24" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="20" fill="${BRAND.deepPlum}">Mahnoor R. — Karachi</text>
          <text x="65" y="46" font-family="'Avenir Next', sans-serif" font-weight="500" font-size="15" fill="${BRAND.mutedText}">Verified Customer • Cash on Delivery</text>
        </g>
      </g>

      ${drawBottomPricingBar(1215)}
    </svg>
  `;

  return renderSvgToPng(svg, outputPath);
}

// Post 10: Special Launch Offer (Static 4:5, 1080x1350)
export function renderPost10(outputPath = path.join(GENERATED_DIR, 'post_10_offer.png')) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');
  const photoB64 = getAssetBase64('Section 1.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p10Clip"><rect x="490" y="40" width="430" height="690" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawHeader(logoB64, 'EXCLUSIVE LAUNCH OFFER ⚡')}

      <text x="60" y="175" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.deepPlum}">Unlock Radiant Glass Skin At Home</text>
      <text x="60" y="230" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="46" fill="${BRAND.purple}">Girlies Glow At-Home Dermaplaning Pack 🌸</text>

      <!-- Center Offer Container -->
      <g transform="translate(60, 275)" filter="url(#softShadow)">
        <rect width="960" height="770" rx="32" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="2"/>

        <!-- Left Details Column -->
        <g transform="translate(45, 40)">
          <!-- Promo Pill -->
          <rect width="210" height="38" rx="19" fill="#FEE2E2"/>
          <text x="105" y="24" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="15" fill="#DC2626" text-anchor="middle">LAUNCH OFFER • 40% OFF</text>

          <!-- Price Display -->
          <text x="0" y="105" font-family="Didot, 'Bodoni 72', serif" font-weight="bold" font-size="64" fill="${BRAND.purple}">Rs. 599</text>
          <text x="240" y="85" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="24" fill="#9CA3AF" text-decoration="line-through">Rs. 999</text>
          <text x="0" y="140" font-family="'Avenir Next', sans-serif" font-weight="600" font-size="18" fill="${BRAND.mutedText}">Complete 3-piece eco wheat-straw set</text>

          <!-- Features Checklist -->
          <g transform="translate(0, 185)">
            <circle cx="16" cy="16" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="22" font-family="'Avenir Next', sans-serif" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="42" y="23" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="19" fill="${BRAND.deepPlum}">3x Biodegradable Wheat-Straw Razors</text>

            <circle cx="16" cy="66" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="72" font-family="'Avenir Next', sans-serif" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="42" y="73" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="19" fill="${BRAND.deepPlum}">Precision Stainless Micro-Guard Blades</text>

            <circle cx="16" cy="116" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="122" font-family="'Avenir Next', sans-serif" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="42" y="123" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="19" fill="${BRAND.deepPlum}">Zero Cuts &amp; Safe For Sensitive Skin</text>

            <circle cx="16" cy="166" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="172" font-family="'Avenir Next', sans-serif" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="42" y="173" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="19" fill="${BRAND.deepPlum}">Protective Travel Caps Included</text>

            <circle cx="16" cy="216" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="222" font-family="'Avenir Next', sans-serif" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="42" y="223" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="19" fill="${BRAND.deepPlum}">Eco-Friendly Kraft Packaging Box</text>
          </g>

          <!-- Delivery Stamp -->
          <g transform="translate(0, 460)">
            <rect width="385" height="95" rx="18" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1.5"/>
            <text x="25" y="38" font-family="'Avenir Next', sans-serif" font-weight="800" font-size="18" fill="#14532D">🚚 CASH ON DELIVERY NATIONWIDE</text>
            <text x="25" y="68" font-family="'Avenir Next', sans-serif" font-weight="600" font-size="15" fill="#166534">Karachi, Lahore, Islamabad &amp; all cities 🇵🇰</text>
          </g>
        </g>

        <!-- Right Image Column (Section 1 asset) -->
        <g clip-path="url(#p10Clip)">
          <image href="${photoB64}" x="480" y="40" width="460" height="690" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="490" y="40" width="430" height="690" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <!-- Bottom Order Button -->
      <g transform="translate(60, 1080)" filter="url(#softShadow)">
        <rect width="960" height="190" rx="36" fill="url(#greenGrad)"/>
        <text x="480" y="70" font-family="'Avenir Next', sans-serif" font-weight="900" font-size="32" fill="${BRAND.white}" text-anchor="middle">DM @girli_esglow TO ORDER NOW ⚡</text>
        <text x="480" y="112" font-family="'Avenir Next', sans-serif" font-weight="700" font-size="22" fill="${BRAND.white}" text-anchor="middle">Only Rs. 599 • Pay when it arrives at your doorstep</text>
        <text x="480" y="148" font-family="'Avenir Next', sans-serif" font-weight="600" font-size="17" fill="rgba(255,255,255,0.9)" text-anchor="middle">Or tap the link in our bio for instant checkout</text>
      </g>
    </svg>
  `;

  return renderSvgToPng(svg, outputPath);
}

// Generate creative for a specific post
export function generateCreativeForPost(postId) {
  const idStr = String(postId);
  fs.mkdirSync(GENERATED_DIR, { recursive: true });

  switch (idStr) {
    case '1': return [renderPost1()];
    case '2': return [renderPost2()];
    case '3': return renderPost3();
    case '4': return [renderPost4()];
    case '5': return [renderPost5()];
    case '6': return [renderPost6()];
    case '7': return [renderPost7()];
    case '8': return renderPost8();
    case '9': return [renderPost9()];
    case '10': return [renderPost10()];
    default:
      throw new Error(`Unknown post ID: ${postId}`);
  }
}

// Generate all creatives
export function generateAllCreatives() {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  console.log('Generating Sayuri-grade editorial creatives for Girlies Glow...');

  const results = [];
  results.push(renderPost1());
  results.push(renderPost2());
  results.push(...renderPost3());
  results.push(renderPost4());
  results.push(renderPost5());
  results.push(renderPost6());
  results.push(renderPost7());
  results.push(...renderPost8());
  results.push(renderPost9());
  results.push(renderPost10());

  console.log(`✓ All 10 Sayuri-grade creatives generated in ${GENERATED_DIR}`);
  return results;
}

if (process.argv[1] && process.argv[1].endsWith('generate_creatives.js')) {
  generateAllCreatives();
}
