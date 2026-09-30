import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// --- Brand Guidelines & Color System ---
export const BRAND = {
  purple: '#683DA9',       // Primary Wordmark Purple
  lightOrchid: '#9B60E0',  // Light Orchid Accent
  amethyst: '#8A54CC',     // Amethyst Accent
  deepPlum: '#5E389D',     // Deep Plum
  darkPlumBg: '#180B28',   // Luxury Dark Plum for Reel covers
  darkPlumCard: '#2B1245', // Card background for dark themes
  leafGreen: '#65AA3F',    // Leaf Green Accent for COD / Eco badges
  softLavender: '#F7F2FC', // Light lavender background
  creamBg: '#FDFBFE',      // Off-white cream background
  white: '#FFFFFF',
  goldStar: '#FFB800',
  darkText: '#23103A',
  mutedText: '#6D5B85',
  cardBorder: 'rgba(104, 61, 169, 0.12)',
  wheatBase: '#F6EFEB',
  wheatShade: '#E8DEC8',
  wheatSpeckle: '#BFA88F'
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

// Shared SVG Definitions (Gradients, Dropshadows, Vector Styles)
function getSvgDefs() {
  return `
    <defs>
      <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${BRAND.purple}"/>
        <stop offset="100%" stop-color="${BRAND.lightOrchid}"/>
      </linearGradient>
      <linearGradient id="darkPlumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${BRAND.darkPlumBg}"/>
        <stop offset="50%" stop-color="#281142"/>
        <stop offset="100%" stop-color="#140620"/>
      </linearGradient>
      <linearGradient id="lightBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FAF6FE"/>
        <stop offset="50%" stop-color="#F3E9FC"/>
        <stop offset="100%" stop-color="#EDE0F8"/>
      </linearGradient>
      <linearGradient id="glassCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(255, 255, 255, 0.95)"/>
        <stop offset="100%" stop-color="rgba(255, 255, 255, 0.85)"/>
      </linearGradient>
      <linearGradient id="darkGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(45, 20, 72, 0.95)"/>
        <stop offset="100%" stop-color="rgba(25, 10, 42, 0.90)"/>
      </linearGradient>
      <linearGradient id="greenAccentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${BRAND.leafGreen}"/>
        <stop offset="100%" stop-color="#78C64C"/>
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFD700"/>
        <stop offset="100%" stop-color="#FFA500"/>
      </linearGradient>
      <linearGradient id="razorHandleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FAF4EE"/>
        <stop offset="40%" stop-color="#EFE6DA"/>
        <stop offset="100%" stop-color="#DFD2C0"/>
      </linearGradient>
      <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#E8ECF2"/>
        <stop offset="50%" stop-color="#CAD3E0"/>
        <stop offset="100%" stop-color="#9BA5B5"/>
      </linearGradient>
      <filter id="softShadow" x="-10%" y="-10%" width="125%" height="130%">
        <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#280C42" flood-opacity="0.10"/>
      </filter>
      <filter id="cardShadow" x="-10%" y="-10%" width="125%" height="130%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#280C42" flood-opacity="0.08"/>
      </filter>
      <filter id="pillShadow" x="-10%" y="-20%" width="120%" height="150%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#210C35" flood-opacity="0.16"/>
      </filter>
      <filter id="glowPurple" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="20" flood-color="${BRAND.lightOrchid}" flood-opacity="0.4"/>
      </filter>
    </defs>
  `;
}

// Draw a realistic, elegant vector graphic of the Girlies Glow Wheat-Straw Curved Razor
function drawVectorRazor(x = 0, y = 0, scale = 1, rotation = 0) {
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation}) scale(${scale})" filter="url(#cardShadow)">
      <!-- Razor Head Connection -->
      <path d="M 120 40 L 145 10 L 235 30 L 210 65 Z" fill="#D6C7B2"/>
      
      <!-- Stainless Steel Micro-Guard Blade -->
      <g>
        <path d="M 140 12 L 230 32 L 225 48 L 135 28 Z" fill="url(#bladeGrad)" stroke="#8A96A6" stroke-width="1.5"/>
        <!-- Safety Micro-Guard Ribs -->
        <line x1="145" y1="14" x2="142" y2="28" stroke="#718096" stroke-width="2"/>
        <line x1="160" y1="17" x2="157" y2="31" stroke="#718096" stroke-width="2"/>
        <line x1="175" y1="20" x2="172" y2="34" stroke="#718096" stroke-width="2"/>
        <line x1="190" y1="23" x2="187" y2="37" stroke="#718096" stroke-width="2"/>
        <line x1="205" y1="26" x2="202" y2="40" stroke="#718096" stroke-width="2"/>
        <line x1="220" y1="29" x2="217" y2="43" stroke="#718096" stroke-width="2"/>
      </g>

      <!-- Ergonomic Curved Wheat-Straw Handle -->
      <path d="M 130 45 C 90 90, 75 180, 85 280 C 95 380, 130 460, 115 540 C 105 590, 80 620, 60 635 C 50 630, 45 615, 52 590 C 65 520, 45 420, 35 320 C 25 210, 40 120, 105 40 Z" 
            fill="url(#razorHandleGrad)" stroke="#CEBDA5" stroke-width="2"/>

      <!-- Ergonomic Thumb Rest Indentation (matching authentic product) -->
      <ellipse cx="68" cy="480" rx="14" ry="42" fill="#E6D7C2" stroke="#D3C3AD" stroke-width="1.5"/>

      <!-- Organic Wheat-Straw Speckles (Cream handle with natural beige/brown flecks) -->
      <circle cx="85" cy="110" r="2.5" fill="${BRAND.wheatSpeckle}" opacity="0.8"/>
      <circle cx="95" cy="130" r="3" fill="#A88F76" opacity="0.9"/>
      <circle cx="70" cy="160" r="2" fill="${BRAND.wheatSpeckle}" opacity="0.8"/>
      <circle cx="78" cy="210" r="3.5" fill="#9C8269" opacity="0.85"/>
      <circle cx="65" cy="260" r="2.5" fill="${BRAND.wheatSpeckle}" opacity="0.75"/>
      <circle cx="85" cy="300" r="3" fill="#9C8269" opacity="0.8"/>
      <circle cx="75" cy="350" r="2" fill="${BRAND.wheatSpeckle}" opacity="0.8"/>
      <circle cx="95" cy="400" r="3" fill="#A88F76" opacity="0.9"/>
      <circle cx="88" cy="450" r="2.5" fill="${BRAND.wheatSpeckle}" opacity="0.85"/>
      <circle cx="105" cy="500" r="3" fill="#9C8269" opacity="0.8"/>
      <circle cx="90" cy="540" r="2" fill="${BRAND.wheatSpeckle}" opacity="0.75"/>
      <circle cx="75" cy="580" r="2.5" fill="#A88F76" opacity="0.85"/>

      <!-- Subtle Brand Wordmark on Handle -->
      <text x="80" y="380" font-family="-apple-system, sans-serif" font-weight="700" font-size="11" fill="#8C7762" letter-spacing="3" transform="rotate(78 80 380)">GIRLIES GLOW</text>
    </g>
  `;
}

// Draw 5 Gold Review Stars
function drawGoldStars(x, y, size = 32, gap = 42) {
  let stars = '';
  for (let i = 0; i < 5; i++) {
    const cx = x + i * gap;
    stars += `
      <polygon points="${cx},${y - size/2} ${cx + size*0.2},${y - size*0.1} ${cx + size*0.5},${y - size*0.1} ${cx + size*0.25},${y + size*0.1} ${cx + size*0.35},${y + size*0.45} ${cx},${y + size*0.25} ${cx - size*0.35},${y + size*0.45} ${cx - size*0.25},${y + size*0.1} ${cx - size*0.5},${y - size*0.1} ${cx - size*0.2},${y - size*0.1}" fill="url(#goldGrad)"/>
    `;
  }
  return stars;
}

// Brand Header (Logo + Category Pill)
function drawHeader(logoB64, categoryText = 'DERMAPLANING 101', darkTheme = false) {
  const pillBg = darkTheme ? BRAND.lightOrchid : BRAND.purple;
  const pillText = BRAND.white;
  return `
    <image href="${logoB64}" x="70" y="55" width="240" height="85" preserveAspectRatio="xMidYMid meet"/>
    <g transform="translate(680, 70)">
      <rect width="330" height="52" rx="26" fill="${pillBg}" filter="url(#pillShadow)"/>
      <text x="165" y="33" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="18" fill="${pillText}" text-anchor="middle" letter-spacing="1.5">${escapeXml(categoryText)}</text>
    </g>
  `;
}

// Bottom Conversion & Pricing Bar (Rs. 599 + COD Across Pakistan)
function drawBottomPricingBar(y = 1200, darkTheme = false) {
  const cardBg = darkTheme ? 'rgba(35, 15, 55, 0.95)' : BRAND.white;
  const cardStroke = darkTheme ? 'rgba(155, 96, 224, 0.4)' : BRAND.cardBorder;
  const titleColor = darkTheme ? BRAND.white : BRAND.purple;
  const subColor = darkTheme ? '#D3C2E8' : BRAND.mutedText;

  return `
    <g transform="translate(70, ${y})" filter="url(#softShadow)">
      <rect width="940" height="95" rx="28" fill="${cardBg}" stroke="${cardStroke}" stroke-width="2"/>
      
      <text x="40" y="44" font-family="-apple-system, sans-serif" font-weight="800" font-size="26" fill="${titleColor}">Girlies Glow At-Home Facial Razor</text>
      <text x="40" y="74" font-family="-apple-system, sans-serif" font-weight="600" font-size="18" fill="${subColor}">Eco Wheat-Straw Handle • Stainless Micro-Guard Blade</text>

      <g transform="translate(560, 18)">
        <rect width="345" height="60" rx="30" fill="url(#greenAccentGrad)" filter="url(#pillShadow)"/>
        <text x="172" y="38" font-family="-apple-system, sans-serif" font-weight="900" font-size="22" fill="${BRAND.white}" text-anchor="middle" letter-spacing="0.5">Rs. 599 • COD NATIONWIDE 🇵🇰</text>
      </g>
    </g>
  `;
}

// ==========================================
// CANVA-QUALITY DESIGNED POST CREATIVES
// ==========================================

// Post 1: Myth Buster (Static 4:5, 1080x1350)
export function renderPost1(outputPath = path.join(GENERATED_DIR, 'post_1_static.png')) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>

      <!-- Ambient Glow Spheres -->
      <circle cx="950" cy="180" r="280" fill="${BRAND.lightOrchid}" opacity="0.15"/>
      <circle cx="100" cy="1150" r="250" fill="${BRAND.purple}" opacity="0.12"/>

      ${drawHeader(logoB64, 'REAL TALK • MYTH BUSTED', false)}

      <!-- Hook Headline -->
      <text x="70" y="195" font-family="-apple-system, sans-serif" font-weight="800" font-size="46" fill="${BRAND.darkText}" letter-spacing="-0.5">“Facial shave karne se baal</text>
      <text x="70" y="250" font-family="-apple-system, sans-serif" font-weight="800" font-size="46" fill="${BRAND.darkText}" letter-spacing="-0.5">motay ho jayenge?” 👀</text>

      <g transform="translate(70, 275)">
        <rect width="360" height="52" rx="26" fill="${BRAND.purple}" filter="url(#pillShadow)"/>
        <text x="180" y="34" font-family="-apple-system, sans-serif" font-weight="800" font-size="22" fill="${BRAND.white}" text-anchor="middle">NOPE. 100% A MYTH! 💜</text>
      </g>

      <!-- Center Split Comparison Cards (Canva D2C Aesthetic) -->
      <!-- Myth Card (Left) -->
      <g transform="translate(70, 360)" filter="url(#softShadow)">
        <rect width="450" height="490" rx="32" fill="#FFF2F4" stroke="#FECDD3" stroke-width="2.5"/>
        <rect x="30" y="30" width="140" height="44" rx="22" fill="#E11D48"/>
        <text x="100" y="59" font-family="-apple-system, sans-serif" font-weight="800" font-size="20" fill="${BRAND.white}" text-anchor="middle">THE MYTH ❌</text>
        
        <text x="35" y="130" font-family="-apple-system, sans-serif" font-weight="800" font-size="28" fill="#881337">“Baal mardana</text>
        <text x="35" y="165" font-family="-apple-system, sans-serif" font-weight="800" font-size="28" fill="#881337">jaise aayenge”</text>

        <!-- Separate lines for zero overflow -->
        <text x="35" y="225" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="#9F1239">• “Skin dark aur rough ho jayegi”</text>
        <text x="35" y="265" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="#9F1239">• “Daily shave karna padega”</text>
        <text x="35" y="305" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="#9F1239">• “Beard jaisi chubhan hogi”</text>

        <rect x="25" y="360" width="400" height="95" rx="18" fill="#FFE4E6"/>
        <text x="40" y="400" font-family="-apple-system, sans-serif" font-weight="800" font-size="18" fill="#9F1239">Dermatology Fact:</text>
        <text x="40" y="430" font-family="-apple-system, sans-serif" font-weight="600" font-size="16" fill="#881337">Shaving never alters hair root or follicle genes!</text>
      </g>

      <!-- Fact Card (Right) -->
      <g transform="translate(560, 360)" filter="url(#softShadow)">
        <rect width="450" height="490" rx="32" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="2.5"/>
        <rect x="30" y="30" width="140" height="44" rx="22" fill="${BRAND.leafGreen}"/>
        <text x="100" y="59" font-family="-apple-system, sans-serif" font-weight="800" font-size="20" fill="${BRAND.white}" text-anchor="middle">THE FACT ✓</text>
        
        <text x="35" y="130" font-family="-apple-system, sans-serif" font-weight="800" font-size="28" fill="#14532D">Peach Fuzz is</text>
        <text x="35" y="165" font-family="-apple-system, sans-serif" font-weight="800" font-size="28" fill="#14532D">just Vellus Hair ✨</text>

        <!-- Separate lines for zero overflow -->
        <text x="35" y="225" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="#166534">• Hair follicles stay identical</text>
        <text x="35" y="265" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="#166534">• Exfoliates dead skin cells</text>
        <text x="35" y="305" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="#166534">• Makeup glides butter-smooth</text>

        <rect x="25" y="360" width="400" height="95" rx="18" fill="#DCFCE7"/>
        <text x="40" y="400" font-family="-apple-system, sans-serif" font-weight="800" font-size="18" fill="#166534">Natural Soft Regrowth:</text>
        <text x="40" y="430" font-family="-apple-system, sans-serif" font-weight="600" font-size="16" fill="#14532D">Hair regrows with fine natural tip, never thicker!</text>
      </g>

      <!-- Product Feature Showcase Bar with Dedicated Podium on Right -->
      <g transform="translate(70, 880)" filter="url(#softShadow)">
        <rect width="940" height="280" rx="32" fill="${BRAND.white}" stroke="${BRAND.cardBorder}" stroke-width="2"/>
        
        <text x="45" y="55" font-family="-apple-system, sans-serif" font-weight="800" font-size="30" fill="${BRAND.purple}">Why Girlies Glow Razor Is Safe:</text>

        <g transform="translate(45, 80)">
          <!-- Point 1 -->
          <circle cx="16" cy="22" r="14" fill="${BRAND.lightOrchid}"/>
          <text x="16" y="28" font-family="-apple-system, sans-serif" font-weight="800" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
          <text x="42" y="22" font-family="-apple-system, sans-serif" font-weight="700" font-size="20" fill="${BRAND.darkText}">Micro-Guard Safety Mesh</text>
          <text x="42" y="44" font-family="-apple-system, sans-serif" font-weight="500" font-size="16" fill="${BRAND.mutedText}">Protective stainless teeth prevent cuts, nicks and irritation.</text>

          <!-- Point 2 -->
          <circle cx="16" cy="82" r="14" fill="${BRAND.lightOrchid}"/>
          <text x="16" y="88" font-family="-apple-system, sans-serif" font-weight="800" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
          <text x="42" y="82" font-family="-apple-system, sans-serif" font-weight="700" font-size="20" fill="${BRAND.darkText}">Eco Wheat-Straw Handle</text>
          <text x="42" y="104" font-family="-apple-system, sans-serif" font-weight="500" font-size="16" fill="${BRAND.mutedText}">Curved ergonomic grip designed for controlled 45° angles.</text>

          <!-- Point 3 -->
          <circle cx="16" cy="142" r="14" fill="${BRAND.lightOrchid}"/>
          <text x="16" y="148" font-family="-apple-system, sans-serif" font-weight="800" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
          <text x="42" y="142" font-family="-apple-system, sans-serif" font-weight="700" font-size="20" fill="${BRAND.darkText}">Gentle At-Home Glow</text>
          <text x="42" y="164" font-family="-apple-system, sans-serif" font-weight="500" font-size="16" fill="${BRAND.mutedText}">Takes just 2 minutes once every 3–4 weeks for instant glow.</text>
        </g>

        <!-- Right Side Dedicated Product Podium (NO overlap!) -->
        <g transform="translate(700, 25)">
          <rect width="200" height="230" rx="24" fill="#FAF6FE" stroke="#E9DDF5" stroke-width="1.5"/>
          ${drawVectorRazor(25, -5, 0.35, 0)}
          <rect x="25" y="185" width="150" height="30" rx="15" fill="${BRAND.softLavender}"/>
          <text x="100" y="205" font-family="-apple-system, sans-serif" font-weight="800" font-size="12" fill="${BRAND.purple}" text-anchor="middle" letter-spacing="1">100% SAFE</text>
        </g>
      </g>

      ${drawBottomPricingBar(1200, false)}
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

  // Copy reference video/GIF if exists
  const refGif = path.join(ROOT_DIR, 'WhatsApp GIF 2026-09-11 at 00.01.06.gif');
  if (fs.existsSync(refGif)) {
    fs.copyFileSync(refGif, reelMp4Path);
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      ${getSvgDefs()}
      <rect width="1080" height="1920" fill="url(#darkPlumGrad)"/>

      <!-- Ambient Glow Orbs -->
      <circle cx="950" cy="300" r="400" fill="${BRAND.purple}" opacity="0.35" filter="url(#glowPurple)"/>
      <circle cx="150" cy="1400" r="350" fill="${BRAND.lightOrchid}" opacity="0.25"/>

      ${drawHeader(logoB64, 'AT-HOME MASTERCLASS ✨', true)}

      <!-- Hook Headline -->
      <text x="80" y="240" font-family="-apple-system, sans-serif" font-weight="800" font-size="52" fill="${BRAND.white}">Face Shave Karne Ka</text>
      <text x="80" y="305" font-family="-apple-system, sans-serif" font-weight="800" font-size="52" fill="${BRAND.white}">Sahi Tareeqa 🌸</text>
      
      <g transform="translate(80, 340)">
        <rect width="400" height="54" rx="27" fill="${BRAND.lightOrchid}"/>
        <text x="200" y="35" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="${BRAND.white}" text-anchor="middle">3 EASY STEPS TO GLOW</text>
      </g>

      <!-- Step Cards (Graphic Beauty Walkthrough) -->
      <!-- Step 1 -->
      <g transform="translate(80, 440)" filter="url(#softShadow)">
        <rect width="920" height="240" rx="32" fill="url(#darkGlassGrad)" stroke="rgba(155, 96, 224, 0.4)" stroke-width="2"/>
        
        <rect x="40" y="35" width="70" height="70" rx="20" fill="${BRAND.purple}"/>
        <text x="75" y="80" font-family="-apple-system, sans-serif" font-weight="900" font-size="32" fill="${BRAND.white}" text-anchor="middle">01</text>
        
        <text x="140" y="70" font-family="-apple-system, sans-serif" font-weight="800" font-size="32" fill="${BRAND.white}">PREP YOUR SKIN 🧴</text>
        <text x="140" y="110" font-family="-apple-system, sans-serif" font-weight="600" font-size="22" fill="#E4D6F7">Never shave dry! Wash your face &amp; apply light squalane oil</text>
        <text x="140" y="145" font-family="-apple-system, sans-serif" font-weight="500" font-size="20" fill="#B39DC9">or aloe vera gel so the blade glides effortlessly with zero friction.</text>
      </g>

      <!-- Step 2 -->
      <g transform="translate(80, 720)" filter="url(#softShadow)">
        <rect width="920" height="240" rx="32" fill="url(#darkGlassGrad)" stroke="rgba(155, 96, 224, 0.4)" stroke-width="2"/>
        
        <rect x="40" y="35" width="70" height="70" rx="20" fill="${BRAND.lightOrchid}"/>
        <text x="75" y="80" font-family="-apple-system, sans-serif" font-weight="900" font-size="32" fill="${BRAND.white}" text-anchor="middle">02</text>
        
        <text x="140" y="70" font-family="-apple-system, sans-serif" font-weight="800" font-size="32" fill="${BRAND.white}">HOLD AT A 45° ANGLE 📐</text>
        <text x="140" y="110" font-family="-apple-system, sans-serif" font-weight="600" font-size="22" fill="#E4D6F7">Hold skin taut with one hand. Use light, short downward strokes.</text>
        <text x="140" y="145" font-family="-apple-system, sans-serif" font-weight="500" font-size="20" fill="#B39DC9">Never press hard! The micro-guard blade does all the work for you.</text>
      </g>

      <!-- Step 3 -->
      <g transform="translate(80, 1000)" filter="url(#softShadow)">
        <rect width="920" height="240" rx="32" fill="url(#darkGlassGrad)" stroke="rgba(155, 96, 224, 0.4)" stroke-width="2"/>
        
        <rect x="40" y="35" width="70" height="70" rx="20" fill="${BRAND.leafGreen}"/>
        <text x="75" y="80" font-family="-apple-system, sans-serif" font-weight="900" font-size="32" fill="${BRAND.white}" text-anchor="middle">03</text>
        
        <text x="140" y="70" font-family="-apple-system, sans-serif" font-weight="800" font-size="32" fill="${BRAND.white}">SOOTHE &amp; HYDRATE 💧</text>
        <text x="140" y="110" font-family="-apple-system, sans-serif" font-weight="600" font-size="22" fill="#E4D6F7">Rinse gently with cool water. Pat dry &amp; apply gentle barrier cream.</text>
        <text x="140" y="145" font-family="-apple-system, sans-serif" font-weight="500" font-size="20" fill="#B39DC9">Avoid retinol, AHA/BHA exfoliants, or heavy makeup for 24 hours.</text>
      </g>

      <!-- Hero Razor Visual Center Showcase -->
      <g transform="translate(80, 1280)" filter="url(#softShadow)">
        <rect width="920" height="340" rx="36" fill="${BRAND.white}"/>
        
        <text x="50" y="65" font-family="-apple-system, sans-serif" font-weight="900" font-size="36" fill="${BRAND.purple}">Engineered For Sensitive Skin</text>
        <text x="50" y="105" font-family="-apple-system, sans-serif" font-weight="600" font-size="22" fill="${BRAND.darkText}">No parlour appointments. No painful waxing redness. Just smooth glass skin.</text>

        <!-- Bullet Highlights -->
        <g transform="translate(50, 140)">
          <text x="0" y="24" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.purple}">🌿 Eco Wheat-Straw Grip</text>
          <text x="0" y="60" font-family="-apple-system, sans-serif" font-weight="500" font-size="18" fill="${BRAND.mutedText}">Biodegradable, non-slip curve</text>

          <text x="310" y="24" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.purple}">🛡️ Micro-Guard Blade</text>
          <text x="310" y="60" font-family="-apple-system, sans-serif" font-weight="500" font-size="18" fill="${BRAND.mutedText}">Guaranteed cut-free glide</text>

          <text x="610" y="24" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.purple}">✨ Butter Smooth</text>
          <text x="610" y="60" font-family="-apple-system, sans-serif" font-weight="500" font-size="18" fill="${BRAND.mutedText}">Foundation blends seamlessly</text>
        </g>
      </g>

      <!-- Bottom Terms & Order Pill -->
      <g transform="translate(80, 1660)">
        <rect width="920" height="150" rx="36" fill="url(#greenAccentGrad)" filter="url(#softShadow)"/>
        <text x="460" y="65" font-family="-apple-system, sans-serif" font-weight="900" font-size="38" fill="${BRAND.white}" text-anchor="middle">ONLY Rs. 599 | CASH ON DELIVERY 🇵🇰</text>
        <text x="460" y="105" font-family="-apple-system, sans-serif" font-weight="700" font-size="24" fill="${BRAND.white}" text-anchor="middle">Delivered to your doorstep anywhere in Pakistan</text>
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

  // Slide 1: Hook
  const svg1 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      <circle cx="950" cy="200" r="300" fill="${BRAND.lightOrchid}" opacity="0.15"/>
      ${drawHeader(logoB64, 'SWIPE TO LEARN 👉', false)}

      <text x="70" y="210" font-family="-apple-system, sans-serif" font-weight="800" font-size="48" fill="${BRAND.darkText}">Why isn't your foundation</text>
      <text x="70" y="268" font-family="-apple-system, sans-serif" font-weight="800" font-size="48" fill="${BRAND.darkText}">sitting smooth? 👀</text>
      
      <g transform="translate(70, 310)">
        <rect width="450" height="52" rx="26" fill="${BRAND.purple}"/>
        <text x="225" y="34" font-family="-apple-system, sans-serif" font-weight="800" font-size="22" fill="${BRAND.white}" text-anchor="middle">IT’S NOT YOUR SKINCARE! 💄</text>
      </g>

      <!-- Center Comparison Cards -->
      <g transform="translate(70, 400)" filter="url(#softShadow)">
        <rect width="940" height="680" rx="36" fill="${BRAND.white}" stroke="${BRAND.cardBorder}" stroke-width="2"/>
        
        <!-- Left Side: Cakey Base -->
        <g transform="translate(60, 60)">
          <rect width="380" height="420" rx="28" fill="#FFF5F5" stroke="#FED7D7" stroke-width="2"/>
          <text x="35" y="60" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="#C53030">Without Dermaplaning ❌</text>
          <text x="35" y="125" font-family="-apple-system, sans-serif" font-weight="600" font-size="19" fill="#742A2A">• Foundation clings to peach fuzz</text>
          <text x="35" y="175" font-family="-apple-system, sans-serif" font-weight="600" font-size="19" fill="#742A2A">• Powder turns patchy in sunlight</text>
          <text x="35" y="225" font-family="-apple-system, sans-serif" font-weight="600" font-size="19" fill="#742A2A">• Looks textured &amp; heavy</text>
          <text x="35" y="275" font-family="-apple-system, sans-serif" font-weight="600" font-size="19" fill="#742A2A">• Absorbs 2x more makeup</text>
          
          <rect x="25" y="330" width="330" height="60" rx="16" fill="#FEE2E2"/>
          <text x="190" y="367" font-family="-apple-system, sans-serif" font-weight="700" font-size="17" fill="#991B1B" text-anchor="middle">Heavy, textured cakey look</text>
        </g>

        <!-- Right Side: Butter Smooth -->
        <g transform="translate(500, 60)">
          <rect width="380" height="420" rx="28" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="2"/>
          <text x="35" y="60" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="#22543D">With Girlies Glow ✨</text>
          <text x="35" y="125" font-family="-apple-system, sans-serif" font-weight="600" font-size="19" fill="#166534">• Glides like butter on skin</text>
          <text x="35" y="175" font-family="-apple-system, sans-serif" font-weight="600" font-size="19" fill="#166534">• Zero cakey patches</text>
          <text x="35" y="225" font-family="-apple-system, sans-serif" font-weight="600" font-size="19" fill="#166534">• Natural filter glow in daylight</text>
          <text x="35" y="275" font-family="-apple-system, sans-serif" font-weight="600" font-size="19" fill="#166534">• Needs 50% less product</text>

          <rect x="25" y="330" width="330" height="60" rx="16" fill="#DCFCE7"/>
          <text x="190" y="367" font-family="-apple-system, sans-serif" font-weight="700" font-size="17" fill="#15803D" text-anchor="middle">Seamless, glass skin finish</text>
        </g>

        <!-- Bottom swipe prompt -->
        <g transform="translate(60, 520)">
          <rect width="820" height="90" rx="24" fill="${BRAND.softLavender}"/>
          <text x="410" y="55" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="${BRAND.purple}" text-anchor="middle">Swipe left to see why peach fuzz affects your base 👉</text>
        </g>
      </g>

      ${drawBottomPricingBar(1180, false)}
    </svg>
  `;

  // Slide 2: The Science
  const svg2 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      ${drawHeader(logoB64, 'THE CULPRIT: PEACH FUZZ 🔍', false)}

      <text x="70" y="210" font-family="-apple-system, sans-serif" font-weight="800" font-size="46" fill="${BRAND.darkText}">Peach fuzz traps foundation</text>
      <text x="70" y="265" font-family="-apple-system, sans-serif" font-weight="800" font-size="46" fill="${BRAND.darkText}">and powder like a filter 🧽</text>

      <g transform="translate(70, 340)" filter="url(#softShadow)">
        <rect width="940" height="740" rx="36" fill="${BRAND.white}"/>
        
        <!-- Explanation Steps -->
        <g transform="translate(60, 60)">
          <!-- Pillar 1 -->
          <circle cx="35" cy="40" r="28" fill="${BRAND.purple}"/>
          <text x="35" y="49" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="${BRAND.white}" text-anchor="middle">1</text>
          <text x="85" y="38" font-family="-apple-system, sans-serif" font-weight="800" font-size="28" fill="${BRAND.darkText}">Tiny hairs prevent flat contact</text>
          <text x="85" y="72" font-family="-apple-system, sans-serif" font-weight="500" font-size="20" fill="${BRAND.mutedText}">Foundation sits on top of fine facial hair instead of adhering to smooth skin.</text>

          <!-- Pillar 2 -->
          <circle cx="35" cy="170" r="28" fill="${BRAND.lightOrchid}"/>
          <text x="35" y="179" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="${BRAND.white}" text-anchor="middle">2</text>
          <text x="85" y="168" font-family="-apple-system, sans-serif" font-weight="800" font-size="28" fill="${BRAND.darkText}">Powder clumps in sunlight</text>
          <text x="85" y="202" font-family="-apple-system, sans-serif" font-weight="500" font-size="20" fill="${BRAND.mutedText}">Fine setting powder catches on peach fuzz, creating that dusty, dry look.</text>

          <!-- Pillar 3 -->
          <circle cx="35" cy="300" r="28" fill="${BRAND.leafGreen}"/>
          <text x="35" y="309" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="${BRAND.white}" text-anchor="middle">3</text>
          <text x="85" y="298" font-family="-apple-system, sans-serif" font-weight="800" font-size="28" fill="${BRAND.darkText}">Dead skin cells dull radiance</text>
          <text x="85" y="332" font-family="-apple-system, sans-serif" font-weight="500" font-size="20" fill="${BRAND.mutedText}">Dermaplaning removes the microscopic dead layer, revealing instant glow.</text>
        </g>

        <!-- Vector solution callout -->
        <g transform="translate(60, 480)">
          <rect width="820" height="190" rx="28" fill="${BRAND.softLavender}" stroke="${BRAND.cardBorder}" stroke-width="2"/>
          <rect x="40" y="35" width="55" height="55" rx="18" fill="${BRAND.purple}"/>
          <text x="67" y="72" font-family="-apple-system, sans-serif" font-weight="900" font-size="28" fill="${BRAND.white}" text-anchor="middle">✨</text>
          <text x="115" y="62" font-family="-apple-system, sans-serif" font-weight="800" font-size="26" fill="${BRAND.purple}">The Girlies Glow Solution:</text>
          <text x="115" y="96" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="${BRAND.darkText}">Safe micro-guarded dermaplaning in 2 minutes at home.</text>
          <text x="115" y="132" font-family="-apple-system, sans-serif" font-weight="600" font-size="18" fill="${BRAND.leafGreen}">Instant smooth canvas with zero irritation • Swipe next 👉</text>
        </g>
      </g>

      ${drawBottomPricingBar(1180, false)}
    </svg>
  `;

  // Slide 3: Razor Features
  const svg3 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      ${drawHeader(logoB64, 'THE TOOL YOU NEED 🌸', false)}

      <text x="70" y="210" font-family="-apple-system, sans-serif" font-weight="800" font-size="46" fill="${BRAND.darkText}">Remove the fuzz. Keep the glow.</text>
      <text x="70" y="265" font-family="-apple-system, sans-serif" font-weight="600" font-size="24" fill="${BRAND.mutedText}">Safe, beginner-friendly micro-guard technology ✨</text>

      <g transform="translate(70, 320)" filter="url(#softShadow)">
        <rect width="940" height="780" rx="36" fill="${BRAND.white}"/>
        
        <!-- Large Center Vector Razor -->
        <g transform="translate(380, 50)">
          ${drawVectorRazor(0, 0, 0.72, 10)}
        </g>

        <!-- Feature Pins -->
        <g transform="translate(60, 100)">
          <rect width="280" height="100" rx="20" fill="${BRAND.softLavender}" stroke="${BRAND.purple}" stroke-width="2"/>
          <text x="25" y="42" font-family="-apple-system, sans-serif" font-weight="800" font-size="20" fill="${BRAND.purple}">MICRO-GUARD BLADE</text>
          <text x="25" y="72" font-family="-apple-system, sans-serif" font-weight="500" font-size="16" fill="${BRAND.darkText}">Micro-mesh teeth protect skin</text>
        </g>

        <g transform="translate(60, 320)">
          <rect width="280" height="100" rx="20" fill="${BRAND.softLavender}" stroke="${BRAND.purple}" stroke-width="2"/>
          <text x="25" y="42" font-family="-apple-system, sans-serif" font-weight="800" font-size="20" fill="${BRAND.purple}">WHEAT-STRAW BODY</text>
          <text x="25" y="72" font-family="-apple-system, sans-serif" font-weight="500" font-size="16" fill="${BRAND.darkText}">Eco biodegradable handle</text>
        </g>

        <g transform="translate(600, 320)">
          <rect width="280" height="100" rx="20" fill="${BRAND.softLavender}" stroke="${BRAND.purple}" stroke-width="2"/>
          <text x="25" y="42" font-family="-apple-system, sans-serif" font-weight="800" font-size="20" fill="${BRAND.purple}">ERGONOMIC CURVE</text>
          <text x="25" y="72" font-family="-apple-system, sans-serif" font-weight="500" font-size="16" fill="${BRAND.darkText}">Non-slip control for angles</text>
        </g>
      </g>

      ${drawBottomPricingBar(1180, false)}
    </svg>
  `;

  // Slide 4: Offer CTA
  const svg4 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#darkPlumGrad)"/>
      <circle cx="950" cy="200" r="350" fill="${BRAND.lightOrchid}" opacity="0.3"/>
      ${drawHeader(logoB64, 'CLAIM YOUR GLOW 💜', true)}

      <text x="70" y="220" font-family="-apple-system, sans-serif" font-weight="900" font-size="52" fill="${BRAND.white}">Your Makeup Just Found</text>
      <text x="70" y="280" font-family="-apple-system, sans-serif" font-weight="900" font-size="52" fill="${BRAND.white}">Its New Best Friend ✨</text>

      <g transform="translate(70, 360)" filter="url(#softShadow)">
        <rect width="940" height="720" rx="36" fill="${BRAND.white}"/>

        <!-- 5 Star Review Badge -->
        <g transform="translate(60, 50)">
          ${drawGoldStars(30, 30, 28, 36)}
          <text x="220" y="38" font-family="-apple-system, sans-serif" font-weight="800" font-size="22" fill="${BRAND.darkText}">Over 1,000+ Happy Pakistani Girls</text>
        </g>

        <!-- Testimonial Quote -->
        <rect x="60" y="110" width="820" height="170" rx="24" fill="${BRAND.softLavender}"/>
        <text x="90" y="165" font-family="-apple-system, sans-serif" font-weight="700" font-size="24" fill="${BRAND.purple}">“Foundation glides on like pure silk. Best Rs. 599 spent!”</text>
        <text x="90" y="205" font-family="-apple-system, sans-serif" font-weight="600" font-size="18" fill="${BRAND.mutedText}">— Mahnoor R., Karachi (Verified Buyer ✓)</text>

        <!-- Guarantee Checklist -->
        <g transform="translate(60, 320)">
          <text x="0" y="30" font-family="-apple-system, sans-serif" font-weight="800" font-size="26" fill="${BRAND.darkText}">What You Get:</text>
          
          <g transform="translate(0, 55)">
            <circle cx="16" cy="16" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="22" font-family="-apple-system, sans-serif" font-weight="800" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="45" y="23" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.darkText}">Girlies Glow Curved Facial Razor with Cap</text>

            <circle cx="16" cy="65" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="71" font-family="-apple-system, sans-serif" font-weight="800" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="45" y="72" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.darkText}">Precision Micro-Guard Blade (Cut-Free)</text>

            <circle cx="16" cy="115" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="121" font-family="-apple-system, sans-serif" font-weight="800" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="45" y="122" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.darkText}">Eco Wheat-Straw Biodegradable Handle</text>

            <circle cx="16" cy="165" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="171" font-family="-apple-system, sans-serif" font-weight="800" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="45" y="172" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="${BRAND.darkText}">Fast Cash on Delivery Nationwide</text>
          </g>
        </g>
      </g>

      <!-- Giant Bottom CTA -->
      <g transform="translate(70, 1140)">
        <rect width="940" height="130" rx="36" fill="url(#greenAccentGrad)" filter="url(#softShadow)"/>
        <text x="470" y="55" font-family="-apple-system, sans-serif" font-weight="900" font-size="34" fill="${BRAND.white}" text-anchor="middle">Rs. 599 ONLY | CASH ON DELIVERY 🇵🇰</text>
        <text x="470" y="95" font-family="-apple-system, sans-serif" font-weight="800" font-size="22" fill="${BRAND.white}" text-anchor="middle">DM @girli_esglow TO ORDER NOW</text>
      </g>
    </svg>
  `;

  renderSvgToPng(svg1, path.join(outputDir, 'post_3_slide_1.png'));
  renderSvgToPng(svg2, path.join(outputDir, 'post_3_slide_2.png'));
  renderSvgToPng(svg3, path.join(outputDir, 'post_3_slide_3.png'));
  renderSvgToPng(svg4, path.join(outputDir, 'post_3_slide_4.png'));
  return path.join(outputDir, 'post_3_slide_1.png');
}

// Post 4: Salon vs. Home (Static 4:5, 1080x1350)
export function renderPost4(outputPath = path.join(GENERATED_DIR, 'post_4_static.png')) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      ${drawHeader(logoB64, 'MONEY SAVER BEAUTY HACK 💰', false)}

      <text x="70" y="200" font-family="-apple-system, sans-serif" font-weight="900" font-size="46" fill="${BRAND.darkText}">Parlour jaane ka mood nahi? 💅</text>
      <text x="70" y="255" font-family="-apple-system, sans-serif" font-weight="900" font-size="46" fill="${BRAND.darkText}">Save Rs. 25,000+ a year!</text>

      <!-- Side-by-Side Comparison Grid -->
      <!-- Salon Waxing Column -->
      <g transform="translate(70, 320)" filter="url(#softShadow)">
        <rect width="450" height="820" rx="36" fill="#FFF5F5" stroke="#FED7D7" stroke-width="2.5"/>
        
        <rect x="40" y="40" width="220" height="50" rx="25" fill="#E11D48"/>
        <text x="150" y="72" font-family="-apple-system, sans-serif" font-weight="800" font-size="20" fill="${BRAND.white}" text-anchor="middle">PARLOUR WAXING 😫</text>

        <text x="40" y="150" font-family="-apple-system, sans-serif" font-weight="900" font-size="38" fill="#991B1B">Rs. 2,500/mo</text>
        <text x="40" y="185" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="#7F1D1D">Over Rs. 30,000 every single year!</text>

        <g transform="translate(40, 240)">
          <text x="0" y="30" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="#7F1D1D">❌ 1–2 hours traffic &amp; waiting</text>
          <text x="0" y="90" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="#7F1D1D">❌ Painful waxing tears &amp; redness</text>
          <text x="0" y="150" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="#7F1D1D">❌ Potential bacterial breakout</text>
          <text x="0" y="210" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="#7F1D1D">❌ Hard to fit into busy schedule</text>
          <text x="0" y="270" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="#7F1D1D">❌ Constant recurring salon bills</text>
        </g>
      </g>

      <!-- Girlies Glow Column -->
      <g transform="translate(560, 320)" filter="url(#softShadow)">
        <rect width="450" height="820" rx="36" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="2.5"/>
        
        <rect x="40" y="40" width="220" height="50" rx="25" fill="${BRAND.leafGreen}"/>
        <text x="150" y="72" font-family="-apple-system, sans-serif" font-weight="800" font-size="20" fill="${BRAND.white}" text-anchor="middle">GIRLIES GLOW ✨</text>

        <text x="40" y="150" font-family="-apple-system, sans-serif" font-weight="900" font-size="38" fill="#166534">Rs. 599 ONLY</text>
        <text x="40" y="185" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="#14532D">One-time purchase • Lasts months!</text>

        <g transform="translate(40, 240)">
          <text x="0" y="30" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="#14532D">✓ 2 minutes in your own bedroom</text>
          <text x="0" y="90" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="#14532D">✓ 100% Painless micro-guard blade</text>
          <text x="0" y="150" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="#14532D">✓ Zero cuts &amp; zero redness</text>
          <text x="0" y="210" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="#14532D">✓ Do it anytime before events/weddings</text>
          <text x="0" y="270" font-family="-apple-system, sans-serif" font-weight="700" font-size="22" fill="#14532D">✓ Eco wheat-straw sustainable body</text>
        </g>

        <!-- Savings proof badge -->
        <g transform="translate(40, 580)">
          <rect width="370" height="180" rx="24" fill="${BRAND.white}" stroke="#BBF7D0" stroke-width="2"/>
          <rect x="25" y="25" width="160" height="34" rx="17" fill="#DCFCE7"/>
          <text x="105" y="48" font-family="-apple-system, sans-serif" font-weight="800" font-size="15" fill="#15803D" text-anchor="middle">ANNUAL SAVING</text>
          <text x="25" y="105" font-family="-apple-system, sans-serif" font-weight="900" font-size="36" fill="${BRAND.leafGreen}">Rs. 29,400+</text>
          <text x="25" y="140" font-family="-apple-system, sans-serif" font-weight="700" font-size="18" fill="${BRAND.purple}">Saved on parlour visits!</text>
        </g>
      </g>

      ${drawBottomPricingBar(1180, false)}
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
  const refGif = path.join(ROOT_DIR, 'WhatsApp GIF 2026-09-11 at 00.01.14.gif');
  if (fs.existsSync(refGif)) fs.copyFileSync(refGif, reelMp4Path);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      ${getSvgDefs()}
      <rect width="1080" height="1920" fill="url(#darkPlumGrad)"/>
      <circle cx="950" cy="300" r="400" fill="${BRAND.purple}" opacity="0.35"/>
      ${drawHeader(logoB64, 'CUSTOMER LOVE 💬', true)}

      <text x="80" y="240" font-family="-apple-system, sans-serif" font-weight="900" font-size="52" fill="${BRAND.white}">“I was scared of face shaving...</text>
      <text x="80" y="305" font-family="-apple-system, sans-serif" font-weight="900" font-size="52" fill="${BRAND.white}">until I tried Girlies Glow!” ✨</text>

      <!-- Giant Luxury Testimonial Card -->
      <g transform="translate(80, 380)" filter="url(#softShadow)">
        <rect width="920" height="780" rx="36" fill="${BRAND.white}"/>

        <!-- Gold Review Stars -->
        <g transform="translate(60, 60)">
          ${drawGoldStars(30, 30, 34, 44)}
          <rect x="260" y="10" width="190" height="42" rx="21" fill="#ECFDF5"/>
          <text x="355" y="38" font-family="-apple-system, sans-serif" font-weight="800" font-size="18" fill="#047857" text-anchor="middle">VERIFIED BUYER ✓</text>
        </g>

        <!-- Quote Marks -->
        <text x="60" y="190" font-family="Georgia, serif" font-weight="900" font-size="90" fill="${BRAND.purple}" opacity="0.3">“</text>

        <!-- Quote Body with individual <text> tags for crisp rendering -->
        <text x="60" y="240" font-family="-apple-system, sans-serif" font-weight="700" font-size="32" fill="${BRAND.darkText}">“Honestly speaking, my parlour lady</text>
        <text x="60" y="295" font-family="-apple-system, sans-serif" font-weight="700" font-size="32" fill="${BRAND.darkText}">always said baal motay ho jayenge.</text>
        <text x="60" y="350" font-family="-apple-system, sans-serif" font-weight="700" font-size="32" fill="${BRAND.darkText}">Finally ordered Girlies Glow for Rs. 599.</text>
        <text x="60" y="415" font-family="-apple-system, sans-serif" font-weight="800" font-size="32" fill="${BRAND.purple}">My foundation has NEVER looked this smooth!</text>
        <text x="60" y="475" font-family="-apple-system, sans-serif" font-weight="700" font-size="32" fill="${BRAND.darkText}">Zero cuts, zero redness. Best at-home beauty</text>
        <text x="60" y="530" font-family="-apple-system, sans-serif" font-weight="700" font-size="32" fill="${BRAND.darkText}">decision I've ever made! 💜”</text>

        <!-- Customer Signature -->
        <g transform="translate(60, 620)">
          <circle cx="35" cy="35" r="35" fill="${BRAND.softLavender}"/>
          <text x="35" y="46" font-family="-apple-system, sans-serif" font-weight="900" font-size="28" fill="${BRAND.purple}" text-anchor="middle">S</text>
          
          <text x="90" y="32" font-family="-apple-system, sans-serif" font-weight="800" font-size="26" fill="${BRAND.darkText}">Sana M. — Islamabad</text>
          <text x="90" y="60" font-family="-apple-system, sans-serif" font-weight="600" font-size="18" fill="${BRAND.mutedText}">Ordered via Cash on Delivery • 2 weeks ago</text>
        </g>
      </g>

      <!-- Key Benefits Card -->
      <g transform="translate(80, 1200)" filter="url(#softShadow)">
        <rect width="920" height="420" rx="36" fill="url(#darkGlassGrad)" stroke="rgba(155, 96, 224, 0.4)" stroke-width="2"/>
        
        <text x="50" y="65" font-family="-apple-system, sans-serif" font-weight="800" font-size="34" fill="${BRAND.white}">Why 10,000+ Girls Switched to Girlies Glow:</text>

        <g transform="translate(50, 110)">
          <circle cx="20" cy="20" r="16" fill="${BRAND.leafGreen}"/>
          <text x="20" y="27" font-family="-apple-system, sans-serif" font-weight="900" font-size="20" fill="${BRAND.white}" text-anchor="middle">✓</text>
          <text x="55" y="28" font-family="-apple-system, sans-serif" font-weight="700" font-size="24" fill="${BRAND.white}">Painless &amp; Gentle on Sensitive Skin</text>

          <circle cx="20" cy="90" r="16" fill="${BRAND.leafGreen}"/>
          <text x="20" y="97" font-family="-apple-system, sans-serif" font-weight="900" font-size="20" fill="${BRAND.white}" text-anchor="middle">✓</text>
          <text x="55" y="98" font-family="-apple-system, sans-serif" font-weight="700" font-size="24" fill="${BRAND.white}">Micro-Guard Stainless Steel Safety Blade</text>

          <circle cx="20" cy="160" r="16" fill="${BRAND.leafGreen}"/>
          <text x="20" y="167" font-family="-apple-system, sans-serif" font-weight="900" font-size="20" fill="${BRAND.white}" text-anchor="middle">✓</text>
          <text x="55" y="168" font-family="-apple-system, sans-serif" font-weight="700" font-size="24" fill="${BRAND.white}">Eco-Friendly Wheat-Straw Biodegradable Handle</text>

          <circle cx="20" cy="230" r="16" fill="${BRAND.leafGreen}"/>
          <text x="20" y="237" font-family="-apple-system, sans-serif" font-weight="900" font-size="20" fill="${BRAND.white}" text-anchor="middle">✓</text>
          <text x="55" y="238" font-family="-apple-system, sans-serif" font-weight="700" font-size="24" fill="${BRAND.white}">Only Rs. 599 with Cash on Delivery Across Pakistan</text>
        </g>
      </g>

      <!-- Bottom Order Pill -->
      <g transform="translate(80, 1660)">
        <rect width="920" height="150" rx="36" fill="url(#greenAccentGrad)" filter="url(#softShadow)"/>
        <text x="460" y="65" font-family="-apple-system, sans-serif" font-weight="900" font-size="38" fill="${BRAND.white}" text-anchor="middle">Rs. 599 • CASH ON DELIVERY NATIONWIDE 🇵🇰</text>
        <text x="460" y="105" font-family="-apple-system, sans-serif" font-weight="800" font-size="22" fill="${BRAND.white}" text-anchor="middle">DM @girli_esglow or link in bio to order</text>
      </g>
    </svg>
  `;

  renderSvgToPng(svg, coverPngPath);
  const altCover = path.join(GENERATED_DIR, 'post_5_cover.png');
  fs.copyFileSync(coverPngPath, altCover);
  return coverPngPath;
}

