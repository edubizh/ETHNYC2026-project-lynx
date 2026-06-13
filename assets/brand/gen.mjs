import { writeFileSync } from "node:fs";

// Cubic bezier sample
const bez = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a*p0[0]+b*p1[0]+c*p2[0]+d*p3[0], a*p0[1]+b*p1[1]+c*p2[1]+d*p3[1]];
};

// Top & bottom eyelid curves (both share the two eye-corner points -> lines converge there).
const TOP = [[84,256],[170,176],[342,176],[428,256]];
const BOT = [[84,256],[170,336],[342,336],[428,256]];

// A single silver "latitude" line at vertical fraction f (0 = bottom lid, 1 = top lid).
function line(f, samples = 28) {
  let d = "";
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const tp = bez(...TOP, t), bp = bez(...BOT, t);
    const x = bp[0]*(1-f) + tp[0]*f;
    const y = bp[1]*(1-f) + tp[1]*f;
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1) + " ";
  }
  return d.trim();
}

function eyeLines() {
  const N = 17;
  let out = "";
  for (let k = 1; k <= N; k++) {
    const f = k / (N + 1);
    const op = (0.30 + 0.52 * (1 - Math.abs(2*f - 1))).toFixed(3);
    const w = (2.6 + 1.2 * (1 - Math.abs(2*f - 1))).toFixed(2);
    out += `    <path d="${line(f)}" stroke="url(#lineGrad)" stroke-opacity="${op}" stroke-width="${w}"/>\n`;
  }
  return out;
}
const LINES = eyeLines();

// A pointed vertical lens centred at (256+dx, 256).
const lens = (dx, w, h) => {
  const c = 256, cx = 256 + dx;
  return `M${cx},${c-h} C${cx+w},${(c-0.45*h).toFixed(1)} ${cx+w},${(c+0.45*h).toFixed(1)} ${cx},${c+h} `
       + `C${cx-w},${(c+0.45*h).toFixed(1)} ${cx-w},${(c-0.45*h).toFixed(1)} ${cx},${c-h} Z`;
};

// The pupil = a tall dark core that frays into progressively shorter, thinner streaks.
// [dx, halfWidth, halfHeight] — symmetric pairs reach outward and shrink (spill into the field/bg).
const PUPIL = [
  [0, 15, 108],
  [19, 3.2, 64], [-19, 3.2, 64],
  [33, 2.6, 50], [-33, 2.6, 50],
  [47, 2.1, 38], [-47, 2.1, 38],
  [61, 1.7, 27], [-61, 1.7, 27],
  [75, 1.4, 18], [-75, 1.4, 18],
];
const pupilShapes = (fill) => PUPIL.map(([dx,w,h]) => `<path d="${lens(dx,w,h)}" fill="${fill}"/>`).join("\n      ");

// Mark interior — silver line field with the dark frayed pupil punched + painted over it.
const MARK = () => `
    <g fill="none" stroke-linecap="round" mask="url(#pupil)">
${LINES}    </g>
    <!-- dark frayed pupil painted on top so it reads clearly dark; tips fade into the bg -->
    <g filter="url(#softCore)">
      ${pupilShapes("url(#darkGrad)")}
    </g>
    <!-- white catchlights -->
    <circle cx="300" cy="214" r="13" fill="url(#silver)"/>
    <circle cx="302" cy="212" r="5" fill="#FFFFFF"/>
    <circle cx="243" cy="298" r="6" fill="#F1F5F9" fill-opacity="0.5"/>`;

const DEFS = (bg0, bg1) => `
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg0}"/>
      <stop offset="1" stop-color="${bg1}"/>
    </linearGradient>
    <linearGradient id="lineGrad" gradientUnits="userSpaceOnUse" x1="84" y1="0" x2="428" y2="0">
      <stop offset="0"    stop-color="#FAFBFC" stop-opacity="0"/>
      <stop offset="0.18" stop-color="#FAFBFC" stop-opacity="0.55"/>
      <stop offset="0.5"  stop-color="#FFFFFF" stop-opacity="1"/>
      <stop offset="0.82" stop-color="#C4C9D2" stop-opacity="0.55"/>
      <stop offset="1"    stop-color="#C4C9D2" stop-opacity="0"/>
    </linearGradient>
    <!-- dark pupil colour, fading to transparent at top & bottom tips (spills into the bg) -->
    <linearGradient id="darkGrad" gradientUnits="userSpaceOnUse" x1="256" y1="148" x2="256" y2="364">
      <stop offset="0"    stop-color="#040406" stop-opacity="0"/>
      <stop offset="0.20" stop-color="#040406" stop-opacity="0.97"/>
      <stop offset="0.80" stop-color="#040406" stop-opacity="0.97"/>
      <stop offset="1"    stop-color="#040406" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#C9CFD8" stop-opacity="0.10"/>
      <stop offset="1" stop-color="#C9CFD8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="silver" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="0.6" stop-color="#E2E8F0" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#E2E8F0" stop-opacity="0"/>
    </radialGradient>
    <!-- modest blur: cuts silver where the streaks are (tile shows through) -->
    <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.4"/></filter>
    <!-- softer blur on the painted dark streaks so their ends melt outward -->
    <filter id="softCore" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.2"/></filter>
    <mask id="pupil" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
      <rect x="0" y="0" width="512" height="512" fill="#FFFFFF"/>
      <g filter="url(#soft)">
      ${pupilShapes("#000000")}
      </g>
    </mask>`;

// ---- ICON (512) ----
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>${DEFS("#0C0D10", "#1B1D22")}
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="116" fill="url(#tile)"/>
  <ellipse cx="256" cy="256" rx="220" ry="160" fill="url(#glow)"/>
  ${MARK()}
</svg>
`;
writeFileSync(new URL("./logo-a.svg", import.meta.url), icon);

// ---- COVER (640x360) ----
const cover = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
  <defs>${DEFS("#0B0C0F", "#191B20")}
    <linearGradient id="word" x1="0" y1="0" x2="1" y2="0.4">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.55" stop-color="#D7DBE1"/>
      <stop offset="1" stop-color="#9AA1AC"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="640" height="360" fill="url(#tile)"/>
  <ellipse cx="196" cy="180" rx="250" ry="195" fill="url(#glow)"/>
  <g transform="translate(44,22) scale(0.585)">${MARK()}
  </g>
  <text x="344" y="198" font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
        font-size="98" font-weight="800" letter-spacing="3" fill="url(#word)">LYNX</text>
  <text x="470" y="238" text-anchor="middle" font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
        font-size="15" font-weight="600" letter-spacing="4" fill="#878D98">TRADITIONAL&#160;PREDICTIONS</text>
</svg>
`;
writeFileSync(new URL("./cover-a.svg", import.meta.url), cover);

console.log("generated logo-a.svg + cover-a.svg");
