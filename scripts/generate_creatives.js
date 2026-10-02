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
      <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#DC2626"/>
        <stop offset="100%" stop-color="#B91C1C"/>
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

// Clean Editorial Category Badge (Top)
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

// Bottom Conversion & Pricing Bar (Rs. 599 + COD Across Pakistan)
function drawBottomPricingBar(y = 1225) {
  return `
    <g transform="translate(60, ${y})" filter="url(#softShadow)">
      <rect width="960" height="85" rx="24" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
      <text x="35" y="38" font-family="${FONT.sans}" font-weight="800" font-size="23" fill="${BRAND.deepPlum}">Girlies Glow At-Home Facial Razor (White)</text>
      <text x="35" y="65" font-family="${FONT.sans}" font-weight="600" font-size="16" fill="${BRAND.mutedText}">🌾 Eco Wheat-Straw Body • Stainless Micro-Guard Safety</text>

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
// High-CTR Visual Contrast: Thick Hair + Big ❌ Cross vs Real Dermaplaning + Big ✓ Checkmark
export function renderPost1(outputPath = path.join(GENERATED_DIR, 'post_1_static.png')) {
  // Use authentic WHITE wheat-straw razor dermaplaning peach fuzz on skin
  const photoB64 = getAssetBase64('Card 1.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <linearGradient id="skinGradLeft" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FEE2E2"/>
          <stop offset="50%" stop-color="#FED7AA"/>
          <stop offset="100%" stop-color="#FDBA74"/>
        </linearGradient>
        <clipPath id="leftCardClip">
          <rect x="60" y="250" width="465" height="880" rx="32" ry="32"/>
        </clipPath>
        <clipPath id="rightCardClip">
          <rect x="555" y="250" width="465" height="880" rx="32" ry="32"/>
        </clipPath>
      </defs>

      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>

      <!-- Top Category Badge -->
      <g transform="translate(60, 50)">
        <rect width="310" height="44" rx="22" fill="#FAF5FF" stroke="${BRAND.purple}" stroke-width="1.5"/>
        <text x="155" y="28" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.purple}" text-anchor="middle" letter-spacing="1.5">✨ THE #1 SHAVING MYTH</text>
      </g>

      <!-- High-Impact Editorial Hook Headline -->
      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="52" fill="${BRAND.deepPlum}">Will It Grow Back Thicker?</text>
      <text x="60" y="210" font-family="${FONT.sans}" font-weight="900" font-size="48" fill="#DC2626">NO GIRL, THAT’S A MYTH ❌</text>

      <!-- ================= LEFT CARD: THE FEAR (THICK HAIR + BIG RED CROSS) ================= -->
      <g filter="url(#softShadow)">
        <rect x="60" y="250" width="465" height="880" rx="32" ry="32" fill="#FFF5F5" stroke="#FCA5A5" stroke-width="2"/>

        <g clip-path="url(#leftCardClip)">
          <!-- Simulated Skin Micro-Zoom Background -->
          <rect x="60" y="320" width="465" height="520" fill="url(#skinGradLeft)"/>
          
          <!-- Skin pore texture dots -->
          <g opacity="0.3" fill="#9A3412">
            <circle cx="120" cy="420" r="8"/><circle cx="180" cy="380" r="6"/><circle cx="250" cy="450" r="9"/>
            <circle cx="320" cy="400" r="7"/><circle cx="390" cy="460" r="8"/><circle cx="440" cy="390" r="6"/>
            <circle cx="140" cy="520" r="7"/><circle cx="210" cy="580" r="9"/><circle cx="280" cy="510" r="8"/>
            <circle cx="350" cy="570" r="7"/><circle cx="420" cy="530" r="8"/><circle cx="170" cy="660" r="8"/>
            <circle cx="260" cy="680" r="7"/><circle cx="340" cy="650" r="9"/><circle cx="410" cy="690" r="7"/>
            <circle cx="130" cy="750" r="8"/><circle cx="220" cy="780" r="7"/><circle cx="310" cy="740" r="9"/>
            <circle cx="390" cy="770" r="8"/><circle cx="450" cy="730" r="6"/>
          </g>

          <!-- Coarse, Thick, Dark Stubble Hair Fibers (Blunt Tops) -->
          <g stroke="#09090B" stroke-linecap="round" opacity="0.95">
            <line x1="120" y1="420" x2="105" y2="330" stroke-width="14"/>
            <line x1="180" y1="380" x2="170" y2="280" stroke-width="16"/>
            <line x1="250" y1="450" x2="235" y2="340" stroke-width="17"/>
            <line x1="320" y1="400" x2="340" y2="300" stroke-width="15"/>
            <line x1="390" y1="460" x2="410" y2="360" stroke-width="16"/>
            <line x1="440" y1="390" x2="460" y2="300" stroke-width="13"/>

            <line x1="140" y1="520" x2="120" y2="420" stroke-width="15"/>
            <line x1="210" y1="580" x2="195" y2="470" stroke-width="18"/>
            <line x1="280" y1="510" x2="270" y2="400" stroke-width="17"/>
            <line x1="350" y1="570" x2="370" y2="460" stroke-width="16"/>
            <line x1="420" y1="530" x2="440" y2="430" stroke-width="15"/>

            <line x1="170" y1="660" x2="150" y2="550" stroke-width="16"/>
            <line x1="260" y1="680" x2="245" y2="560" stroke-width="18"/>
            <line x1="340" y1="650" x2="360" y2="540" stroke-width="17"/>
            <line x1="410" y1="690" x2="430" y2="580" stroke-width="14"/>

            <line x1="130" y1="750" x2="115" y2="650" stroke-width="15"/>
            <line x1="220" y1="780" x2="205" y2="670" stroke-width="17"/>
            <line x1="310" y1="740" x2="325" y2="630" stroke-width="16"/>
            <line x1="390" y1="770" x2="415" y2="660" stroke-width="15"/>
          </g>

          <!-- Dark Vignette Overlay -->
          <rect x="60" y="320" width="465" height="520" fill="rgba(0,0,0,0.18)"/>

          <!-- ================= THE BIG RED CROSS OVER THICK HAIR ================= -->
          <g transform="translate(292, 570)">
            <circle cx="0" cy="0" r="115" fill="rgba(220, 38, 38, 0.92)" stroke="#FFFFFF" stroke-width="6" filter="url(#softShadow)"/>
            <line x1="-55" y1="-55" x2="55" y2="55" stroke="#FFFFFF" stroke-width="22" stroke-linecap="round"/>
            <line x1="55" y1="-55" x2="-55" y2="55" stroke="#FFFFFF" stroke-width="22" stroke-linecap="round"/>
          </g>
        </g>

        <!-- Top Tag in Left Card -->
        <g transform="translate(85, 275)">
          <rect width="170" height="38" rx="19" fill="url(#redGrad)"/>
          <text x="85" y="25" font-family="${FONT.sans}" font-weight="900" font-size="14" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">❌ THE FEAR</text>
        </g>

        <!-- Bottom Text in Left Card (Short, punchy, NO paragraphs) -->
        <g transform="translate(85, 875)">
          <text x="0" y="38" font-family="${FONT.sans}" font-weight="900" font-size="28" fill="#991B1B">“Baal Motay Ayenge?”</text>
          <text x="0" y="78" font-family="${FONT.sans}" font-weight="900" font-size="22" fill="#DC2626">100% FALSE MYTH ❌</text>
          <text x="0" y="116" font-family="${FONT.sans}" font-weight="700" font-size="18" fill="#7F1D1D">Follicles &amp; genetics never change.</text>
          <text x="0" y="146" font-family="${FONT.sans}" font-weight="600" font-size="16" fill="#991B1B">Shaving cannot create thick hair!</text>

          <rect x="0" y="180" width="415" height="44" rx="14" fill="#FEE2E2" stroke="#FCA5A5" stroke-width="1.5"/>
          <text x="207" y="208" font-family="${FONT.sans}" font-weight="900" font-size="15" fill="#B91C1C" text-anchor="middle" letter-spacing="0.5">NO BEARD • NO THICK STUBBLE</text>
        </g>
      </g>

      <!-- ================= RIGHT CARD: THE REALITY (CARD 1 PHOTO + GREEN CHECKMARK) ================= -->
      <g filter="url(#softShadow)">
        <rect x="555" y="250" width="465" height="880" rx="32" ry="32" fill="#FFFFFF" stroke="#86EFAC" stroke-width="2"/>

        <g clip-path="url(#rightCardClip)">
          <!-- Authentic Photo: Girlies Glow Razor Dermaplaning Peach Fuzz (Card 1.png) -->
          <image href="${photoB64}" x="545" y="250" width="490" height="590" preserveAspectRatio="xMidYMid slice"/>

          <!-- ================= THE BIG GREEN CHECKMARK OVER REALITY ================= -->
          <g transform="translate(787, 570)">
            <circle cx="0" cy="0" r="115" fill="rgba(22, 163, 74, 0.92)" stroke="#FFFFFF" stroke-width="6" filter="url(#softShadow)"/>
            <path d="M-45 5 L-15 35 L45 -28" fill="none" stroke="#FFFFFF" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
        </g>

        <!-- Top Tag in Right Card -->
        <g transform="translate(580, 275)">
          <rect width="170" height="38" rx="19" fill="url(#greenGrad)"/>
          <text x="85" y="25" font-family="${FONT.sans}" font-weight="900" font-size="14" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">✓ THE REALITY</text>
        </g>

        <!-- Bottom Text in Right Card (Short, punchy, NO paragraphs) -->
        <g transform="translate(580, 875)">
          <text x="0" y="38" font-family="${FONT.sans}" font-weight="900" font-size="28" fill="#14532D">“Soft Peach Fuzz Only”</text>
          <text x="0" y="78" font-family="${FONT.sans}" font-weight="900" font-size="22" fill="#16A34A">GLOWS BACK 100% SOFT ✨</text>
          <text x="0" y="116" font-family="${FONT.sans}" font-weight="700" font-size="18" fill="#14532D">Vellus hair stays light &amp; invisible.</text>
          <text x="0" y="146" font-family="${FONT.sans}" font-weight="600" font-size="16" fill="#15803D">Makeup glides on like melted butter!</text>

          <rect x="0" y="180" width="415" height="44" rx="14" fill="#DCFCE7" stroke="#86EFAC" stroke-width="1.5"/>
          <text x="207" y="208" font-family="${FONT.sans}" font-weight="900" font-size="15" fill="#166534" text-anchor="middle" letter-spacing="0.5">INSTANT GLASS SKIN • 100% SAFE</text>
        </g>
      </g>

      <!-- ================= CENTER "VS" CIRCLE BADGE ================= -->
      <g transform="translate(540, 620)" filter="url(#softShadow)">
        <circle cx="0" cy="0" r="38" fill="#1F1030" stroke="#FFFFFF" stroke-width="5"/>
        <text x="0" y="9" font-family="${FONT.sans}" font-weight="900" font-size="24" fill="#FFFFFF" text-anchor="middle">VS</text>
      </g>

      <!-- ================= BOTTOM CONVERSION BAR ================= -->
      ${drawBottomPricingBar(1220)}
    </svg>
  `;

  return renderSvgToPng(svg, outputPath);
}