// Post 6: 5 Mistakes to Avoid (Static 4:5, 1080x1350)
export function renderPost6(outputPath = path.join(GENERATED_DIR, 'post_6_static.png')) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      ${drawHeader(logoB64, 'SKINCARE SAFETY GUIDE ⚠️', false)}

      <text x="70" y="200" font-family="-apple-system, sans-serif" font-weight="900" font-size="46" fill="${BRAND.darkText}">5 Face Shaving Mistakes</text>
      <text x="70" y="255" font-family="-apple-system, sans-serif" font-weight="900" font-size="46" fill="${BRAND.darkText}">Ruining Your Skin Barrier 🛑</text>

      <!-- 5 Cards Checklist -->
      <g transform="translate(70, 310)" filter="url(#softShadow)">
        <rect width="940" height="840" rx="36" fill="${BRAND.white}"/>

        <!-- Mistake 1 -->
        <g transform="translate(45, 45)">
          <rect width="850" height="130" rx="24" fill="#FFF5F5" stroke="#FED7D7" stroke-width="2"/>
          <circle cx="45" cy="65" r="24" fill="#E11D48"/>
          <text x="45" y="73" font-family="-apple-system, sans-serif" font-weight="900" font-size="24" fill="${BRAND.white}" text-anchor="middle">1</text>
          <text x="90" y="55" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="#991B1B">Dry Shaving Without Slip</text>
          <text x="90" y="90" font-family="-apple-system, sans-serif" font-weight="500" font-size="18" fill="#7F1D1D">Always use squalane oil, facial oil, or aloe gel. Never drag on dry skin!</text>
        </g>

        <!-- Mistake 2 -->
        <g transform="translate(45, 195)">
          <rect width="850" height="130" rx="24" fill="#FFF5F5" stroke="#FED7D7" stroke-width="2"/>
          <circle cx="45" cy="65" r="24" fill="#E11D48"/>
          <text x="45" y="73" font-family="-apple-system, sans-serif" font-weight="900" font-size="24" fill="${BRAND.white}" text-anchor="middle">2</text>
          <text x="90" y="55" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="#991B1B">Pressing Too Hard Into Skin</text>
          <text x="90" y="90" font-family="-apple-system, sans-serif" font-weight="500" font-size="18" fill="#7F1D1D">Let the blade glide with feather-light pressure. Zero force needed!</text>
        </g>

        <!-- Mistake 3 -->
        <g transform="translate(45, 345)">
          <rect width="850" height="130" rx="24" fill="#FFF5F5" stroke="#FED7D7" stroke-width="2"/>
          <circle cx="45" cy="65" r="24" fill="#E11D48"/>
          <text x="45" y="73" font-family="-apple-system, sans-serif" font-weight="900" font-size="24" fill="${BRAND.white}" text-anchor="middle">3</text>
          <text x="90" y="55" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="#991B1B">Shaving Over Active Acne / Breakouts</text>
          <text x="90" y="90" font-family="-apple-system, sans-serif" font-weight="500" font-size="18" fill="#7F1D1D">Always bypass pimples or inflamed areas to prevent spreading bacteria.</text>
        </g>

        <!-- Mistake 4 -->
        <g transform="translate(45, 495)">
          <rect width="850" height="130" rx="24" fill="#FFF5F5" stroke="#FED7D7" stroke-width="2"/>
          <circle cx="45" cy="65" r="24" fill="#E11D48"/>
          <text x="45" y="73" font-family="-apple-system, sans-serif" font-weight="900" font-size="24" fill="${BRAND.white}" text-anchor="middle">4</text>
          <text x="90" y="55" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="#991B1B">Wrong Angle (Holding Perpendicular)</text>
          <text x="90" y="90" font-family="-apple-system, sans-serif" font-weight="500" font-size="18" fill="#7F1D1D">Hold at a gentle 45-degree angle. Pull skin taut with the other hand.</text>
        </g>

        <!-- Mistake 5 -->
        <g transform="translate(45, 645)">
          <rect width="850" height="130" rx="24" fill="#FFF5F5" stroke="#FED7D7" stroke-width="2"/>
          <circle cx="45" cy="65" r="24" fill="#E11D48"/>
          <text x="45" y="73" font-family="-apple-system, sans-serif" font-weight="900" font-size="24" fill="${BRAND.white}" text-anchor="middle">5</text>
          <text x="90" y="55" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="#991B1B">Using Retinol or Actives Immediately After</text>
          <text x="90" y="90" font-family="-apple-system, sans-serif" font-weight="500" font-size="18" fill="#7F1D1D">Skin is fresh! Stick to simple ceramides, hyaluronic acid &amp; barrier cream.</text>
        </g>
      </g>

      ${drawBottomPricingBar(1180, false)}
    </svg>
  `;

  return renderSvgToPng(svg, outputPath);
}

// Post 7: GRWM Night Routine (Reel 9:16, 1080x1920)
export function renderPost7(
  coverPngPath = path.join(GENERATED_DIR, 'post_7_reel.png'),
  reelMp4Path = path.join(GENERATED_DIR, 'post_7_reel.mp4')
) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');
  const refGif = path.join(ROOT_DIR, 'WhatsApp GIF 2026-09-11 at 00.01.24.gif');
  if (fs.existsSync(refGif)) fs.copyFileSync(refGif, reelMp4Path);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      ${getSvgDefs()}
      <rect width="1080" height="1920" fill="url(#darkPlumGrad)"/>
      <circle cx="950" cy="280" r="400" fill="${BRAND.purple}" opacity="0.35"/>
      ${drawHeader(logoB64, 'NIGHT ROUTINE ✨', true)}

      <text x="80" y="240" font-family="-apple-system, sans-serif" font-weight="900" font-size="52" fill="${BRAND.white}">GRWM: Sunday Night</text>
      <text x="80" y="305" font-family="-apple-system, sans-serif" font-weight="900" font-size="52" fill="${BRAND.white}">Skin Reset Routine 🌙</text>

      <g transform="translate(80, 345)">
        <rect width="450" height="54" rx="27" fill="${BRAND.lightOrchid}"/>
        <text x="225" y="35" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="${BRAND.white}" text-anchor="middle">WAKE UP WITH GLASS SKIN ✨</text>
      </g>

      <!-- Routine Stack Cards -->
      <g transform="translate(80, 440)" filter="url(#softShadow)">
        <rect width="920" height="1140" rx="36" fill="${BRAND.white}"/>

        <!-- Step 1 -->
        <g transform="translate(50, 60)">
          <rect width="820" height="190" rx="28" fill="${BRAND.softLavender}"/>
          <rect x="30" y="30" width="60" height="60" rx="18" fill="${BRAND.purple}"/>
          <text x="60" y="70" font-family="-apple-system, sans-serif" font-weight="900" font-size="28" fill="${BRAND.white}" text-anchor="middle">1</text>
          <text x="110" y="65" font-family="-apple-system, sans-serif" font-weight="800" font-size="28" fill="${BRAND.darkText}">Double Cleanse &amp; Dry Skin</text>
          <text x="110" y="110" font-family="-apple-system, sans-serif" font-weight="500" font-size="20" fill="${BRAND.mutedText}">Wash off makeup, sunscreen, and daily pollutants. Pat skin dry.</text>
        </g>

        <!-- Step 2 -->
        <g transform="translate(50, 280)">
          <rect width="820" height="190" rx="28" fill="${BRAND.softLavender}"/>
          <rect x="30" y="30" width="60" height="60" rx="18" fill="${BRAND.lightOrchid}"/>
          <text x="60" y="70" font-family="-apple-system, sans-serif" font-weight="900" font-size="28" fill="${BRAND.white}" text-anchor="middle">2</text>
          <text x="110" y="65" font-family="-apple-system, sans-serif" font-weight="800" font-size="28" fill="${BRAND.darkText}">Apply 3 Drops Squalane / Aloe</text>
          <text x="110" y="110" font-family="-apple-system, sans-serif" font-weight="500" font-size="20" fill="${BRAND.mutedText}">Provides the perfect slick barrier so the razor glides without friction.</text>
        </g>

        <!-- Step 3 -->
        <g transform="translate(50, 500)">
          <rect width="820" height="230" rx="28" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="2"/>
          <rect x="30" y="30" width="60" height="60" rx="18" fill="${BRAND.leafGreen}"/>
          <text x="60" y="70" font-family="-apple-system, sans-serif" font-weight="900" font-size="28" fill="${BRAND.white}" text-anchor="middle">3</text>
          <text x="110" y="65" font-family="-apple-system, sans-serif" font-weight="800" font-size="28" fill="#14532D">Girlies Glow 45° Dermaplaning</text>
          <text x="110" y="105" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="#166534">Gentle downward strokes. Watch peach fuzz &amp; dead cells vanish!</text>
          <text x="110" y="140" font-family="-apple-system, sans-serif" font-weight="500" font-size="18" fill="#15803D">Micro-guard blade ensures 100% safety with zero cuts.</text>
        </g>

        <!-- Step 4 -->
        <g transform="translate(50, 760)">
          <rect width="820" height="190" rx="28" fill="${BRAND.softLavender}"/>
          <rect x="30" y="30" width="60" height="60" rx="18" fill="${BRAND.deepPlum}"/>
          <text x="60" y="70" font-family="-apple-system, sans-serif" font-weight="900" font-size="28" fill="${BRAND.white}" text-anchor="middle">4</text>
          <text x="110" y="65" font-family="-apple-system, sans-serif" font-weight="800" font-size="28" fill="${BRAND.darkText}">Hydrating Barrier Cream &amp; Sleep</text>
          <text x="110" y="110" font-family="-apple-system, sans-serif" font-weight="500" font-size="20" fill="${BRAND.mutedText}">Lock in deep moisture with ceramides. Wake up with glassy, soft skin!</text>
        </g>

        <!-- Result Banner -->
        <g transform="translate(50, 980)">
          <rect width="820" height="100" rx="20" fill="${BRAND.purple}"/>
          <text x="410" y="60" font-family="-apple-system, sans-serif" font-weight="800" font-size="26" fill="${BRAND.white}" text-anchor="middle">✨ Repeat every 3–4 weeks for constant glowing skin</text>
        </g>
      </g>

      <!-- Bottom Order Pill -->
      <g transform="translate(80, 1660)">
        <rect width="920" height="150" rx="36" fill="url(#greenAccentGrad)" filter="url(#softShadow)"/>
        <text x="460" y="65" font-family="-apple-system, sans-serif" font-weight="900" font-size="38" fill="${BRAND.white}" text-anchor="middle">ONLY Rs. 599 | CASH ON DELIVERY 🇵🇰</text>
        <text x="460" y="105" font-family="-apple-system, sans-serif" font-weight="800" font-size="22" fill="${BRAND.white}" text-anchor="middle">Order yours today • Delivered right to your doorstep</text>
      </g>
    </svg>
  `;

  renderSvgToPng(svg, coverPngPath);
  const altCover = path.join(GENERATED_DIR, 'post_7_cover.png');
  fs.copyFileSync(coverPngPath, altCover);
  return coverPngPath;
}

