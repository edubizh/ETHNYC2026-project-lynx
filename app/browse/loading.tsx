// Instant skeleton streamed while the Browse mindshare treemap's live data resolves (App Router
// loading.tsx). Mirrors the treemap layout (flagship tile + rows) so the jump to real content is smooth.

const BODY = "'IBM Plex Sans', system-ui, sans-serif";
const tile = (flex: number, h: number) => ({
  flex,
  minWidth: 0,
  height: h,
  borderRadius: 7,
  background: "#101218",
  border: "1px solid #20242A",
});

export default function BrowseLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0B0E", color: "#FFFFFF", fontFamily: BODY }}>
      <style>{`@keyframes lxpulse{0%,100%{opacity:.45}50%{opacity:.9}} .lx-sk{animation:lxpulse 1.1s ease-in-out infinite}`}</style>
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px" }}>
        <div className="lx-sk" style={{ width: 240, maxWidth: "100%", height: 30, borderRadius: 8, background: "#1B1E24", marginBottom: 8 }} />
        <div className="lx-sk" style={{ width: 360, maxWidth: "100%", height: 14, borderRadius: 6, background: "#1B1E24", marginBottom: 22 }} />
        <div className="lx-sk" style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <div style={tile(34, 150)} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 30 }}>
            <div style={tile(1, 71)} />
            <div style={tile(1, 71)} />
          </div>
        </div>
        <div className="lx-sk" style={{ display: "flex", gap: 8 }}>
          <div style={tile(24, 110)} />
          <div style={tile(16, 110)} />
          <div style={tile(15, 110)} />
        </div>
      </main>
    </div>
  );
}