// Post 2: Product in Action (Reel 9:16, 1080x1920)
// Full-bleed visual dominance with floating steps overlay (no bulky white text card)
export function renderPost2(
  coverPngPath = path.join(GENERATED_DIR, 'post_2_reel.png'),
  reelMp4Path = path.join(GENERATED_DIR, 'post_2_reel.mp4')
) {
  // Use authentic WHITE wheat-straw razor held at vanity / water
  const photoB64 = getAssetBase64('packaging section two.png');

  const refGif = path.join(ROOT_DIR, 'WhatsApp GIF 2026-09-11 at 00.01.06.gif');
  if (fs.existsSync(refGif)) fs.copyFileSync(refGif, reelMp4Path);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p2Clip">
          <rect x="60" y="300" width="960" height="1280" rx="36" ry="36"/>
        </clipPath>
      </defs>

      <rect width="1080" height="1920" fill="url(#bgWarmGrad)"/>
      ${drawTopBadgeReel('HOW TO DERMAPLANE ✨', 70)}

      <!-- Headline -->
      <text x="60" y="195" font-family="${FONT.sans}" font-weight="900" font-size="52" fill="${BRAND.deepPlum}">The 5-Minute Secret To</text>
      <text x="60" y="260" font-family="${FONT.sans}" font-weight="900" font-size="52" fill="${BRAND.purple}">Butter-Smooth Glass Skin 🌸</text>

      <!-- Full-Bleed 1280px Tall Authentic Photo Showcase -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p2Clip)">
          <image href="${photoB64}" x="60" y="240" width="960" height="1360" preserveAspectRatio="xMidYMid slice"/>

          <!-- Floating Badges Directly Over Photo -->
          <g transform="translate(95, 335)">
            <rect width="320" height="48" rx="24" fill="rgba(255, 255, 255, 0.95)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
            <text x="160" y="30" font-family="${FONT.sans}" font-weight="800" font-size="16" fill="${BRAND.purple}" text-anchor="middle">🌾 AUTHENTIC WHITE RAZOR</text>
          </g>

          <g transform="translate(680, 335)">
            <rect width="310" height="48" rx="24" fill="rgba(31, 16, 48, 0.90)"/>
            <text x="155" y="30" font-family="${FONT.sans}" font-weight="700" font-size="15" fill="#FFFFFF" text-anchor="middle">🛡️ Stainless Micro-Guard</text>
          </g>

          <!-- Center Glowing Play Icon Overlay -->
          <g transform="translate(540, 850)">
            <circle cx="0" cy="0" r="60" fill="rgba(104, 61, 169, 0.92)" stroke="#FFFFFF" stroke-width="5" filter="url(#softShadow)"/>
            <polygon points="-16,-28 -16,28 32,0" fill="#FFFFFF"/>
          </g>

          <!-- Sleek Semi-Transparent Step Overlays (NO heavy white paragraph cards) -->
          <g transform="translate(90, 1160)">
            <rect width="895" height="150" rx="24" fill="rgba(31, 16, 48, 0.88)" stroke="rgba(255, 255, 255, 0.2)" stroke-width="1.5"/>
            <text x="45" y="45" font-family="${FONT.sans}" font-weight="800" font-size="22" fill="#FFFFFF">① Cleanse &amp; Pat Dry 🧴</text>
            <text x="345" y="45" font-family="${FONT.sans}" font-weight="800" font-size="22" fill="#FFFFFF">② 45° Gentle Glide 📐</text>
            <text x="645" y="45" font-family="${FONT.sans}" font-weight="800" font-size="22" fill="#FFFFFF">③ Hydrate &amp; Glow ✨</text>
            <text x="447" y="105" font-family="${FONT.sans}" font-weight="700" font-size="20" fill="#86EFAC" text-anchor="middle">Watch peach fuzz &amp; dead cells melt away with zero cuts or redness!</text>
          </g>
        </g>
        <rect x="60" y="300" width="960" height="1280" rx="36" ry="36" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <!-- Bottom Order Pill -->
      <g transform="translate(60, 1650)" filter="url(#softShadow)">
        <rect width="960" height="160" rx="36" fill="url(#greenGrad)"/>
        <text x="480" y="65" font-family="${FONT.sans}" font-weight="900" font-size="32" fill="${BRAND.white}" text-anchor="middle">Rs. 599 • CASH ON DELIVERY NATIONWIDE 🇵🇰</text>
        <text x="480" y="110" font-family="${FONT.sans}" font-weight="700" font-size="22" fill="${BRAND.white}" text-anchor="middle">DM @girli_esglow or tap link in bio to order now</text>
      </g>
    </svg>
  `;

  renderSvgToPng(svg, coverPngPath);
  const altCover = path.join(GENERATED_DIR, 'post_2_cover.png');
  fs.copyFileSync(coverPngPath, altCover);
  return coverPngPath;
}

// Post 3: The Root Cause Carousel (4 slides, 1080x1350)
// 80%+ visual photography, punchy 1-line hooks, swipe cues, zero paragraph walls
export function renderPost3(outputDir = GENERATED_DIR) {
  const cakeyBaseB64 = getAssetBase64('card7.png');
  const drySkinB64 = getAssetBase64('car5.png');
  const razorActionB64 = getAssetBase64('Card 1.png');
  const flatlayB64 = getAssetBase64('Section 1.png');

  // Slide 1: The Problem (Macro Cakey Makeup)
  const svg1 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p3s1Clip"><rect x="60" y="240" width="960" height="770" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('MAKEUP MISTAKE 💄', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Why Does Your Foundation</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="#DC2626">Always Look Cakey &amp; Patchy? 😩</text>

      <!-- 770px High-Impact Visual -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p3s1Clip)">
          <image href="${cakeyBaseB64}" x="60" y="220" width="960" height="800" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="770" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 275)">
        <rect width="320" height="44" rx="22" fill="rgba(220, 38, 38, 0.92)"/>
        <text x="160" y="28" font-family="${FONT.sans}" font-weight="900" font-size="14" fill="#FFFFFF" text-anchor="middle">❌ CAKEY, CRACKING BASE</text>
      </g>

      <!-- Punchy Floating Action Bar (NO paragraphs) -->
      <g transform="translate(60, 1040)" filter="url(#softShadow)">
        <rect width="960" height="155" rx="24" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="45" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">The Real Culprit: Invisible Peach Fuzz &amp; Dead Skin!</text>
        <text x="40" y="78" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.mutedText}">Makeup clings to fuzzy texture rather than blending cleanly into your skin.</text>
        
        <g transform="translate(40, 95)">
          <rect width="880" height="42" rx="14" fill="${BRAND.softLavender}"/>
          <text x="440" y="27" font-family="${FONT.sans}" font-weight="900" font-size="15" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO SEE HOW DERMAPLANING FIXES THIS 👉</text>
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
        <clipPath id="p3s2Clip"><rect x="60" y="240" width="960" height="770" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('THE ROOT CAUSE 🔍', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">The Hidden Barrier Between</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">You and Flawless Skin 🔬</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p3s2Clip)">
          <image href="${drySkinB64}" x="60" y="200" width="960" height="820" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="770" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 275)">
        <rect width="320" height="44" rx="22" fill="rgba(31, 16, 48, 0.88)"/>
        <text x="160" y="28" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="#FFFFFF" text-anchor="middle">🔍 MICROSCOPIC DRY TEXTURE</text>
      </g>

      <g transform="translate(60, 1040)" filter="url(#softShadow)">
        <rect width="960" height="155" rx="24" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="45" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">Scrubs &amp; Toners Can’t Remove Physical Fuzz</text>
        <text x="40" y="78" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.mutedText}">Dermaplaning sweeps away dead cellular debris and vellus hair in 5 minutes.</text>
        
        <g transform="translate(40, 95)">
          <rect width="880" height="42" rx="14" fill="${BRAND.softLavender}"/>
          <text x="440" y="27" font-family="${FONT.sans}" font-weight="900" font-size="15" fill="${BRAND.purple}" text-anchor="middle">SWIPE FOR THE 5-MINUTE SOLUTION 👉</text>
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
        <clipPath id="p3s3Clip"><rect x="60" y="240" width="960" height="770" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('THE 5-MINUTE FIX ✨', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Dermaplane First.</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Melt Foundation Later. 🌸</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p3s3Clip)">
          <image href="${razorActionB64}" x="60" y="220" width="960" height="800" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="770" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 275)">
        <rect width="320" height="44" rx="22" fill="url(#greenGrad)"/>
        <text x="160" y="28" font-family="${FONT.sans}" font-weight="900" font-size="14" fill="#FFFFFF" text-anchor="middle">✓ ZERO CUTS • 100% PAINLESS</text>
      </g>

      <g transform="translate(60, 1040)" filter="url(#softShadow)">
        <rect width="960" height="155" rx="24" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="45" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">Instant Glass Skin &amp; Reflective Radiance</text>
        <text x="40" y="78" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.mutedText}">Light strokes glide smoothly over the surface with our micro-guard blade.</text>
        
        <g transform="translate(40, 95)">
          <rect width="880" height="42" rx="14" fill="${BRAND.softLavender}"/>
          <text x="440" y="27" font-family="${FONT.sans}" font-weight="900" font-size="15" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO MEET YOUR NEW BEAUTY BESTIE 👉</text>
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
        <clipPath id="p3s4Clip"><rect x="60" y="240" width="960" height="770" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('GLOW AT HOME 🇵🇰', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Meet The Girlies Glow</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Wheat-Straw Facial Razor (White) ✨</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p3s4Clip)">
          <image href="${flatlayB64}" x="60" y="230" width="960" height="790" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="770" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 275)">
        <rect width="330" height="44" rx="22" fill="rgba(255, 255, 255, 0.94)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="165" y="28" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.purple}" text-anchor="middle">🌾 BIODEGRADABLE WHEAT STRAW</text>
      </g>

      <g transform="translate(60, 1040)" filter="url(#softShadow)">
        <rect width="960" height="155" rx="24" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="45" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">Your Base Just Found Its Match 💜</text>
        <text x="40" y="78" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.mutedText}">Pack of 3 eco razors (White). Lasts months. Cash on Delivery across Pakistan.</text>
        
        <g transform="translate(40, 95)">
          <rect width="880" height="45" rx="14" fill="url(#greenGrad)"/>
          <text x="440" y="29" font-family="${FONT.sans}" font-weight="900" font-size="17" fill="${BRAND.white}" text-anchor="middle">ORDER NOW FOR Rs. 599 • CASH ON DELIVERY 🇵🇰</text>
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
// High-contrast price & pain comparison with authentic product showcase
export function renderPost4(outputPath = path.join(GENERATED_DIR, 'post_4_static.png')) {
  const photoB64 = getAssetBase64('Section 1.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p4PhotoClip"><rect x="60" y="850" width="960" height="345" rx="24" ry="24"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('SMART BEAUTY • COMPARISON', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Parlour Jaane Ka Mood Nahi?</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Glow Ghar Par 💅</text>

      <!-- Side-by-Side Comparison Grid -->
      <g transform="translate(60, 245)" filter="url(#softShadow)">
        <!-- Parlour Column -->
        <g transform="translate(0, 0)">
          <rect width="465" height="575" rx="28" fill="${BRAND.white}" stroke="#FEE2E2" stroke-width="2"/>
          <rect x="30" y="25" width="260" height="40" rx="20" fill="#FEE2E2"/>
          <text x="160" y="51" font-family="${FONT.sans}" font-weight="900" font-size="14" fill="#DC2626" text-anchor="middle">SALON WAXING / THREADING</text>

          <text x="30" y="115" font-family="${FONT.sans}" font-weight="900" font-size="36" fill="#991B1B">Rs. 2,500</text>
          <text x="30" y="145" font-family="${FONT.sans}" font-weight="600" font-size="15" fill="#B91C1C">Every single salon appointment</text>

          <g transform="translate(30, 180)">
            <text x="0" y="25" font-family="${FONT.sans}" font-weight="800" font-size="18" fill="#7F1D1D">✕ 1-2 hours lost in traffic &amp; waiting</text>
            <text x="0" y="70" font-family="${FONT.sans}" font-weight="800" font-size="18" fill="#7F1D1D">✕ Painful hair pulling &amp; skin stretch</text>
            <text x="0" y="115" font-family="${FONT.sans}" font-weight="800" font-size="18" fill="#7F1D1D">✕ Post-waxing redness &amp; acne bumps</text>
            <text x="0" y="160" font-family="${FONT.sans}" font-weight="800" font-size="18" fill="#7F1D1D">✕ Over Rs. 24,000 every single year</text>
          </g>

          <rect x="30" y="475" width="405" height="70" rx="16" fill="#FEF2F2"/>
          <text x="232" y="517" font-family="${FONT.sans}" font-weight="900" font-size="17" fill="#991B1B" text-anchor="middle">PAINFUL &amp; EXPENSIVE ❌</text>
        </g>

        <!-- Girlies Glow Column -->
        <g transform="translate(495, 0)">
          <rect width="465" height="575" rx="28" fill="${BRAND.white}" stroke="#BBF7D0" stroke-width="2"/>
          <rect x="30" y="25" width="200" height="40" rx="20" fill="#DCFCE7"/>
          <text x="130" y="51" font-family="${FONT.sans}" font-weight="900" font-size="14" fill="#15803D" text-anchor="middle">GIRLIES GLOW ✨</text>

          <text x="30" y="115" font-family="${FONT.sans}" font-weight="900" font-size="36" fill="#166534">Rs. 599 ONLY</text>
          <text x="30" y="145" font-family="${FONT.sans}" font-weight="600" font-size="15" fill="#15803D">Complete set • Reusable for months</text>

          <g transform="translate(30, 180)">
            <text x="0" y="25" font-family="${FONT.sans}" font-weight="800" font-size="18" fill="#14532D">✓ 5 minutes in your own bedroom</text>
            <text x="0" y="70" font-family="${FONT.sans}" font-weight="800" font-size="18" fill="#14532D">✓ 100% Painless micro-guard blade</text>
            <text x="0" y="115" font-family="${FONT.sans}" font-weight="800" font-size="18" fill="#14532D">✓ Instant glass skin &amp; butter base</text>
            <text x="0" y="160" font-family="${FONT.sans}" font-weight="800" font-size="18" fill="#14532D">✓ Biodegradable wheat straw (White)</text>
          </g>

          <rect x="30" y="475" width="405" height="70" rx="16" fill="url(#greenGrad)"/>
          <text x="232" y="517" font-family="${FONT.sans}" font-weight="900" font-size="18" fill="${BRAND.white}" text-anchor="middle">SAVE RS. 20,000+ A YEAR ✓</text>
        </g>
      </g>

      <!-- Center VS Badge -->
      <g transform="translate(540, 520)" filter="url(#softShadow)">
        <circle cx="0" cy="0" r="34" fill="#1F1030" stroke="#FFFFFF" stroke-width="4"/>
        <text x="0" y="8" font-family="${FONT.sans}" font-weight="900" font-size="20" fill="#FFFFFF" text-anchor="middle">VS</text>
      </g>

      <!-- Real Photo Showcase at Bottom -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p4PhotoClip)">
          <image href="${photoB64}" x="60" y="820" width="960" height="420" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="850" width="960" height="345" rx="24" ry="24" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
        
        <g transform="translate(90, 880)">
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
// Authentic Pakistani lifestyle visual, gold stars, 1-line quote, zero paragraph walls
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
        <clipPath id="p5Clip"><rect x="60" y="300" width="960" height="1280" rx="36" ry="36"/></clipPath>
      </defs>
      <rect width="1080" height="1920" fill="url(#bgWarmGrad)"/>
      ${drawTopBadgeReel('REAL CUSTOMER REVIEW ⭐', 70)}

      <!-- Headline -->
      <text x="60" y="195" font-family="${FONT.sans}" font-weight="900" font-size="50" fill="${BRAND.deepPlum}">“I was terrified to shave my face</text>
      <text x="60" y="260" font-family="${FONT.sans}" font-weight="900" font-size="50" fill="${BRAND.purple}">until I tried Girlies Glow!” 💜</text>

      <!-- Real Lifestyle Photo (Card 4) -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p5Clip)">
          <image href="${photoB64}" x="60" y="240" width="960" height="1360" preserveAspectRatio="xMidYMid slice"/>

          <!-- Floating Badges on Photo -->
          <g transform="translate(95, 335)">
            <rect width="280" height="48" rx="24" fill="rgba(255, 255, 255, 0.95)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
            <text x="140" y="30" font-family="${FONT.sans}" font-weight="800" font-size="16" fill="${BRAND.purple}" text-anchor="middle">🌸 10,000+ HAPPY GIRLS</text>
          </g>

          <g transform="translate(680, 335)">
            <rect width="280" height="48" rx="24" fill="#047857"/>
            <text x="140" y="30" font-family="${FONT.sans}" font-weight="800" font-size="15" fill="#FFFFFF" text-anchor="middle">VERIFIED BUYER ✓</text>
          </g>

          <!-- Floating Modern Review Card Over Lower Photo -->
          <g transform="translate(90, 1150)">
            <rect width="895" height="180" rx="24" fill="rgba(255, 255, 255, 0.96)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5" filter="url(#softShadow)"/>
            
            <g transform="translate(35, 25)">
              ${drawGoldStars(20, 20, 28, 36)}
              <text x="210" y="26" font-family="${FONT.sans}" font-weight="900" font-size="18" fill="${BRAND.deepPlum}">Ayesha K. — Lahore</text>
            </g>

            <text x="35" y="85" font-family="${FONT.sans}" font-weight="800" font-size="22" fill="${BRAND.deepPlum}">“My parlour lady said baal motay ayenge. 100% FALSE!”</text>
            <text x="35" y="118" font-family="${FONT.sans}" font-weight="700" font-size="19" fill="${BRAND.purple}">“My makeup has NEVER looked this smooth. Best Rs. 599 decision!”</text>
            <text x="35" y="148" font-family="${FONT.sans}" font-weight="600" font-size="15" fill="${BRAND.mutedText}">Verified Customer • Cash on Delivery Order</text>
          </g>
        </g>
        <rect x="60" y="300" width="960" height="1280" rx="36" ry="36" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <!-- Bottom Order Pill -->
      <g transform="translate(60, 1650)" filter="url(#softShadow)">
        <rect width="960" height="160" rx="36" fill="url(#greenGrad)"/>
        <text x="480" y="65" font-family="${FONT.sans}" font-weight="900" font-size="32" fill="${BRAND.white}" text-anchor="middle">Rs. 599 • CASH ON DELIVERY NATIONWIDE 🇵🇰</text>
        <text x="480" y="110" font-family="${FONT.sans}" font-weight="700" font-size="22" fill="${BRAND.white}" text-anchor="middle">Order via DM @girli_esglow or link in bio</text>
      </g>
    </svg>
  `;

  renderSvgToPng(svg, coverPngPath);
  const altCover = path.join(GENERATED_DIR, 'post_5_cover.png');
  fs.copyFileSync(coverPngPath, altCover);
  return coverPngPath;
}

