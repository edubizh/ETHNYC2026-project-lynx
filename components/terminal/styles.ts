// Monochrome design tokens shared by the terminal feeds — matches the dashboard
// (white numbers / silver ◆ asset / steel ● belief, Inter Tight + IBM Plex). NO green/red:
// BUY = bright, SELL = steel, with ▲/▼ glyphs, to stay on-brand monochrome.

export const T = {
  bg: "#0A0B0E",
  panel: "#14161B",
  panel2: "#1B1E24",
  border: "#2A2D34",
  text: "#FFFFFF",
  dim: "#AAB1BC",
  faint: "#7A828D",
  faintest: "#5C636D",
  asset: "#E8EBEF", // ◆ silver
  belief: "#8A95A6", // ● steel
  buy: "#E8EBEF", // bright = BUY / bid
  sell: "#8A95A6", // steel = SELL / ask
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace",
  body: "'IBM Plex Sans', system-ui, sans-serif",
  display: "'Inter Tight', system-ui, sans-serif",
} as const;

export function timeAgo(ms: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

export const shortHash = (h: string): string => (h && h.length > 10 ? `${h.slice(0, 6)}…${h.slice(-4)}` : h);