// Post 8: Beginner Step-by-Step Guide (Carousel 5 slides, each 1080x1350)
export function renderPost8(outputDir = GENERATED_DIR) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');

  // Slide 1
  const svg1 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      ${drawHeader(logoB64, 'BEGINNER MASTERCLASS 🌸', false)}

      <text x="70" y="210" font-family="-apple-system, sans-serif" font-weight="900" font-size="48" fill="${BRAND.darkText}">First Time Shaving Face? 👀</text>
      <text x="70" y="265" font-family="-apple-system, sans-serif" font-weight="900" font-size="48" fill="${BRAND.darkText}">Don't panic! Swipe through 👉</text>

      <g transform="translate(70, 340)" filter="url(#softShadow)">
        <rect width="940" height="740" rx="36" fill="${BRAND.white}"/>

        <!-- Centered Razor Graphic -->
        <g transform="translate(390, 30)">
          ${drawVectorRazor(0, 0, 0.68, 12)}
        </g>

        <g transform="translate(60, 500)">
          <rect width="820" height="180" rx="24" fill="${BRAND.softLavender}"/>
          <text x="40" y="60" font-family="-apple-system, sans-serif" font-weight="800" font-size="28" fill="${BRAND.purple}">The Safe &amp; Painless At-Home Guide</text>
          <text x="40" y="100" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="${BRAND.darkText}">Everything you need to know before your very first stroke.</text>
          <text x="40" y="135" font-family="-apple-system, sans-serif" font-weight="800" font-size="18" fill="${BRAND.lightOrchid}">Swipe left to start Step 1 👉</text>
        </g>
      </g>

      ${drawBottomPricingBar(1180, false)}
    </svg>
  `;

  // Slide 2: Prep
  const svg2 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      ${drawHeader(logoB64, 'STEP 1: PREP IS 80% 🧴', false)}

      <text x="70" y="210" font-family="-apple-system, sans-serif" font-weight="900" font-size="46" fill="${BRAND.darkText}">Step 1: Prep Like a Pro</text>
      <text x="70" y="265" font-family="-apple-system, sans-serif" font-weight="600" font-size="24" fill="${BRAND.mutedText}">Good skin prep prevents 99% of irritation ✨</text>

      <g transform="translate(70, 320)" filter="url(#softShadow)">
        <rect width="940" height="780" rx="36" fill="${BRAND.white}"/>
        
        <g transform="translate(60, 60)">
          <text x="0" y="40" font-family="-apple-system, sans-serif" font-weight="800" font-size="30" fill="${BRAND.purple}">The Golden Prep Rules:</text>
          
          <g transform="translate(0, 80)">
            <circle cx="20" cy="20" r="16" fill="${BRAND.purple}"/>
            <text x="20" y="27" font-family="-apple-system, sans-serif" font-weight="800" font-size="18" fill="${BRAND.white}" text-anchor="middle">1</text>
            <text x="55" y="28" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="${BRAND.darkText}">Wash face with a gentle cleanser</text>
            <text x="55" y="60" font-family="-apple-system, sans-serif" font-weight="500" font-size="18" fill="${BRAND.mutedText}">Remove makeup, excess sebum, and everyday grime.</text>

            <circle cx="20" cy="110" r="16" fill="${BRAND.lightOrchid}"/>
            <text x="20" y="117" font-family="-apple-system, sans-serif" font-weight="800" font-size="18" fill="${BRAND.white}" text-anchor="middle">2</text>
            <text x="55" y="118" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="${BRAND.darkText}">Apply 2–3 drops of light facial oil</text>
            <text x="55" y="150" font-family="-apple-system, sans-serif" font-weight="500" font-size="18" fill="${BRAND.mutedText}">Squalane or aloe vera creates smooth slip so the blade glides.</text>

            <circle cx="20" cy="200" r="16" fill="${BRAND.leafGreen}"/>
            <text x="20" y="207" font-family="-apple-system, sans-serif" font-weight="800" font-size="18" fill="${BRAND.white}" text-anchor="middle">3</text>
            <text x="55" y="208" font-family="-apple-system, sans-serif" font-weight="800" font-size="24" fill="${BRAND.darkText}">Sanitize your Girlies Glow razor blade</text>
            <text x="55" y="240" font-family="-apple-system, sans-serif" font-weight="500" font-size="18" fill="${BRAND.mutedText}">A quick wipe with rubbing alcohol keeps everything hygienic.</text>
          </g>
        </g>
      </g>

      ${drawBottomPricingBar(1180, false)}
    </svg>
  `;

  // Slide 3: Technique
  const svg3 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      ${drawHeader(logoB64, 'STEP 2: THE 45° ANGLE 📐', false)}

      <text x="70" y="210" font-family="-apple-system, sans-serif" font-weight="900" font-size="46" fill="${BRAND.darkText}">Step 2: The Golden 45° Rule</text>
      <text x="70" y="265" font-family="-apple-system, sans-serif" font-weight="600" font-size="24" fill="${BRAND.mutedText}">Master the angle for zero cuts &amp; flawless glide</text>

      <g transform="translate(70, 320)" filter="url(#softShadow)">
        <rect width="940" height="780" rx="36" fill="${BRAND.white}"/>

        <!-- Angle Diagram -->
        <g transform="translate(100, 80)">
          <path d="M 50 250 L 350 250" stroke="#CBD5E1" stroke-width="4"/>
          <path d="M 50 250 L 260 40" stroke="${BRAND.purple}" stroke-width="6"/>
          <path d="M 120 250 A 70 70 0 0 0 100 200" fill="none" stroke="${BRAND.lightOrchid}" stroke-width="4"/>
          <text x="140" y="210" font-family="-apple-system, sans-serif" font-weight="900" font-size="32" fill="${BRAND.purple}">45°</text>
          <text x="50" y="290" font-family="-apple-system, sans-serif" font-weight="700" font-size="20" fill="${BRAND.mutedText}">Skin Surface (Hold Taut)</text>
          <text x="240" y="30" font-family="-apple-system, sans-serif" font-weight="800" font-size="22" fill="${BRAND.purple}">Razor Blade Direction</text>
        </g>

        <!-- Instructions -->
        <g transform="translate(60, 420)">
          <rect width="820" height="280" rx="24" fill="${BRAND.softLavender}"/>
          <text x="40" y="50" font-family="-apple-system, sans-serif" font-weight="800" font-size="26" fill="${BRAND.darkText}">How To Stroke:</text>
          <text x="40" y="95" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="${BRAND.darkText}">1. Pull skin taut upwards with your free fingers</text>
          <text x="40" y="135" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="${BRAND.darkText}">2. Short downward strokes (1–2 cm at a time)</text>
          <text x="40" y="175" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="${BRAND.darkText}">3. Wipe blade on a cotton pad after every few strokes</text>
          <text x="40" y="215" font-family="-apple-system, sans-serif" font-weight="800" font-size="22" fill="${BRAND.purple}">Zero force needed! The micro-guard blade does the work.</text>
        </g>
      </g>

      ${drawBottomPricingBar(1180, false)}
    </svg>
  `;

  // Slide 4: Aftercare
  const svg4 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      ${drawHeader(logoB64, 'STEP 3: POST-SHAVE CARE 💧', false)}

      <text x="70" y="210" font-family="-apple-system, sans-serif" font-weight="900" font-size="46" fill="${BRAND.darkText}">Step 3: Soothe &amp; Protect</text>
      <text x="70" y="265" font-family="-apple-system, sans-serif" font-weight="600" font-size="24" fill="${BRAND.mutedText}">Lock in that baby-soft post-dermaplaning glow</text>

      <g transform="translate(70, 320)" filter="url(#softShadow)">
        <rect width="940" height="780" rx="36" fill="${BRAND.white}"/>
        
        <g transform="translate(60, 60)">
          <!-- DO's -->
          <rect width="820" height="280" rx="24" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="2"/>
          <text x="40" y="50" font-family="-apple-system, sans-serif" font-weight="800" font-size="26" fill="#14532D">WHAT TO DO (Next 24h) ✓</text>
          <text x="40" y="95" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="#166534">• Rinse gently with cool, soothing water</text>
          <text x="40" y="135" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="#166534">• Apply hydrating Hyaluronic Acid or Ceramide moisturizer</text>
          <text x="40" y="175" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="#166534">• Clean your blade with alcohol and put safety cap on</text>
          <text x="40" y="215" font-family="-apple-system, sans-serif" font-weight="800" font-size="20" fill="#15803D">• Always wear sunscreen SPF 50+ the next morning!</text>

          <!-- DON'Ts -->
          <g transform="translate(0, 320)">
            <rect width="820" height="280" rx="24" fill="#FFF5F5" stroke="#FED7D7" stroke-width="2"/>
            <text x="40" y="50" font-family="-apple-system, sans-serif" font-weight="800" font-size="26" fill="#991B1B">WHAT TO AVOID (Next 24h) ❌</text>
            <text x="40" y="95" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="#7F1D1D">• NO Vitamin C, Glycolic Acid, Retinol or harsh actives</text>
            <text x="40" y="135" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="#7F1D1D">• NO heavy liquid foundation for at least 12–24 hours</text>
            <text x="40" y="175" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="#7F1D1D">• NO swimming pools or saunas right after</text>
            <text x="40" y="215" font-family="-apple-system, sans-serif" font-weight="800" font-size="20" fill="#991B1B">• Give your skin time to breathe and absorb hydration!</text>
          </g>
        </g>
      </g>

      ${drawBottomPricingBar(1180, false)}
    </svg>
  `;

  // Slide 5: CTA
  const svg5 = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#darkPlumGrad)"/>
      <circle cx="950" cy="200" r="350" fill="${BRAND.lightOrchid}" opacity="0.3"/>
      ${drawHeader(logoB64, 'READY TO GLOW? 🌸', true)}

      <text x="70" y="220" font-family="-apple-system, sans-serif" font-weight="900" font-size="52" fill="${BRAND.white}">Start Your At-Home</text>
      <text x="70" y="280" font-family="-apple-system, sans-serif" font-weight="900" font-size="52" fill="${BRAND.white}">Glow Routine Today ✨</text>

      <g transform="translate(70, 360)" filter="url(#softShadow)">
        <rect width="940" height="720" rx="36" fill="${BRAND.white}"/>

        <!-- Centered Razor Graphic -->
        <g transform="translate(390, 30)">
          ${drawVectorRazor(0, 0, 0.68, 12)}
        </g>

        <g transform="translate(60, 480)">
          <rect width="820" height="180" rx="24" fill="${BRAND.softLavender}"/>
          <text x="40" y="55" font-family="-apple-system, sans-serif" font-weight="900" font-size="30" fill="${BRAND.purple}">Girlies Glow Facial Razor</text>
          <text x="40" y="95" font-family="-apple-system, sans-serif" font-weight="600" font-size="20" fill="${BRAND.darkText}">Includes safety blade with micro-guard + wheat-straw body.</text>
          <text x="40" y="130" font-family="-apple-system, sans-serif" font-weight="800" font-size="22" fill="${BRAND.leafGreen}">Rs. 599 with Cash on Delivery nationwide!</text>
        </g>
      </g>

      <g transform="translate(70, 1140)">
        <rect width="940" height="130" rx="36" fill="url(#greenAccentGrad)" filter="url(#softShadow)"/>
        <text x="470" y="55" font-family="-apple-system, sans-serif" font-weight="900" font-size="34" fill="${BRAND.white}" text-anchor="middle">ORDER NOW • Rs. 599 (COD NATIONWIDE 🇵🇰)</text>
        <text x="470" y="95" font-family="-apple-system, sans-serif" font-weight="800" font-size="22" fill="${BRAND.white}" text-anchor="middle">DM @girli_esglow to book your razor today</text>
      </g>
    </svg>
  `;

  renderSvgToPng(svg1, path.join(outputDir, 'post_8_slide_1.png'));
  renderSvgToPng(svg2, path.join(outputDir, 'post_8_slide_2.png'));
  renderSvgToPng(svg3, path.join(outputDir, 'post_8_slide_3.png'));
  renderSvgToPng(svg4, path.join(outputDir, 'post_8_slide_4.png'));
  renderSvgToPng(svg5, path.join(outputDir, 'post_8_slide_5.png'));
  return path.join(outputDir, 'post_8_slide_1.png');
}

// Post 9: Dermaplaning 101 Benefits (Static 4:5, 1080x1350)
export function renderPost9(outputPath = path.join(GENERATED_DIR, 'post_9_static.png')) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#lightBgGrad)"/>
      ${drawHeader(logoB64, 'DERMAPLANING 101 🌟', false)}

      <text x="70" y="200" font-family="-apple-system, sans-serif" font-weight="900" font-size="46" fill="${BRAND.darkText}">4 Reasons Why Everyone Is</text>
      <text x="70" y="255" font-family="-apple-system, sans-serif" font-weight="900" font-size="46" fill="${BRAND.darkText}">Obsessed With Face Shaving 🌸</text>

      <!-- 4-Quadrant Benefit Grid -->
      <g transform="translate(70, 310)" filter="url(#softShadow)">
        <rect width="940" height="840" rx="36" fill="${BRAND.white}"/>

        <!-- Box 1 -->
        <g transform="translate(45, 45)">
          <rect width="400" height="350" rx="28" fill="${BRAND.softLavender}" stroke="${BRAND.purple}" stroke-width="2"/>
          <circle cx="50" cy="55" r="26" fill="${BRAND.purple}"/>
          <text x="50" y="65" font-family="-apple-system, sans-serif" font-weight="900" font-size="28" fill="${BRAND.white}" text-anchor="middle">💄</text>
          <text x="95" y="62" font-family="-apple-system, sans-serif" font-weight="800" font-size="26" fill="${BRAND.darkText}">Flawless Makeup</text>
          
          <text x="35" y="130" font-family="-apple-system, sans-serif" font-weight="600" font-size="18" fill="${BRAND.darkText}">Foundation and concealer</text>
          <text x="35" y="162" font-family="-apple-system, sans-serif" font-weight="600" font-size="18" fill="${BRAND.darkText}">glide on like liquid silk.</text>
          <text x="35" y="196" font-family="-apple-system, sans-serif" font-weight="500" font-size="17" fill="${BRAND.mutedText}">No texture, no patchiness,</text>
          <text x="35" y="228" font-family="-apple-system, sans-serif" font-weight="500" font-size="17" fill="${BRAND.mutedText}">zero visible peach fuzz in daylight.</text>
        </g>

        <!-- Box 2 -->
        <g transform="translate(495, 45)">
          <rect width="400" height="350" rx="28" fill="${BRAND.softLavender}" stroke="${BRAND.purple}" stroke-width="2"/>
          <circle cx="50" cy="55" r="26" fill="${BRAND.lightOrchid}"/>
          <text x="50" y="65" font-family="-apple-system, sans-serif" font-weight="900" font-size="28" fill="${BRAND.white}" text-anchor="middle">✨</text>
          <text x="95" y="62" font-family="-apple-system, sans-serif" font-weight="800" font-size="26" fill="${BRAND.darkText}">Instant Exfoliation</text>
          
          <text x="35" y="130" font-family="-apple-system, sans-serif" font-weight="600" font-size="18" fill="${BRAND.darkText}">Clears away the dull layer</text>
          <text x="35" y="162" font-family="-apple-system, sans-serif" font-weight="600" font-size="18" fill="${BRAND.darkText}">of dead surface cells.</text>
          <text x="35" y="196" font-family="-apple-system, sans-serif" font-weight="500" font-size="17" fill="${BRAND.mutedText}">Skin instantly feels 2x softer</text>
          <text x="35" y="228" font-family="-apple-system, sans-serif" font-weight="500" font-size="17" fill="${BRAND.mutedText}">with a natural glassy glow.</text>
        </g>

        <!-- Box 3 -->
        <g transform="translate(45, 435)">
          <rect width="400" height="350" rx="28" fill="${BRAND.softLavender}" stroke="${BRAND.purple}" stroke-width="2"/>
          <circle cx="50" cy="55" r="26" fill="${BRAND.leafGreen}"/>
          <text x="50" y="65" font-family="-apple-system, sans-serif" font-weight="900" font-size="28" fill="${BRAND.white}" text-anchor="middle">💧</text>
          <text x="95" y="62" font-family="-apple-system, sans-serif" font-weight="800" font-size="26" fill="${BRAND.darkText}">3x Absorption</text>
          
          <text x="35" y="130" font-family="-apple-system, sans-serif" font-weight="600" font-size="18" fill="${BRAND.darkText}">Your expensive serums</text>
          <text x="35" y="162" font-family="-apple-system, sans-serif" font-weight="600" font-size="18" fill="${BRAND.darkText}">and moisturizers penetrate</text>
          <text x="35" y="196" font-family="-apple-system, sans-serif" font-weight="500" font-size="17" fill="${BRAND.mutedText}">deep into the epidermis</text>
          <text x="35" y="228" font-family="-apple-system, sans-serif" font-weight="500" font-size="17" fill="${BRAND.mutedText}">instead of sitting on fuzz.</text>
        </g>

        <!-- Box 4 -->
        <g transform="translate(495, 435)">
          <rect width="400" height="350" rx="28" fill="${BRAND.softLavender}" stroke="${BRAND.purple}" stroke-width="2"/>
          <circle cx="50" cy="55" r="26" fill="${BRAND.deepPlum}"/>
          <text x="50" y="65" font-family="-apple-system, sans-serif" font-weight="900" font-size="28" fill="${BRAND.white}" text-anchor="middle">🌿</text>
          <text x="95" y="62" font-family="-apple-system, sans-serif" font-weight="800" font-size="26" fill="${BRAND.darkText}">Eco Wheat-Straw</text>
          
          <text x="35" y="130" font-family="-apple-system, sans-serif" font-weight="600" font-size="18" fill="${BRAND.darkText}">Crafted from natural wheat</text>
          <text x="35" y="162" font-family="-apple-system, sans-serif" font-weight="600" font-size="18" fill="${BRAND.darkText}">straw — biodegradable body</text>
          <text x="35" y="196" font-family="-apple-system, sans-serif" font-weight="500" font-size="17" fill="${BRAND.mutedText}">kind to the planet, with</text>
          <text x="35" y="228" font-family="-apple-system, sans-serif" font-weight="500" font-size="17" fill="${BRAND.mutedText}">stainless micro-mesh safety.</text>
        </g>
      </g>

      ${drawBottomPricingBar(1180, false)}
    </svg>
  `;

  return renderSvgToPng(svg, outputPath);
}

