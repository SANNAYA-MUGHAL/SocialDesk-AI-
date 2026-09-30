import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// --- Luxury Skincare Brand System (Benchmarked against @sayuriofficialpk) ---
export const BRAND = {
  purple: '#683DA9',       // Primary Wordmark Purple
  deepPlum: '#1F1030',     // Deep Editorial Charcoal/Plum for Headlines
  lightOrchid: '#9B60E0',  // Lilac / Orchid Accent
  softLavender: '#F4EFFB', // Delicate Lavender Background
  warmCream: '#FAF7F2',    // Luxury Warm Skincare Cream Background
  white: '#FFFFFF',
  leafGreen: '#2E7D32',    // Rich Forest Green for COD / Eco Badges
  lightGreenBg: '#F0FDF4', // Light green pill background
  darkText: '#111827',     // Ultra-crisp high-contrast slate-900 body text
  charcoalText: '#1F2937', // High-contrast slate-800 for card text
  mutedText: '#4B5563',    // Readable slate-600 subtitle text
  borderLight: 'rgba(104, 61, 169, 0.12)',
  cardShadow: 'rgba(43, 18, 69, 0.08)'
};

export const FONT = {
  sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
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
        <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#2B1245" flood-opacity="0.08"/>
      </filter>
      <filter id="cardShadow" x="-10%" y="-10%" width="125%" height="130%">
        <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#2B1245" flood-opacity="0.06"/>
      </filter>
    </defs>
  `;
}

// Clean Editorial Category Badge (No tiny logo clutter at top)
function drawTopBadge(categoryText = 'DERMAPLANING 101', y = 52) {
  return `
    <g transform="translate(60, ${y})">
      <rect width="280" height="42" rx="21" fill="#FAF5FF" stroke="${BRAND.purple}" stroke-width="1.5"/>
      <text x="140" y="27" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.purple}" text-anchor="middle" letter-spacing="1.5">${escapeXml(categoryText)}</text>
    </g>
  `;
}

// Reel Category Badge
function drawTopBadgeReel(categoryText = 'HOW TO DERMAPLANE ✨', y = 70) {
  return `
    <g transform="translate(60, ${y})">
      <rect width="320" height="48" rx="24" fill="${BRAND.purple}"/>
      <text x="160" y="30" font-family="${FONT.sans}" font-weight="800" font-size="15" fill="${BRAND.white}" text-anchor="middle" letter-spacing="1.5">${escapeXml(categoryText)}</text>
    </g>
  `;
}

// High-Contrast Vector Badges for Myth vs Truth
function drawMythBadge(x = 25, y = 20) {
  return `
    <g transform="translate(${x}, ${y})">
      <rect width="170" height="38" rx="19" fill="#DC2626"/>
      <circle cx="24" cy="19" r="12" fill="#FFFFFF"/>
      <path d="M19 14 L29 24 M29 14 L19 24" stroke="#DC2626" stroke-width="3" stroke-linecap="round"/>
      <text x="100" y="25" font-family="${FONT.sans}" font-weight="900" font-size="14" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.2">THE MYTH</text>
    </g>
  `;
}

function drawTruthBadge(x = 25, y = 20) {
  return `
    <g transform="translate(${x}, ${y})">
      <rect width="180" height="38" rx="19" fill="#16A34A"/>
      <circle cx="24" cy="19" r="12" fill="#FFFFFF"/>
      <path d="M18 19 L22 23 L30 15" fill="none" stroke="#16A34A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="105" y="25" font-family="${FONT.sans}" font-weight="900" font-size="14" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.2">THE TRUTH</text>
    </g>
  `;
}

// Bottom Conversion & Pricing Bar (Rs. 599 + COD Across Pakistan)
function drawBottomPricingBar(y = 1225) {
  return `
    <g transform="translate(60, ${y})" filter="url(#softShadow)">
      <rect width="960" height="85" rx="24" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
      <text x="35" y="38" font-family="${FONT.sans}" font-weight="800" font-size="23" fill="${BRAND.deepPlum}">Girlies Glow At-Home Facial Razor</text>
      <text x="35" y="65" font-family="${FONT.sans}" font-weight="600" font-size="16" fill="${BRAND.mutedText}">Eco Wheat-Straw Handle (White) • Stainless Micro-Guard Blade</text>

      <g transform="translate(540, 15)">
        <rect width="385" height="55" rx="20" fill="url(#greenGrad)"/>
        <text x="192" y="35" font-family="${FONT.sans}" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle" letter-spacing="0.5">🚚 Rs. 599 • CASH ON DELIVERY</text>
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
  // Use authentic WHITE wheat-straw razor photography under running water
  const photoB64 = getAssetBase64('packaging section two.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p1Clip">
          <rect x="60" y="240" width="960" height="510" rx="28" ry="28"/>
        </clipPath>
      </defs>

      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('DERMAPLANING MYTHS', 52)}

      <!-- Bold, Ultra-Readable Modern Headline -->
      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Will Shaving Make Facial Hair</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Grow Back Thicker? ✨</text>

      <!-- Real Macro Studio Asset: White Wheat-Straw Razor -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p1Clip)">
          <image href="${photoB64}" x="60" y="170" width="960" height="660" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="510" rx="28" ry="28" fill="none" stroke="rgba(104, 61, 169, 0.15)" stroke-width="2"/>
      </g>

      <!-- Floating Badges on Photo -->
      <g transform="translate(90, 270)">
        <rect width="320" height="44" rx="22" fill="rgba(255, 255, 255, 0.96)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="160" y="28" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.purple}" text-anchor="middle">🌾 AUTHENTIC WHITE RAZOR</text>
      </g>

      <g transform="translate(680, 685)">
        <rect width="310" height="44" rx="22" fill="rgba(31, 16, 48, 0.88)"/>
        <text x="155" y="28" font-family="${FONT.sans}" font-weight="700" font-size="14" fill="#FFFFFF" text-anchor="middle">🛡️ Stainless Micro-Guard Safety</text>
      </g>

      <!-- Myth vs Fact Floating Card -->
      <g transform="translate(60, 775)" filter="url(#softShadow)">
        <rect width="960" height="425" rx="28" fill="#FFFFFF" stroke="${BRAND.borderLight}" stroke-width="2"/>

        <!-- Myth Box -->
        <g transform="translate(35, 25)">
          <rect width="890" height="170" rx="20" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1.5"/>
          ${drawMythBadge(25, 20)}
          <text x="25" y="95" font-family="${FONT.sans}" font-weight="800" font-size="23" fill="#991B1B">“Shaving causes hair to grow back thicker, darker &amp; coarser.”</text>
          <text x="25" y="132" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Dermatological fact: Follicle count, density, and genetics are 100% unaffected.</text>
        </g>

        <!-- Truth Box -->
        <g transform="translate(35, 215)">
          <rect width="890" height="185" rx="20" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1.5"/>
          ${drawTruthBadge(25, 20)}
          <text x="25" y="95" font-family="${FONT.sans}" font-weight="800" font-size="23" fill="#14532D">“Peach fuzz grows back with the exact same soft, fine tip.”</text>
          <text x="25" y="128" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Dermaplaning only sweeps away surface fuzz and dull dead skin cells safely.</text>
          <text x="25" y="158" font-family="${FONT.sans}" font-weight="800" font-size="18" fill="#15803D">✨ Result: Instant glowing glass skin and seamless, cake-free foundation!</text>
        </g>
      </g>

      ${drawBottomPricingBar(1225)}
    </svg>
  `;

  return renderSvgToPng(svg, outputPath);
}

// Post 2: Product in Action (Reel 9:16, 1080x1920)
export function renderPost2(
  coverPngPath = path.join(GENERATED_DIR, 'post_2_reel.png'),
  reelMp4Path = path.join(GENERATED_DIR, 'post_2_reel.mp4')
) {
  // Use authentic WHITE wheat-straw razor held at marble vanity
  const photoB64 = getAssetBase64('packaging section two.png');

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
      ${drawTopBadgeReel('HOW TO DERMAPLANE ✨', 70)}

      <!-- Headline -->
      <text x="60" y="200" font-family="${FONT.sans}" font-weight="900" font-size="50" fill="${BRAND.deepPlum}">The Secret to Flawless,</text>
      <text x="60" y="265" font-family="${FONT.sans}" font-weight="900" font-size="50" fill="${BRAND.purple}">Butter-Smooth Glass Skin 🌸</text>

      <!-- Real Macro Studio Asset: White Wheat-Straw Razor -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p2Clip)">
          <image href="${photoB64}" x="60" y="250" width="960" height="1000" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="320" width="960" height="880" rx="36" ry="36" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <!-- Floating Badges on Photo -->
      <g transform="translate(90, 360)">
        <rect width="320" height="48" rx="24" fill="rgba(255, 255, 255, 0.95)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="160" y="30" font-family="${FONT.sans}" font-weight="800" font-size="16" fill="${BRAND.purple}" text-anchor="middle">🌾 AUTHENTIC WHITE RAZOR</text>
      </g>

      <g transform="translate(90, 1130)">
        <rect width="330" height="44" rx="22" fill="rgba(31, 16, 48, 0.88)"/>
        <text x="165" y="28" font-family="${FONT.sans}" font-weight="700" font-size="15" fill="${BRAND.white}" text-anchor="middle">🛡️ Stainless Micro-Guard Safety Edge</text>
      </g>

      <!-- 3 Step Highlights -->
      <g transform="translate(60, 1230)" filter="url(#softShadow)">
        <rect width="960" height="420" rx="32" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>

        <!-- Step 1 -->
        <g transform="translate(40, 35)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="${FONT.sans}" font-weight="900" font-size="20" fill="${BRAND.purple}" text-anchor="middle">01</text>
          <text x="75" y="26" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">Cleanse &amp; Prep Skin</text>
          <text x="75" y="55" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Wash face thoroughly. Shave on clean dry skin or with 2 drops of facial oil.</text>
        </g>

        <!-- Step 2 -->
        <g transform="translate(40, 135)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="${FONT.sans}" font-weight="900" font-size="20" fill="${BRAND.purple}" text-anchor="middle">02</text>
          <text x="75" y="26" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">Hold at 45° Angle</text>
          <text x="75" y="55" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Pull skin taut with your free hand. Glide with light, short downward strokes.</text>
        </g>

        <!-- Step 3 -->
        <g transform="translate(40, 235)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="${FONT.sans}" font-weight="900" font-size="20" fill="${BRAND.purple}" text-anchor="middle">03</text>
          <text x="75" y="26" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">Hydrate &amp; Protect</text>
          <text x="75" y="55" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Apply your favorite barrier cream or hydrating serum for glowing glass skin.</text>
        </g>

        <rect x="40" y="325" width="880" height="65" rx="18" fill="${BRAND.softLavender}"/>
        <text x="480" y="365" font-family="${FONT.sans}" font-weight="800" font-size="19" fill="${BRAND.purple}" text-anchor="middle">🌾 Eco Wheat-Straw Handle • Beginner Friendly • Zero Cuts</text>
      </g>

      <!-- Bottom Order Pill -->
      <g transform="translate(60, 1680)" filter="url(#softShadow)">
        <rect width="960" height="150" rx="36" fill="url(#greenGrad)"/>
        <text x="480" y="65" font-family="${FONT.sans}" font-weight="900" font-size="30" fill="${BRAND.white}" text-anchor="middle">Rs. 599 • CASH ON DELIVERY NATIONWIDE</text>
        <text x="480" y="105" font-family="${FONT.sans}" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">DM @girli_esglow or tap link in bio to order now</text>
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
  const cakeyB64 = getAssetBase64('card7.png');
  const drySkinB64 = getAssetBase64('car5.png');
  // Use authentic WHITE razor head macro
  const razorActionB64 = getAssetBase64('packaging section three.png');
  const flatlayB64 = getAssetBase64('Section 1.png');

  // Slide 1: Hook (Why your foundation looks cakey)
  const svg1 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p3s1Clip"><rect x="60" y="240" width="960" height="690" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('BEAUTY SECRETS 💄', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Why Does Your Foundation</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Look Cakey &amp; Textured? 👀</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p3s1Clip)">
          <image href="${cakeyB64}" x="60" y="180" width="960" height="800" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="690" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 275)">
        <rect width="320" height="44" rx="22" fill="rgba(255, 255, 255, 0.94)" stroke="rgba(225, 29, 72, 0.3)" stroke-width="1.5"/>
        <text x="160" y="28" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="#E11D48" text-anchor="middle">⚠️ CAKEY FOUNDATION CLINGING</text>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="${FONT.sans}" font-weight="800" font-size="26" fill="${BRAND.deepPlum}">It’s Not Your Skincare — It’s Peach Fuzz!</text>
        <text x="40" y="95" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Microscopic facial hair and dead skin trap liquid pigment and powder,</text>
        <text x="40" y="125" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">causing your base to look patchy and separate throughout the day.</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="${BRAND.softLavender}"/>
          <text x="440" y="33" font-family="${FONT.sans}" font-weight="800" font-size="17" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO SEE HOW DERMAPLANING FIXES THIS 👉</text>
        </g>
      </g>

      ${drawBottomPricingBar(1225)}
    </svg>
  `;

  // Slide 2: The Root Cause (Dead skin & hair)
  const svg2 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p3s2Clip"><rect x="60" y="240" width="960" height="690" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('THE ROOT CAUSE 🔍', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">The Hidden Barrier Between</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">You and Flawless Skin 🔬</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p3s2Clip)">
          <image href="${drySkinB64}" x="60" y="180" width="960" height="800" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="690" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 275)">
        <rect width="320" height="44" rx="22" fill="rgba(255, 255, 255, 0.94)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="160" y="28" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.purple}" text-anchor="middle">🔍 MICROSCOPIC DRY TEXTURE</text>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="${FONT.sans}" font-weight="800" font-size="26" fill="${BRAND.deepPlum}">Why Standard Exfoliation Falls Short</text>
        <text x="40" y="95" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Scrubs only aggravate skin, and toners cannot remove physical vellus hair.</text>
        <text x="40" y="125" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Dermaplaning physically clears dead cellular debris and peach fuzz in minutes.</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="${BRAND.softLavender}"/>
          <text x="440" y="33" font-family="${FONT.sans}" font-weight="800" font-size="17" fill="${BRAND.purple}" text-anchor="middle">SWIPE FOR THE 5-MINUTE FIX 👉</text>
        </g>
      </g>

      ${drawBottomPricingBar(1225)}
    </svg>
  `;

  // Slide 3: The Solution (Authentic White Razor Head Macro)
  const svg3 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p3s3Clip"><rect x="60" y="240" width="960" height="690" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('THE SOLUTION ✨', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Dermaplane First.</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Melt Foundation Later. 🌸</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p3s3Clip)">
          <image href="${razorActionB64}" x="60" y="200" width="960" height="780" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="690" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 275)">
        <rect width="320" height="44" rx="22" fill="rgba(255, 255, 255, 0.94)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="160" y="28" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.purple}" text-anchor="middle">🌾 WHITE MICRO-GUARD RAZOR</text>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="${FONT.sans}" font-weight="800" font-size="26" fill="${BRAND.deepPlum}">Baby Soft, Reflective Canvas</text>
        <text x="40" y="95" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Light strokes glide smoothly over the skin surface with our micro-guard.</text>
        <text x="40" y="125" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Zero pain, zero cuts. Makeup applies like melted butter.</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="${BRAND.softLavender}"/>
          <text x="440" y="33" font-family="${FONT.sans}" font-weight="800" font-size="17" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO MEET YOUR NEW BEAUTY BESTIE 👉</text>
        </g>
      </g>

      ${drawBottomPricingBar(1225)}
    </svg>
  `;

  // Slide 4: The Result & Offer (Travertine flatlay + Rs. 599 COD)
  const svg4 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p3s4Clip"><rect x="60" y="240" width="960" height="690" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('GLOW AT HOME 🇵🇰', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Meet The Girlies Glow</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Wheat-Straw Facial Razor (White) ✨</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p3s4Clip)">
          <image href="${flatlayB64}" x="60" y="220" width="960" height="740" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="690" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 275)">
        <rect width="330" height="44" rx="22" fill="rgba(255, 255, 255, 0.94)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="165" y="28" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.purple}" text-anchor="middle">🌾 BIODEGRADABLE WHEAT STRAW</text>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="${FONT.sans}" font-weight="800" font-size="26" fill="${BRAND.deepPlum}">Your Base Just Found Its Match 💜</text>
        <text x="40" y="95" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">3x Eco-friendly wheat straw razors (White) with precision micro-guards.</text>
        <text x="40" y="125" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Safe for sensitive skin. Lasts months. Cash on Delivery nationwide.</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="url(#greenGrad)"/>
          <text x="440" y="33" font-family="${FONT.sans}" font-weight="900" font-size="19" fill="${BRAND.white}" text-anchor="middle">ORDER NOW FOR Rs. 599 • CASH ON DELIVERY 🇵🇰</text>
        </g>
      </g>

      ${drawBottomPricingBar(1225)}
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
  const photoB64 = getAssetBase64('Section 1.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p4PhotoClip"><rect x="60" y="900" width="960" height="290" rx="24" ry="24"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('SMART BEAUTY • COMPARISON', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Parlour Jaane Ka Mood Nahi?</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Glow Ghar Par 💅</text>

      <!-- Side-by-Side Comparison Grid -->
      <g transform="translate(60, 260)" filter="url(#softShadow)">
        <!-- Parlour Column -->
        <g transform="translate(0, 0)">
          <rect width="465" height="610" rx="28" fill="${BRAND.white}" stroke="#FEE2E2" stroke-width="2"/>
          <rect x="35" y="30" width="230" height="42" rx="21" fill="#FEE2E2"/>
          <text x="150" y="57" font-family="${FONT.sans}" font-weight="900" font-size="14" fill="#DC2626" text-anchor="middle">SALON WAXING / THREADING</text>

          <text x="35" y="120" font-family="${FONT.sans}" font-weight="900" font-size="32" fill="#991B1B">Rs. 1,500 – 2,500</text>
          <text x="35" y="150" font-family="${FONT.sans}" font-weight="600" font-size="16" fill="#B91C1C">Every single parlour appointment</text>

          <g transform="translate(35, 190)">
            <text x="0" y="30" font-family="${FONT.sans}" font-weight="700" font-size="18" fill="#7F1D1D">✕ 1-2 hours lost in traffic &amp; waiting</text>
            <text x="0" y="80" font-family="${FONT.sans}" font-weight="700" font-size="18" fill="#7F1D1D">✕ Painful hair pulling &amp; skin stretching</text>
            <text x="0" y="130" font-family="${FONT.sans}" font-weight="700" font-size="18" fill="#7F1D1D">✕ Post-waxing redness &amp; breakout risk</text>
            <text x="0" y="180" font-family="${FONT.sans}" font-weight="700" font-size="18" fill="#7F1D1D">✕ High recurring monthly expense</text>
          </g>

          <rect x="35" y="490" width="395" height="80" rx="18" fill="#FEF2F2"/>
          <text x="232" y="530" font-family="${FONT.sans}" font-weight="800" font-size="16" fill="#991B1B" text-anchor="middle">Over Rs. 24,000/year spent</text>
          <text x="232" y="555" font-family="${FONT.sans}" font-weight="600" font-size="14" fill="#B91C1C" text-anchor="middle">on routine salon visits</text>
        </g>

        <!-- Girlies Glow Column -->
        <g transform="translate(495, 0)">
          <rect width="465" height="610" rx="28" fill="${BRAND.white}" stroke="#BBF7D0" stroke-width="2"/>
          <rect x="35" y="30" width="180" height="42" rx="21" fill="#DCFCE7"/>
          <text x="125" y="57" font-family="${FONT.sans}" font-weight="900" font-size="14" fill="#15803D" text-anchor="middle">GIRLIES GLOW ✨</text>

          <text x="35" y="120" font-family="${FONT.sans}" font-weight="900" font-size="32" fill="#166534">Rs. 599 ONLY</text>
          <text x="35" y="150" font-family="${FONT.sans}" font-weight="600" font-size="16" fill="#15803D">Complete set • Reusable for months</text>

          <g transform="translate(35, 190)">
            <text x="0" y="30" font-family="${FONT.sans}" font-weight="700" font-size="18" fill="#14532D">✓ 5 minutes in your own bedroom</text>
            <text x="0" y="80" font-family="${FONT.sans}" font-weight="700" font-size="18" fill="#14532D">✓ 100% Painless micro-guard blade</text>
            <text x="0" y="130" font-family="${FONT.sans}" font-weight="700" font-size="18" fill="#14532D">✓ Instant glass skin &amp; smooth base</text>
            <text x="0" y="180" font-family="${FONT.sans}" font-weight="700" font-size="18" fill="#14532D">✓ Biodegradable eco wheat-straw (White)</text>
          </g>

          <rect x="35" y="490" width="395" height="80" rx="18" fill="url(#greenGrad)"/>
          <text x="232" y="530" font-family="${FONT.sans}" font-weight="900" font-size="18" fill="${BRAND.white}" text-anchor="middle">SAVE OVER Rs. 20,000</text>
          <text x="232" y="555" font-family="${FONT.sans}" font-weight="700" font-size="14" fill="${BRAND.white}" text-anchor="middle">Same salon results from home</text>
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
          <text x="140" y="27" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.purple}" text-anchor="middle">🌾 WHEAT-STRAW PACK OF 3</text>
        </g>
      </g>

      ${drawBottomPricingBar(1225)}
    </svg>
  `;

  return renderSvgToPng(svg, outputPath);
}

// Post 5: Relatable UGC Testimonial (Reel 9:16, 1080x1920)
export function renderPost5(
  coverPngPath = path.join(GENERATED_DIR, 'post_5_reel.png'),
  reelMp4Path = path.join(GENERATED_DIR, 'post_5_reel.mp4')
) {
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
      ${drawTopBadgeReel('REAL CUSTOMER REVIEW ⭐', 70)}

      <!-- Headline -->
      <text x="60" y="200" font-family="${FONT.sans}" font-weight="900" font-size="48" fill="${BRAND.deepPlum}">“I was terrified to shave my face</text>
      <text x="60" y="265" font-family="${FONT.sans}" font-weight="900" font-size="48" fill="${BRAND.purple}">until I tried Girlies Glow!” 💜</text>

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
        <text x="140" y="30" font-family="${FONT.sans}" font-weight="800" font-size="16" fill="${BRAND.purple}" text-anchor="middle">🌸 10,000+ HAPPY GIRLS</text>
      </g>

      <!-- Luxury Testimonial Card -->
      <g transform="translate(60, 1230)" filter="url(#softShadow)">
        <rect width="960" height="420" rx="32" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>

        <!-- Gold Stars & Verified Badge -->
        <g transform="translate(50, 45)">
          ${drawGoldStars(20, 20, 30, 40)}
          <rect x="235" y="2" width="180" height="38" rx="19" fill="#ECFDF5"/>
          <text x="325" y="26" font-family="${FONT.sans}" font-weight="800" font-size="15" fill="#047857" text-anchor="middle">VERIFIED BUYER ✓</text>
        </g>

        <!-- Quote -->
        <g transform="translate(50, 115)">
          <text x="0" y="35" font-family="${FONT.sans}" font-weight="800" font-size="26" fill="${BRAND.deepPlum}">“Honestly, my parlour lady always said baal motay ho jayenge.”</text>
          <text x="0" y="80" font-family="${FONT.sans}" font-weight="600" font-size="20" fill="${BRAND.charcoalText}">“Finally ordered Girlies Glow for Rs. 599. My foundation has</text>
          <text x="0" y="115" font-family="${FONT.sans}" font-weight="800" font-size="20" fill="${BRAND.purple}">NEVER looked this smooth! Zero cuts, zero redness. Best at-home decision!”</text>
        </g>

        <!-- Customer Signature -->
        <g transform="translate(50, 290)">
          <circle cx="30" cy="30" r="30" fill="${BRAND.softLavender}"/>
          <text x="30" y="39" font-family="${FONT.sans}" font-weight="800" font-size="22" fill="${BRAND.purple}" text-anchor="middle">A</text>
          <text x="75" y="28" font-family="${FONT.sans}" font-weight="800" font-size="22" fill="${BRAND.deepPlum}">Ayesha K. — Lahore</text>
          <text x="75" y="52" font-family="${FONT.sans}" font-weight="600" font-size="16" fill="${BRAND.mutedText}">Cash on Delivery order • 5-Star Experience</text>
        </g>
      </g>

      <!-- Bottom Order Pill -->
      <g transform="translate(60, 1680)" filter="url(#softShadow)">
        <rect width="960" height="150" rx="36" fill="url(#greenGrad)"/>
        <text x="480" y="65" font-family="${FONT.sans}" font-weight="900" font-size="30" fill="${BRAND.white}" text-anchor="middle">Rs. 599 • CASH ON DELIVERY NATIONWIDE</text>
        <text x="480" y="105" font-family="${FONT.sans}" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">Order via DM @girli_esglow or link in bio</text>
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
  // Use authentic WHITE wheat-straw razor flatlay with dried lavender
  const photoB64 = getAssetBase64('Single.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p6Clip"><rect x="60" y="240" width="960" height="510" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('ECO-LUXURY BEAUTY 🌿', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Small Razor. Big Glow Energy ✨</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Designed Specifically For Female Skin</text>

      <!-- Real Studio Flatlay Asset -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p6Clip)">
          <image href="${photoB64}" x="60" y="170" width="960" height="660" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="510" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 275)">
        <rect width="320" height="44" rx="22" fill="rgba(255, 255, 255, 0.94)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="160" y="28" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.purple}" text-anchor="middle">🌾 AUTHENTIC WHITE RAZOR</text>
      </g>

      <!-- 4 Core Benefits Grid -->
      <g transform="translate(60, 775)" filter="url(#softShadow)">
        <rect width="960" height="425" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>

        <!-- Benefit 1 -->
        <g transform="translate(40, 35)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="${FONT.sans}" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">🌾</text>
          <text x="75" y="26" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">Biodegradable Wheat Straw (White)</text>
          <text x="75" y="52" font-family="${FONT.sans}" font-weight="600" font-size="17" fill="${BRAND.charcoalText}">Sustainable cream/white body with organic beige speckles. Zero cheap plastic.</text>
        </g>

        <!-- Benefit 2 -->
        <g transform="translate(40, 128)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="${FONT.sans}" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">🛡️</text>
          <text x="75" y="26" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">Micro-Guard Safety Blade</text>
          <text x="75" y="52" font-family="${FONT.sans}" font-weight="600" font-size="17" fill="${BRAND.charcoalText}">Stainless-steel protective ribs ensure 100% painless glide with zero nicks.</text>
        </g>

        <!-- Benefit 3 -->
        <g transform="translate(40, 221)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="${FONT.sans}" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">✨</text>
          <text x="75" y="26" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">Instant 2-in-1 Exfoliation</text>
          <text x="75" y="52" font-family="${FONT.sans}" font-weight="600" font-size="17" fill="${BRAND.charcoalText}">Removes dulling peach fuzz and sweeps away dry dead skin cells in minutes.</text>
        </g>

        <!-- Benefit 4 -->
        <g transform="translate(40, 314)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="${FONT.sans}" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">💧</text>
          <text x="75" y="26" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">3x Skincare Absorption</text>
          <text x="75" y="52" font-family="${FONT.sans}" font-weight="600" font-size="17" fill="${BRAND.charcoalText}">Serums, hyaluronic acid, and creams penetrate deeply for true glass skin.</text>
        </g>
      </g>

      ${drawBottomPricingBar(1225)}
    </svg>
  `;

  return renderSvgToPng(svg, outputPath);
}

