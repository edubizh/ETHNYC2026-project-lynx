import { writeFileSync } from "node:fs";

// Shared font + gradients. The wordmark is the whole logo now (no eye mark).
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";

const DEFS = (bg0, bg1) => `
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg0}"/>
      <stop offset="1" stop-color="${bg1}"/>
    </linearGradient>
    <linearGradient id="word" x1="0" y1="0" x2="1" y2="0.4">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.55" stop-color="#D7DBE1"/>
      <stop offset="1" stop-color="#9AA1AC"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#C9CFD8" stop-opacity="0.10"/>
      <stop offset="1" stop-color="#C9CFD8" stop-opacity="0"/>
    </radialGradient>`;

// ---- ICON (512) — centered LYNX wordmark ----
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>${DEFS("#0C0D10", "#1B1D22")}
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="116" fill="url(#tile)"/>
  <ellipse cx="256" cy="256" rx="240" ry="170" fill="url(#glow)"/>
  <text x="256" y="224" text-anchor="middle" font-family="${FONT}"
        font-size="180" font-weight="800" fill="url(#word)">LY</text>
  <text x="256" y="414" text-anchor="middle" font-family="${FONT}"
        font-size="180" font-weight="800" fill="url(#word)">NX</text>
</svg>
`;
writeFileSync(new URL("./logo-a.svg", import.meta.url), icon);

// ---- COVER (640x360) — wordmark + acrostic tagline, centered on the canvas ----
// Highlighted letters spell tra·di·tion: TRA + TION (line 1) + DI (line 2).
const cover = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
  <defs>${DEFS("#0B0C0F", "#191B20")}
    <linearGradient id="wordBox" gradientUnits="userSpaceOnUse" x1="60" y1="48" x2="300" y2="312">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.55" stop-color="#D7DBE1"/>
      <stop offset="1" stop-color="#9AA1AC"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="640" height="360" fill="url(#tile)"/>
  <ellipse cx="300" cy="180" rx="320" ry="160" fill="url(#glow)"/>
  <!-- LYNX as a 2x2 grid: columns x=120/246, rows baseline y=170/298. Box spans y 62..298. -->
  <g font-family="${FONT}" font-size="150" font-weight="800" font-kerning="none" text-anchor="middle" fill="url(#wordBox)">
    <text x="120" y="170">L</text>
    <text x="246" y="170">Y</text>
    <text x="120" y="298">N</text>
    <text x="246" y="298">X</text>
  </g>
  <!-- tagline: two lines set close together, vertically centered against the LYNX box (center y=180) -->
  <g text-anchor="middle" letter-spacing="6" font-family="${FONT}" font-size="28" font-weight="600">
    <text x="456" y="172"><tspan fill="#F4F6F9">TRA</tspan><tspan fill="#646A73">DI</tspan><tspan fill="#F4F6F9">TION</tspan><tspan fill="#646A73">AL</tspan></text>
    <text x="456" y="208"><tspan fill="#646A73">PRE</tspan><tspan fill="#F4F6F9">DI</tspan><tspan fill="#646A73">CTIONS</tspan></text>
  </g>
</svg>
`;
writeFileSync(new URL("./cover-a.svg", import.meta.url), cover);

console.log("generated logo-a.svg + cover-a.svg");