// Post 10: Special Offer / COD Alert (Static 4:5, 1080x1350)
export function renderPost10(outputPath = path.join(GENERATED_DIR, 'post_10_offer.png')) {
  const logoB64 = getAssetBase64('GirliesGlow_Logo_NoBG.png');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      ${getSvgDefs()}
      <rect width="1080" height="1350" fill="url(#darkPlumGrad)"/>
      <circle cx="950" cy="200" r="350" fill="${BRAND.lightOrchid}" opacity="0.35"/>
      <circle cx="100" cy="1100" r="300" fill="${BRAND.purple}" opacity="0.25"/>

      ${drawHeader(logoB64, 'SPECIAL LAUNCH OFFER ⚡', true)}

      <text x="70" y="210" font-family="-apple-system, sans-serif" font-weight="900" font-size="52" fill="${BRAND.white}">Glow Ghar Par 🌸</text>
      <text x="70" y="265" font-family="-apple-system, sans-serif" font-weight="700" font-size="26" fill="#D8C3F5">Eco-Friendly Curved Facial Razor • Micro-Guard Blade</text>

      <!-- Center Offer Card: Two-Column Showcase -->
      <g transform="translate(70, 320)" filter="url(#softShadow)">
        <rect width="940" height="780" rx="36" fill="${BRAND.white}"/>

        <!-- Promo Banner -->
        <rect x="50" y="35" width="840" height="95" rx="22" fill="${BRAND.softLavender}"/>
        <text x="75" y="74" font-family="-apple-system, sans-serif" font-weight="900" font-size="28" fill="${BRAND.purple}">EXCLUSIVE LAUNCH BATCH • 40% OFF</text>
        <text x="75" y="104" font-family="-apple-system, sans-serif" font-weight="700" font-size="18" fill="${BRAND.mutedText}">Premium stainless micro-guard blade + eco wheat-straw body</text>

        <!-- Left Column: Pricing, Features & Delivery -->
        <g transform="translate(60, 160)">
          <!-- Price Display -->
          <text x="0" y="65" font-family="-apple-system, sans-serif" font-weight="900" font-size="76" fill="${BRAND.purple}">Rs. 599</text>
          
          <g transform="translate(300, 20)">
            <text x="0" y="20" font-family="-apple-system, sans-serif" font-weight="700" font-size="26" fill="#9CA3AF" text-decoration="line-through">Rs. 999</text>
            <rect x="0" y="32" width="120" height="32" rx="16" fill="#FEE2E2"/>
            <text x="60" y="54" font-family="-apple-system, sans-serif" font-weight="800" font-size="15" fill="#DC2626" text-anchor="middle">SAVE 40%</text>
          </g>

          <!-- Feature List -->
          <g transform="translate(0, 115)">
            <circle cx="16" cy="18" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="24" font-family="-apple-system, sans-serif" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="45" y="25" font-family="-apple-system, sans-serif" font-weight="800" font-size="21" fill="${BRAND.darkText}">Precision Stainless Micro-Guard Blade</text>

            <circle cx="16" cy="68" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="74" font-family="-apple-system, sans-serif" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="45" y="75" font-family="-apple-system, sans-serif" font-weight="800" font-size="21" fill="${BRAND.darkText}">Curved Wheat-Straw Ergonomic Handle</text>

            <circle cx="16" cy="118" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="124" font-family="-apple-system, sans-serif" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="45" y="125" font-family="-apple-system, sans-serif" font-weight="800" font-size="21" fill="${BRAND.darkText}">Safe For Sensitive Skin (Zero Cuts)</text>

            <circle cx="16" cy="168" r="14" fill="${BRAND.leafGreen}"/>
            <text x="16" y="174" font-family="-apple-system, sans-serif" font-weight="900" font-size="16" fill="${BRAND.white}" text-anchor="middle">✓</text>
            <text x="45" y="175" font-family="-apple-system, sans-serif" font-weight="800" font-size="21" fill="${BRAND.darkText}">Protective Snap-On Safety Cap Included</text>
          </g>

          <!-- Delivery Stamp -->
          <g transform="translate(0, 345)">
            <rect width="490" height="110" rx="20" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="2"/>
            <text x="25" y="42" font-family="-apple-system, sans-serif" font-weight="900" font-size="21" fill="#14532D">🚚 CASH ON DELIVERY ACROSS PAKISTAN</text>
            <text x="25" y="75" font-family="-apple-system, sans-serif" font-weight="600" font-size="16" fill="#166534">Karachi, Lahore, Islamabad &amp; all cities nationwide</text>
          </g>
        </g>

        <!-- Right Column: Dedicated Product Showcase Podium -->
        <g transform="translate(600, 160)">
          <rect width="280" height="460" rx="28" fill="#FAF6FE" stroke="#E9DDF5" stroke-width="2"/>
          ${drawVectorRazor(45, 10, 0.65, 0)}
          <rect x="35" y="395" width="210" height="42" rx="21" fill="${BRAND.purple}"/>
          <text x="140" y="422" font-family="-apple-system, sans-serif" font-weight="800" font-size="16" fill="${BRAND.white}" text-anchor="middle" letter-spacing="1">GIRLIES GLOW</text>
        </g>
      </g>

      <!-- Bottom Order Button -->
      <g transform="translate(70, 1140)">
        <rect width="940" height="130" rx="36" fill="url(#greenAccentGrad)" filter="url(#softShadow)"/>
        <text x="470" y="55" font-family="-apple-system, sans-serif" font-weight="900" font-size="34" fill="${BRAND.white}" text-anchor="middle">DM @girli_esglow TO ORDER NOW ⚡</text>
        <text x="470" y="95" font-family="-apple-system, sans-serif" font-weight="800" font-size="22" fill="${BRAND.white}" text-anchor="middle">Pay Rs. 599 when your parcel arrives at your doorstep</text>
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
    case '3': return [renderPost3()];
    case '4': return [renderPost4()];
    case '5': return [renderPost5()];
    case '6': return [renderPost6()];
    case '7': return [renderPost7()];
    case '8': return [renderPost8()];
    case '9': return [renderPost9()];
    case '10': return [renderPost10()];
    default:
      throw new Error(`Unknown post ID: ${postId}`);
  }
}

// Generate all creatives
export function generateAllCreatives() {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  console.log('Generating Canva-quality vector creatives for Girlies Glow...');

  const results = [];
  results.push(renderPost1());
  results.push(renderPost2());
  results.push(renderPost3());
  results.push(renderPost4());
  results.push(renderPost5());
  results.push(renderPost6());
  results.push(renderPost7());
  results.push(renderPost8());
  results.push(renderPost9());
  results.push(renderPost10());

  console.log(`✓ All 10 Canva-quality creatives generated in ${GENERATED_DIR}`);
  return results;
}

if (process.argv[1] && process.argv[1].endsWith('generate_creatives.js')) {
  generateAllCreatives();
}