// Post 7: GRWM Transformation (Reel 9:16, 1080x1920)
export function renderPost7(
  coverPngPath = path.join(GENERATED_DIR, 'post_7_reel.png'),
  reelMp4Path = path.join(GENERATED_DIR, 'post_7_reel.mp4')
) {
  // Use authentic WHITE razor at vanity
  const photoB64 = getAssetBase64('packaging section two.png');

  const refGif = path.join(ROOT_DIR, 'WhatsApp GIF 2026-09-11 at 00.01.24.gif');
  if (fs.existsSync(refGif)) fs.copyFileSync(refGif, reelMp4Path);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p7Clip"><rect x="60" y="320" width="960" height="880" rx="36" ry="36"/></clipPath>
      </defs>
      <rect width="1080" height="1920" fill="url(#bgWarmGrad)"/>
      ${drawTopBadgeReel('SUNDAY NIGHT RESET 🧖‍♀️', 70)}

      <!-- Headline -->
      <text x="60" y="200" font-family="${FONT.sans}" font-weight="900" font-size="50" fill="${BRAND.deepPlum}">GRWM But First…</text>
      <text x="60" y="265" font-family="${FONT.sans}" font-weight="900" font-size="50" fill="${BRAND.purple}">Peach Fuzz Has To Go! ✨</text>

      <!-- Real Macro Studio Asset: White Wheat-Straw Razor -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p7Clip)">
          <image href="${photoB64}" x="60" y="240" width="960" height="1000" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="320" width="960" height="880" rx="36" ry="36" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <!-- Floating Badge on Photo -->
      <g transform="translate(90, 360)">
        <rect width="310" height="48" rx="24" fill="rgba(255, 255, 255, 0.95)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="155" y="30" font-family="${FONT.sans}" font-weight="800" font-size="16" fill="${BRAND.purple}" text-anchor="middle">🌸 STEP 0 IN EVERY MAKEUP PREP</text>
      </g>

      <!-- 3-Step Glass Skin Guide -->
      <g transform="translate(60, 1230)" filter="url(#softShadow)">
        <rect width="960" height="420" rx="32" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>

        <!-- Routine Step 1 -->
        <g transform="translate(40, 35)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="${FONT.sans}" font-weight="900" font-size="20" fill="${BRAND.purple}" text-anchor="middle">01</text>
          <text x="75" y="26" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">Wash &amp; Apply Facial Oil</text>
          <text x="75" y="55" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">2 drops of squalane or aloe gel give the razor effortless glide.</text>
        </g>

        <!-- Routine Step 2 -->
        <g transform="translate(40, 135)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="${FONT.sans}" font-weight="900" font-size="20" fill="${BRAND.purple}" text-anchor="middle">02</text>
          <text x="75" y="26" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">Girlies Glow At 45° Angle</text>
          <text x="75" y="55" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Pull skin taut, use light downward strokes. Watch peach fuzz melt away.</text>
        </g>

        <!-- Routine Step 3 -->
        <g transform="translate(40, 235)">
          <circle cx="28" cy="28" r="28" fill="${BRAND.softLavender}"/>
          <text x="28" y="36" font-family="${FONT.sans}" font-weight="900" font-size="20" fill="${BRAND.purple}" text-anchor="middle">03</text>
          <text x="75" y="26" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">Barrier Cream &amp; Sleep</text>
          <text x="75" y="55" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Hydrate deeply. Wake up with ultra-soft, reflective glass skin!</text>
        </g>

        <rect x="40" y="325" width="880" height="65" rx="18" fill="${BRAND.softLavender}"/>
        <text x="480" y="365" font-family="${FONT.sans}" font-weight="800" font-size="19" fill="${BRAND.purple}" text-anchor="middle">💄 Next Morning: Foundation Glides On Seamlessly Like A Filter</text>
      </g>

      <!-- Bottom Order Pill -->
      <g transform="translate(60, 1680)" filter="url(#softShadow)">
        <rect width="960" height="150" rx="36" fill="url(#greenGrad)"/>
        <text x="480" y="65" font-family="${FONT.sans}" font-weight="900" font-size="30" fill="${BRAND.white}" text-anchor="middle">Rs. 599 • CASH ON DELIVERY NATIONWIDE</text>
        <text x="480" y="105" font-family="${FONT.sans}" font-weight="700" font-size="20" fill="${BRAND.white}" text-anchor="middle">Tap link in bio or DM @girli_esglow to get yours</text>
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
  const mirrorB64 = getAssetBase64('Card 4.png');
  const cleanSkinB64 = getAssetBase64('Card 6.png');
  // Use authentic WHITE razor head macro
  const bladeMacroB64 = getAssetBase64('packaging section three.png');
  // Use authentic hand holding WHITE razor
  const razorHandB64 = getAssetBase64('packaging section two.png');
  const hydrateB64 = getAssetBase64('Section 1.png');

  // Slide 1: Cover
  const svg1 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs><clipPath id="p8s1Clip"><rect x="60" y="240" width="960" height="690" rx="28" ry="28"/></clipPath></defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('DERMAPLANING 101', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">New to Facial Shaving?</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Save This Beginner Guide 💜</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p8s1Clip)">
          <image href="${mirrorB64}" x="60" y="200" width="960" height="780" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="690" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="${FONT.sans}" font-weight="800" font-size="26" fill="${BRAND.deepPlum}">4 Simple Steps To Glow At Home</text>
        <text x="40" y="95" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">No pain, no cuts, no stubble. Dermaplaning is the gentlest way</text>
        <text x="40" y="125" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">to exfoliate dead skin and remove peach fuzz for radiant skin.</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="${BRAND.softLavender}"/>
          <text x="440" y="33" font-family="${FONT.sans}" font-weight="800" font-size="17" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO START STEP 1 👉</text>
        </g>
      </g>
      ${drawBottomPricingBar(1225)}
    </svg>
  `;

  // Slide 2: Step 1 (Cleanse)
  const svg2 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs><clipPath id="p8s2Clip"><rect x="60" y="240" width="960" height="690" rx="28" ry="28"/></clipPath></defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('STEP 01 • PREPARATION', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Step 1: Cleanse Thoroughly</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Never Shave Over Makeup or Dirt 🧴</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p8s2Clip)">
          <image href="${cleanSkinB64}" x="60" y="200" width="960" height="780" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="690" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="${FONT.sans}" font-weight="800" font-size="26" fill="${BRAND.deepPlum}">Clean Canvas Is Essential</text>
        <text x="40" y="95" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Wash with a gentle cleanser. Pat completely dry with a clean towel.</text>
        <text x="40" y="125" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Beginners can apply 2 drops of squalane oil for extra smooth blade glide.</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="${BRAND.softLavender}"/>
          <text x="440" y="33" font-family="${FONT.sans}" font-weight="800" font-size="17" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO STEP 2 (THE ANGLE) 👉</text>
        </g>
      </g>
      ${drawBottomPricingBar(1225)}
    </svg>
  `;

  // Slide 3: Step 2 (Taut Skin at 45° with White Razor Micro-Guard Macro)
  const svg3 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs><clipPath id="p8s3Clip"><rect x="60" y="240" width="960" height="690" rx="28" ry="28"/></clipPath></defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('STEP 02 • THE TECHNIQUE', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Step 2: Hold Skin Taut</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Maintain a Precise 45° Angle 📐</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p8s3Clip)">
          <image href="${bladeMacroB64}" x="60" y="200" width="960" height="780" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="690" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 275)">
        <rect width="320" height="44" rx="22" fill="rgba(255, 255, 255, 0.94)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="160" y="28" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.purple}" text-anchor="middle">🛡️ STAINLESS MICRO-GUARD</text>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="${FONT.sans}" font-weight="800" font-size="26" fill="${BRAND.deepPlum}">The Golden Rule of Dermaplaning</text>
        <text x="40" y="95" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Use fingers from your free hand to gently pull your cheek taut.</text>
        <text x="40" y="125" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Angle the Girlies Glow razor at 45° so the micro-guard protects your skin.</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="${BRAND.softLavender}"/>
          <text x="440" y="33" font-family="${FONT.sans}" font-weight="800" font-size="17" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO STEP 3 (THE STROKES) 👉</text>
        </g>
      </g>
      ${drawBottomPricingBar(1225)}
    </svg>
  `;

  // Slide 4: Step 3 (Feather-Light Strokes with White Razor In Hand)
  const svg4 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs><clipPath id="p8s4Clip"><rect x="60" y="240" width="960" height="690" rx="28" ry="28"/></clipPath></defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('STEP 03 • THE GLIDE', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Step 3: Light Downward Strokes</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Never Press Hard • Let The Blade Work ✨</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p8s4Clip)">
          <image href="${razorHandB64}" x="60" y="200" width="960" height="780" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="690" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 275)">
        <rect width="320" height="44" rx="22" fill="rgba(255, 255, 255, 0.94)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="160" y="28" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.purple}" text-anchor="middle">🌾 AUTHENTIC WHITE RAZOR</text>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="${FONT.sans}" font-weight="800" font-size="26" fill="${BRAND.deepPlum}">Gentle, Short Feather Strokes</text>
        <text x="40" y="95" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Move in short downward strokes following hair growth. Wipe blade periodically.</text>
        <text x="40" y="125" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Watch peach fuzz and dull dead skin cells cleanly sweep away!</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="${BRAND.softLavender}"/>
          <text x="440" y="33" font-family="${FONT.sans}" font-weight="800" font-size="17" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO STEP 4 (AFTERCARE) 👉</text>
        </g>
      </g>
      ${drawBottomPricingBar(1225)}
    </svg>
  `;

  // Slide 5: Step 4 & CTA (Hydrate & Order)
  const svg5 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs><clipPath id="p8s5Clip"><rect x="60" y="240" width="960" height="690" rx="28" ry="28"/></clipPath></defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('STEP 04 • AFTERCARE &amp; GLOW', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Step 4: Hydrate &amp; Protect</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Lock In Moisture For Glass Skin 💧</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p8s5Clip)">
          <image href="${hydrateB64}" x="60" y="200" width="960" height="780" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="690" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(60, 960)" filter="url(#softShadow)">
        <rect width="960" height="235" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="55" font-family="${FONT.sans}" font-weight="800" font-size="26" fill="${BRAND.deepPlum}">Skip Active Acids For 24 Hours</text>
        <text x="40" y="95" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Apply your favorite ceramide cream or hyaluronic serum.</text>
        <text x="40" y="125" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">Wipe razor with alcohol, snap the cap on, and store safely!</text>
        
        <g transform="translate(40, 155)">
          <rect width="880" height="52" rx="16" fill="url(#greenGrad)"/>
          <text x="440" y="33" font-family="${FONT.sans}" font-weight="900" font-size="19" fill="${BRAND.white}" text-anchor="middle">ORDER YOUR SET FOR Rs. 599 • CASH ON DELIVERY 🇵🇰</text>
        </g>
      </g>
      ${drawBottomPricingBar(1225)}
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
  // Use authentic side-by-side Before/After cheek asset
  const photoB64 = getAssetBase64('card 3.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p9Clip"><rect x="60" y="240" width="960" height="610" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('REAL RESULTS • UNFILTERED', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Before vs. After: Real Results</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">What Dermaplaning Truly Does ✨</text>

      <!-- Real Before & After Studio Asset (card 3) -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p9Clip)">
          <image href="${photoB64}" x="60" y="200" width="960" height="700" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="610" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
        
        <!-- Center Divider Line -->
        <line x1="540" y1="240" x2="540" y2="850" stroke="#FFFFFF" stroke-width="3" opacity="0.8"/>
      </g>

      <!-- Floating Labels on Before & After -->
      <g transform="translate(90, 275)">
        <rect width="210" height="42" rx="21" fill="rgba(31, 16, 48, 0.88)"/>
        <text x="105" y="27" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.white}" text-anchor="middle">BEFORE: PEACH FUZZ</text>
      </g>

      <g transform="translate(570, 275)">
        <rect width="220" height="42" rx="21" fill="rgba(46, 125, 50, 0.92)"/>
        <text x="110" y="27" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.white}" text-anchor="middle">AFTER: GLASS SKIN ✨</text>
      </g>

      <!-- Review Card -->
      <g transform="translate(60, 875)" filter="url(#softShadow)">
        <rect width="960" height="325" rx="28" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>

        <g transform="translate(45, 35)">
          ${drawGoldStars(20, 20, 28, 38)}
          <rect x="230" y="2" width="180" height="38" rx="19" fill="#ECFDF5"/>
          <text x="320" y="26" font-family="${FONT.sans}" font-weight="800" font-size="15" fill="#047857" text-anchor="middle">VERIFIED BUYER ✓</text>
        </g>

        <g transform="translate(45, 95)">
          <text x="0" y="32" font-family="${FONT.sans}" font-weight="800" font-size="26" fill="${BRAND.deepPlum}">“No filter, no editing. My makeup glides on like silk now!”</text>
          <text x="0" y="72" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">“I was terrified to shave my face because of the old myth. But Girlies Glow has</text>
          <text x="0" y="104" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.charcoalText}">completely transformed my skin texture. Best Rs. 599 I ever spent!”</text>
        </g>

        <!-- Customer Signature -->
        <g transform="translate(45, 240)">
          <circle cx="25" cy="25" r="25" fill="${BRAND.softLavender}"/>
          <text x="25" y="33" font-family="${FONT.sans}" font-weight="800" font-size="18" fill="${BRAND.purple}" text-anchor="middle">M</text>
          <text x="65" y="24" font-family="${FONT.sans}" font-weight="800" font-size="20" fill="${BRAND.deepPlum}">Mahnoor R. — Karachi</text>
          <text x="65" y="46" font-family="${FONT.sans}" font-weight="600" font-size="15" fill="${BRAND.mutedText}">Verified Customer • Cash on Delivery</text>
        </g>
      </g>

      ${drawBottomPricingBar(1225)}
    </svg>
  `;

  return renderSvgToPng(svg, outputPath);
}

// Post 10: Special Launch Offer (Static 4:5, 1080x1350)
export function renderPost10(outputPath = path.join(GENERATED_DIR, 'post_10_offer.png')) {
  // Use authentic WHITE razors with kraft packaging on travertine
  const photoB64 = getAssetBase64('Section 1.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p10Clip"><rect x="490" y="40" width="430" height="690" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('EXCLUSIVE LAUNCH OFFER ⚡', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Unlock Radiant Glass Skin At Home</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Girlies Glow At-Home Dermaplaning Pack 🌸</text>

      <!-- Center Offer Container -->
      <g transform="translate(60, 260)" filter="url(#softShadow)">
        <rect width="960" height="785" rx="32" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="2"/>

        <!-- Left Details Column -->
        <g transform="translate(45, 40)">
          <!-- Promo Pill -->
          <rect width="210" height="38" rx="19" fill="#FEE2E2"/>
          <text x="105" y="24" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="#DC2626" text-anchor="middle">LAUNCH OFFER • 40% OFF</text>

          <!-- Price Display -->
          <text x="0" y="105" font-family="${FONT.sans}" font-weight="900" font-size="64" fill="${BRAND.purple}">Rs. 599</text>
          <text x="240" y="85" font-family="${FONT.sans}" font-weight="700" font-size="24" fill="#9CA3AF" text-decoration="line-through">Rs. 999</text>
          <text x="0" y="140" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.mutedText}">Complete 3-piece eco wheat-straw set (White)</text>

          <!-- Features Checklist -->
          <g transform="translate(0, 185)">
            <circle cx="16" cy="16" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="22" font-family="${FONT.sans}" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="42" y="23" font-family="${FONT.sans}" font-weight="700" font-size="19" fill="${BRAND.deepPlum}">3x Biodegradable Wheat-Straw Razors (White)</text>

            <circle cx="16" cy="66" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="72" font-family="${FONT.sans}" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="42" y="73" font-family="${FONT.sans}" font-weight="700" font-size="19" fill="${BRAND.deepPlum}">Precision Stainless Micro-Guard Blades</text>

            <circle cx="16" cy="116" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="122" font-family="${FONT.sans}" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="42" y="123" font-family="${FONT.sans}" font-weight="700" font-size="19" fill="${BRAND.deepPlum}">Zero Cuts &amp; Safe For Sensitive Skin</text>

            <circle cx="16" cy="166" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="172" font-family="${FONT.sans}" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="42" y="173" font-family="${FONT.sans}" font-weight="700" font-size="19" fill="${BRAND.deepPlum}">Protective Travel Caps Included</text>

            <circle cx="16" cy="216" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="222" font-family="${FONT.sans}" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="42" y="223" font-family="${FONT.sans}" font-weight="700" font-size="19" fill="${BRAND.deepPlum}">Eco-Friendly Kraft Packaging Box</text>
          </g>

          <!-- Delivery Stamp -->
          <g transform="translate(0, 460)">
            <rect width="385" height="95" rx="18" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1.5"/>
            <text x="25" y="38" font-family="${FONT.sans}" font-weight="800" font-size="18" fill="#14532D">🚚 CASH ON DELIVERY NATIONWIDE</text>
            <text x="25" y="68" font-family="${FONT.sans}" font-weight="600" font-size="15" fill="#166534">Karachi, Lahore, Islamabad &amp; all cities 🇵🇰</text>
          </g>
        </g>

        <!-- Right Image Column (Section 1 asset) -->
        <g clip-path="url(#p10Clip)">
          <image href="${photoB64}" x="480" y="40" width="460" height="690" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="490" y="40" width="430" height="690" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <!-- Bottom Order Button -->
      <g transform="translate(60, 1075)" filter="url(#softShadow)">
        <rect width="960" height="190" rx="36" fill="url(#greenGrad)"/>
        <text x="480" y="70" font-family="${FONT.sans}" font-weight="900" font-size="32" fill="${BRAND.white}" text-anchor="middle">DM @girli_esglow TO ORDER NOW ⚡</text>
        <text x="480" y="112" font-family="${FONT.sans}" font-weight="700" font-size="22" fill="${BRAND.white}" text-anchor="middle">Only Rs. 599 • Pay when it arrives at your doorstep</text>
        <text x="480" y="148" font-family="${FONT.sans}" font-weight="600" font-size="17" fill="rgba(255,255,255,0.9)" text-anchor="middle">Or tap the link in our bio for instant checkout</text>
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