// Post 6: Product Benefits & Eco-Value (Static 4:5, 1080x1350)
// Studio flatlay with pointer callouts & concise benefit pills
export function renderPost6(outputPath = path.join(GENERATED_DIR, 'post_6_static.png')) {
  // Use authentic WHITE wheat-straw razor flatlay with dried lavender
  const photoB64 = getAssetBase64('Single.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p6Clip"><rect x="60" y="240" width="960" height="620" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('ECO-LUXURY BEAUTY 🌿', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Small Razor. Big Glow Energy ✨</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Designed Specifically For Female Skin</text>

      <!-- Real Studio Flatlay Asset -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p6Clip)">
          <image href="${photoB64}" x="60" y="170" width="960" height="730" preserveAspectRatio="xMidYMid slice"/>

          <!-- Pointer Callout Badges Directly on Photo -->
          <g transform="translate(90, 275)">
            <rect width="320" height="44" rx="22" fill="rgba(255, 255, 255, 0.94)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
            <text x="160" y="28" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.purple}" text-anchor="middle">🌾 AUTHENTIC WHITE RAZOR</text>
          </g>

          <g transform="translate(680, 780)">
            <rect width="310" height="44" rx="22" fill="rgba(31, 16, 48, 0.88)"/>
            <text x="155" y="28" font-family="${FONT.sans}" font-weight="700" font-size="14" fill="#FFFFFF" text-anchor="middle">🛡️ Stainless Micro-Guard Safety</text>
          </g>
        </g>
        <rect x="60" y="240" width="960" height="620" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <!-- 4 Core Benefits Clean 2x2 Grid (NO text paragraphs) -->
      <g transform="translate(60, 885)" filter="url(#softShadow)">
        <!-- Card 1 -->
        <g transform="translate(0, 0)">
          <rect width="465" height="145" rx="20" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
          <circle cx="45" cy="45" r="24" fill="${BRAND.softLavender}"/>
          <text x="45" y="53" font-family="${FONT.sans}" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">🌾</text>
          <text x="85" y="42" font-family="${FONT.sans}" font-weight="800" font-size="20" fill="${BRAND.deepPlum}">Wheat Straw Handle</text>
          <text x="85" y="70" font-family="${FONT.sans}" font-weight="600" font-size="15" fill="${BRAND.mutedText}">Sustainable cream body (White)</text>
          <text x="85" y="94" font-family="${FONT.sans}" font-weight="600" font-size="15" fill="${BRAND.mutedText}">Zero toxic petroleum plastics</text>
        </g>

        <!-- Card 2 -->
        <g transform="translate(495, 0)">
          <rect width="465" height="145" rx="20" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
          <circle cx="45" cy="45" r="24" fill="${BRAND.softLavender}"/>
          <text x="45" y="53" font-family="${FONT.sans}" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">🛡️</text>
          <text x="85" y="42" font-family="${FONT.sans}" font-weight="800" font-size="20" fill="${BRAND.deepPlum}">Micro-Guard Blade</text>
          <text x="85" y="70" font-family="${FONT.sans}" font-weight="600" font-size="15" fill="${BRAND.mutedText}">Stainless protective ribs</text>
          <text x="85" y="94" font-family="${FONT.sans}" font-weight="600" font-size="15" fill="${BRAND.mutedText}">100% painless with zero cuts</text>
        </g>

        <!-- Card 3 -->
        <g transform="translate(0, 160)">
          <rect width="465" height="145" rx="20" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
          <circle cx="45" cy="45" r="24" fill="${BRAND.softLavender}"/>
          <text x="45" y="53" font-family="${FONT.sans}" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">✨</text>
          <text x="85" y="42" font-family="${FONT.sans}" font-weight="800" font-size="20" fill="${BRAND.deepPlum}">Instant 2-in-1 Exfoliation</text>
          <text x="85" y="70" font-family="${FONT.sans}" font-weight="600" font-size="15" fill="${BRAND.mutedText}">Removes fuzz &amp; dry dead skin</text>
          <text x="85" y="94" font-family="${FONT.sans}" font-weight="600" font-size="15" fill="${BRAND.mutedText}">Leaves baby-smooth glass skin</text>
        </g>

        <!-- Card 4 -->
        <g transform="translate(495, 160)">
          <rect width="465" height="145" rx="20" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
          <circle cx="45" cy="45" r="24" fill="${BRAND.softLavender}"/>
          <text x="45" y="53" font-family="${FONT.sans}" font-weight="800" font-size="20" fill="${BRAND.purple}" text-anchor="middle">💧</text>
          <text x="85" y="42" font-family="${FONT.sans}" font-weight="800" font-size="20" fill="${BRAND.deepPlum}">3x Better Absorption</text>
          <text x="85" y="70" font-family="${FONT.sans}" font-weight="600" font-size="15" fill="${BRAND.mutedText}">Serums penetrate deeply</text>
          <text x="85" y="94" font-family="${FONT.sans}" font-weight="600" font-size="15" fill="${BRAND.mutedText}">Foundation applies like butter</text>
        </g>
      </g>

      ${drawBottomPricingBar(1225)}
    </svg>
  `;

  return renderSvgToPng(svg, outputPath);
}

// Post 7: GRWM Transformation & Mistakes (Reel 9:16, 1080x1920)
// High-urgency hook with 3 warning pills directly over visual
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
        <clipPath id="p7Clip"><rect x="60" y="300" width="960" height="1280" rx="36" ry="36"/></clipPath>
      </defs>
      <rect width="1080" height="1920" fill="url(#bgWarmGrad)"/>
      ${drawTopBadgeReel('SKINCARE MISTAKES ⚠️', 70)}

      <!-- Headline -->
      <text x="60" y="195" font-family="${FONT.sans}" font-weight="900" font-size="50" fill="${BRAND.deepPlum}">3 Shaving Mistakes That</text>
      <text x="60" y="260" font-family="${FONT.sans}" font-weight="900" font-size="50" fill="#DC2626">Are Ruining Your Skin ❌</text>

      <!-- Real Macro Studio Asset: White Wheat-Straw Razor -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p7Clip)">
          <image href="${photoB64}" x="60" y="240" width="960" height="1360" preserveAspectRatio="xMidYMid slice"/>

          <!-- Floating Badges on Photo -->
          <g transform="translate(95, 335)">
            <rect width="330" height="48" rx="24" fill="rgba(255, 255, 255, 0.95)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
            <text x="165" y="30" font-family="${FONT.sans}" font-weight="800" font-size="16" fill="${BRAND.purple}" text-anchor="middle">🌸 STEP 0 IN MAKEUP PREP</text>
          </g>

          <!-- 3 High-Impact Warning Pills Over Photo -->
          <g transform="translate(90, 1020)">
            <rect width="895" height="70" rx="20" fill="rgba(220, 38, 38, 0.92)"/>
            <text x="35" y="44" font-family="${FONT.sans}" font-weight="900" font-size="22" fill="#FFFFFF">❌ MISTAKE 1: Shaving over makeup or unwashed skin</text>
          </g>

          <g transform="translate(90, 1110)">
            <rect width="895" height="70" rx="20" fill="rgba(220, 38, 38, 0.92)"/>
            <text x="35" y="44" font-family="${FONT.sans}" font-weight="900" font-size="22" fill="#FFFFFF">❌ MISTAKE 2: Wrong blade angle (Always hold strictly at 45° 📐)</text>
          </g>

          <g transform="translate(90, 1200)">
            <rect width="895" height="70" rx="20" fill="rgba(220, 38, 38, 0.92)"/>
            <text x="35" y="44" font-family="${FONT.sans}" font-weight="900" font-size="22" fill="#FFFFFF">❌ MISTAKE 3: Pressing too hard (Let the micro-guard glide!)</text>
          </g>

          <g transform="translate(90, 1290)">
            <rect width="895" height="70" rx="20" fill="rgba(46, 125, 50, 0.94)"/>
            <text x="447" y="44" font-family="${FONT.sans}" font-weight="900" font-size="22" fill="#FFFFFF" text-anchor="middle">✓ THE FIX: Girlies Glow White Razor with Stainless Safety Ribs</text>
          </g>
        </g>
        <rect x="60" y="300" width="960" height="1280" rx="36" ry="36" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <!-- Bottom Order Pill -->
      <g transform="translate(60, 1650)" filter="url(#softShadow)">
        <rect width="960" height="160" rx="36" fill="url(#greenGrad)"/>
        <text x="480" y="65" font-family="${FONT.sans}" font-weight="900" font-size="32" fill="${BRAND.white}" text-anchor="middle">Rs. 599 • CASH ON DELIVERY NATIONWIDE 🇵🇰</text>
        <text x="480" y="110" font-family="${FONT.sans}" font-weight="700" font-size="22" fill="${BRAND.white}" text-anchor="middle">Tap link in bio or DM @girli_esglow to get yours</text>
      </g>
    </svg>
  `;

  renderSvgToPng(svg, coverPngPath);
  const altCover = path.join(GENERATED_DIR, 'post_7_cover.png');
  fs.copyFileSync(coverPngPath, altCover);
  return coverPngPath;
}

// Post 8: How to Use Beginner Guide Carousel (5 slides, each 1080x1350)
// 80%+ visual photography, punchy 1-line steps, clean swipe prompts, zero paragraph walls
export function renderPost8(outputDir = GENERATED_DIR) {
  const mirrorB64 = getAssetBase64('Card 4.png');
  const cleanSkinB64 = getAssetBase64('Card 6.png');
  const bladeMacroB64 = getAssetBase64('packaging section three.png');
  const razorHandB64 = getAssetBase64('packaging section two.png');
  const hydrateB64 = getAssetBase64('Section 1.png');

  // Slide 1: Cover
  const svg1 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs><clipPath id="p8s1Clip"><rect x="60" y="240" width="960" height="770" rx="28" ry="28"/></clipPath></defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('DERMAPLANING 101', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">New to Facial Shaving?</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Save This Beginner Guide 💜</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p8s1Clip)">
          <image href="${mirrorB64}" x="60" y="200" width="960" height="820" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="770" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 275)">
        <rect width="320" height="44" rx="22" fill="rgba(255, 255, 255, 0.95)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="160" y="28" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.purple}" text-anchor="middle">🌸 4 SIMPLE BEGINNER STEPS</text>
      </g>

      <g transform="translate(60, 1040)" filter="url(#softShadow)">
        <rect width="960" height="155" rx="24" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="45" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">Zero Pain • Zero Cuts • Zero Stubble</text>
        <text x="40" y="78" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.mutedText}">Dermaplaning is the gentlest way to achieve glowing glass skin at home.</text>
        
        <g transform="translate(40, 95)">
          <rect width="880" height="42" rx="14" fill="${BRAND.softLavender}"/>
          <text x="440" y="27" font-family="${FONT.sans}" font-weight="900" font-size="15" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO START STEP 1 👉</text>
        </g>
      </g>
      ${drawBottomPricingBar(1225)}
    </svg>
  `;

  // Slide 2: Step 1 (Cleanse)
  const svg2 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs><clipPath id="p8s2Clip"><rect x="60" y="240" width="960" height="770" rx="28" ry="28"/></clipPath></defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('STEP 01 • PREPARATION', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Step 1: Cleanse Thoroughly</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Never Shave Over Makeup or Dirt 🧴</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p8s2Clip)">
          <image href="${cleanSkinB64}" x="60" y="200" width="960" height="820" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="770" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 275)">
        <rect width="280" height="44" rx="22" fill="rgba(31, 16, 48, 0.88)"/>
        <text x="140" y="28" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="#FFFFFF" text-anchor="middle">🧴 CLEAN CANVAS ONLY</text>
      </g>

      <g transform="translate(60, 1040)" filter="url(#softShadow)">
        <rect width="960" height="155" rx="24" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="45" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">Wash with a Gentle Cleanser &amp; Pat 100% Dry</text>
        <text x="40" y="78" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.mutedText}">Beginners can apply 2 drops of facial oil for ultra-smooth blade glide.</text>
        
        <g transform="translate(40, 95)">
          <rect width="880" height="42" rx="14" fill="${BRAND.softLavender}"/>
          <text x="440" y="27" font-family="${FONT.sans}" font-weight="900" font-size="15" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO STEP 2 (THE ANGLE) 👉</text>
        </g>
      </g>
      ${drawBottomPricingBar(1225)}
    </svg>
  `;

  // Slide 3: Step 2 (Taut Skin at 45° with White Razor Micro-Guard Macro)
  const svg3 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs><clipPath id="p8s3Clip"><rect x="60" y="240" width="960" height="770" rx="28" ry="28"/></clipPath></defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('STEP 02 • THE TECHNIQUE', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Step 2: Hold Skin Taut</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Maintain a Precise 45° Angle 📐</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p8s3Clip)">
          <image href="${bladeMacroB64}" x="60" y="200" width="960" height="820" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="770" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 275)">
        <rect width="320" height="44" rx="22" fill="url(#greenGrad)"/>
        <text x="160" y="28" font-family="${FONT.sans}" font-weight="900" font-size="14" fill="#FFFFFF" text-anchor="middle">🛡️ STAINLESS MICRO-GUARD</text>
      </g>

      <g transform="translate(60, 1040)" filter="url(#softShadow)">
        <rect width="960" height="155" rx="24" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="45" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">The Golden Rule of Dermaplaning</text>
        <text x="40" y="78" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.mutedText}">Pull cheek taut with free hand. Angle razor at 45° so micro-guard protects you.</text>
        
        <g transform="translate(40, 95)">
          <rect width="880" height="42" rx="14" fill="${BRAND.softLavender}"/>
          <text x="440" y="27" font-family="${FONT.sans}" font-weight="900" font-size="15" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO STEP 3 (THE STROKES) 👉</text>
        </g>
      </g>
      ${drawBottomPricingBar(1225)}
    </svg>
  `;

  // Slide 4: Step 3 (Feather-Light Strokes with White Razor In Hand)
  const svg4 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs><clipPath id="p8s4Clip"><rect x="60" y="240" width="960" height="770" rx="28" ry="28"/></clipPath></defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('STEP 03 • THE GLIDE', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Step 3: Light Downward Strokes</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Never Press Hard • Let The Blade Work ✨</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p8s4Clip)">
          <image href="${razorHandB64}" x="60" y="200" width="960" height="820" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="770" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 275)">
        <rect width="320" height="44" rx="22" fill="rgba(255, 255, 255, 0.94)" stroke="rgba(104, 61, 169, 0.2)" stroke-width="1.5"/>
        <text x="160" y="28" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.purple}" text-anchor="middle">🌾 AUTHENTIC WHITE RAZOR</text>
      </g>

      <g transform="translate(60, 1040)" filter="url(#softShadow)">
        <rect width="960" height="155" rx="24" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="45" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">Short, Feather-Light Downward Glides</text>
        <text x="40" y="78" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.mutedText}">Watch peach fuzz and dull dead skin cleanly sweep away with zero irritation!</text>
        
        <g transform="translate(40, 95)">
          <rect width="880" height="42" rx="14" fill="${BRAND.softLavender}"/>
          <text x="440" y="27" font-family="${FONT.sans}" font-weight="900" font-size="15" fill="${BRAND.purple}" text-anchor="middle">SWIPE TO STEP 4 (AFTERCARE) 👉</text>
        </g>
      </g>
      ${drawBottomPricingBar(1225)}
    </svg>
  `;

  // Slide 5: Step 4 & CTA (Hydrate & Order)
  const svg5 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs><clipPath id="p8s5Clip"><rect x="60" y="240" width="960" height="770" rx="28" ry="28"/></clipPath></defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('STEP 04 • AFTERCARE &amp; GLOW', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Step 4: Hydrate &amp; Protect</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Lock In Moisture For Glass Skin 💧</text>

      <g filter="url(#softShadow)">
        <g clip-path="url(#p8s5Clip)">
          <image href="${hydrateB64}" x="60" y="200" width="960" height="820" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="60" y="240" width="960" height="770" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <g transform="translate(90, 275)">
        <rect width="320" height="44" rx="22" fill="url(#greenGrad)"/>
        <text x="160" y="28" font-family="${FONT.sans}" font-weight="900" font-size="14" fill="#FFFFFF" text-anchor="middle">✨ RADIANT GLASS SKIN RESULT</text>
      </g>

      <g transform="translate(60, 1040)" filter="url(#softShadow)">
        <rect width="960" height="155" rx="24" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>
        <text x="40" y="45" font-family="${FONT.sans}" font-weight="800" font-size="24" fill="${BRAND.deepPlum}">Apply Barrier Cream &amp; Store Razor Safely</text>
        <text x="40" y="78" font-family="${FONT.sans}" font-weight="600" font-size="18" fill="${BRAND.mutedText}">Wipe blade with alcohol, snap cap on. Ready for your next routine in 2-3 weeks!</text>
        
        <g transform="translate(40, 95)">
          <rect width="880" height="45" rx="14" fill="url(#greenGrad)"/>
          <text x="440" y="29" font-family="${FONT.sans}" font-weight="900" font-size="17" fill="${BRAND.white}" text-anchor="middle">ORDER YOUR SET FOR Rs. 599 • CASH ON DELIVERY 🇵🇰</text>
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
// Authentic Before/After cheek split with glowing skin contrast
export function renderPost9(outputPath = path.join(GENERATED_DIR, 'post_9_static.png')) {
  // Use authentic side-by-side Before/After cheek asset
  const photoB64 = getAssetBase64('card 3.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p9Clip"><rect x="60" y="240" width="960" height="740" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('REAL RESULTS • UNFILTERED', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Before vs. After: Real Results</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">What Dermaplaning Truly Does ✨</text>

      <!-- Real Before & After Studio Asset (card 3) -->
      <g filter="url(#softShadow)">
        <g clip-path="url(#p9Clip)">
          <image href="${photoB64}" x="60" y="200" width="960" height="800" preserveAspectRatio="xMidYMid slice"/>

          <!-- Center Divider Line -->
          <line x1="540" y1="240" x2="540" y2="980" stroke="#FFFFFF" stroke-width="4" opacity="0.9"/>

          <!-- Floating Badges Directly on Photo -->
          <g transform="translate(90, 275)">
            <rect width="240" height="44" rx="22" fill="rgba(31, 16, 48, 0.90)"/>
            <text x="120" y="28" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.white}" text-anchor="middle">❌ BEFORE: PEACH FUZZ</text>
          </g>

          <g transform="translate(730, 275)">
            <rect width="240" height="44" rx="22" fill="rgba(46, 125, 50, 0.94)"/>
            <text x="120" y="28" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="${BRAND.white}" text-anchor="middle">✓ AFTER: GLASS SKIN ✨</text>
          </g>
        </g>
        <rect x="60" y="240" width="960" height="740" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <!-- Review Card Below Photo -->
      <g transform="translate(60, 1010)" filter="url(#softShadow)">
        <rect width="960" height="185" rx="24" fill="${BRAND.white}" stroke="${BRAND.borderLight}" stroke-width="1.5"/>

        <g transform="translate(40, 25)">
          ${drawGoldStars(20, 20, 26, 34)}
          <rect x="210" y="2" width="180" height="36" rx="18" fill="#ECFDF5"/>
          <text x="300" y="25" font-family="${FONT.sans}" font-weight="800" font-size="14" fill="#047857" text-anchor="middle">VERIFIED BUYER ✓</text>
        </g>

        <text x="40" y="85" font-family="${FONT.sans}" font-weight="800" font-size="22" fill="${BRAND.deepPlum}">“Zero filter. My makeup glides on like melted butter now!”</text>
        <text x="40" y="118" font-family="${FONT.sans}" font-weight="600" font-size="17" fill="${BRAND.charcoalText}">“I was terrified because of the myth, but Girlies Glow completely smoothed my texture!”</text>
        <text x="40" y="148" font-family="${FONT.sans}" font-weight="700" font-size="16" fill="${BRAND.purple}">— Mahnoor R., Karachi • Cash on Delivery Order</text>
      </g>

      ${drawBottomPricingBar(1225)}
    </svg>
  `;

  return renderSvgToPng(svg, outputPath);
}

// Post 10: Special Launch Offer (Static 4:5, 1080x1350)
// High-conversion visual offer: 40% OFF, Rs. 599, COD, authentic travertine pack photography
export function renderPost10(outputPath = path.join(GENERATED_DIR, 'post_10_offer.png')) {
  // Use authentic WHITE razors with kraft packaging on travertine
  const photoB64 = getAssetBase64('Section 1.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <defs>
        <clipPath id="p10Clip"><rect x="490" y="40" width="430" height="710" rx="28" ry="28"/></clipPath>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgWarmGrad)"/>
      ${drawTopBadge('EXCLUSIVE LAUNCH OFFER ⚡', 52)}

      <text x="60" y="150" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.deepPlum}">Unlock Radiant Glass Skin At Home</text>
      <text x="60" y="205" font-family="${FONT.sans}" font-weight="900" font-size="46" fill="${BRAND.purple}">Girlies Glow At-Home Dermaplaning Pack 🌸</text>

      <!-- Center Offer Container -->
      <g transform="translate(60, 255)" filter="url(#softShadow)">
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
          <g transform="translate(0, 180)">
            <circle cx="16" cy="16" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="22" font-family="${FONT.sans}" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="42" y="23" font-family="${FONT.sans}" font-weight="700" font-size="19" fill="${BRAND.deepPlum}">3x Biodegradable Razors (White)</text>

            <circle cx="16" cy="68" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="74" font-family="${FONT.sans}" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="42" y="75" font-family="${FONT.sans}" font-weight="700" font-size="19" fill="${BRAND.deepPlum}">Stainless Micro-Guard Blades</text>

            <circle cx="16" cy="120" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="126" font-family="${FONT.sans}" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="42" y="127" font-family="${FONT.sans}" font-weight="700" font-size="19" fill="${BRAND.deepPlum}">Zero Cuts &amp; Safe For Sensitive Skin</text>

            <circle cx="16" cy="172" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="178" font-family="${FONT.sans}" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="42" y="179" font-family="${FONT.sans}" font-weight="700" font-size="19" fill="${BRAND.deepPlum}">Protective Travel Caps Included</text>

            <circle cx="16" cy="224" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="230" font-family="${FONT.sans}" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="42" y="231" font-family="${FONT.sans}" font-weight="700" font-size="19" fill="${BRAND.deepPlum}">Eco Kraft Packaging Box</text>
          </g>

          <!-- Delivery Stamp -->
          <g transform="translate(0, 465)">
            <rect width="385" height="95" rx="18" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1.5"/>
            <text x="25" y="38" font-family="${FONT.sans}" font-weight="800" font-size="18" fill="#14532D">🚚 CASH ON DELIVERY NATIONWIDE</text>
            <text x="25" y="68" font-family="${FONT.sans}" font-weight="600" font-size="15" fill="#166534">Karachi, Lahore, Islamabad &amp; all cities 🇵🇰</text>
          </g>
        </g>

        <!-- Right Image Column (Section 1 asset) -->
        <g clip-path="url(#p10Clip)">
          <image href="${photoB64}" x="480" y="40" width="460" height="710" preserveAspectRatio="xMidYMid slice"/>
        </g>
        <rect x="490" y="40" width="430" height="710" rx="28" ry="28" fill="none" stroke="${BRAND.borderLight}" stroke-width="2"/>
      </g>

      <!-- Bottom Order Button -->
      <g transform="translate(60, 1065)" filter="url(#softShadow)">
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
  console.log('Generating Sayuri-grade visual-first creatives for Girlies Glow...');

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

  console.log(`✓ All 10 visual-first creatives generated in ${GENERATED_DIR}`);
  return results;
}

if (process.argv[1] && process.argv[1].endsWith('generate_creatives.js')) {
  generateAllCreatives();
}
