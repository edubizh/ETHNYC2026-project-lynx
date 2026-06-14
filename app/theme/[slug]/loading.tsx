// Instant skeleton streamed during navigation to a theme dashboard (App Router loading.tsx). The page
// is a server component that awaits live feeds; without this, clicking a category showed nothing until
// the whole render finished. This renders immediately so navigation feels instant while data resolves.

const PANEL = { background: "#14161B", border: "1px solid #2A2D34", borderRadius: 10 } as const;
const BODY = "'IBM Plex Sans', system-ui, sans-serif";

function Bar({ w, h = 14, r = 6 }: { w: number | string; h?: number; r?: number }) {
  return <div className="lx-sk" style={{ width: w, maxWidth: "100%", height: h, borderRadius: r, background: "#1B1E24" }} />;
}

export default function ThemeLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0B0E", color: "#FFFFFF", fontFamily: BODY }}>
      <style>{`@keyframes lxpulse{0%,100%{opacity:.45}50%{opacity:.9}} .lx-sk{animation:lxpulse 1.1s ease-in-out infinite}`}</style>
      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 28px 110px" }}>
        {/* header */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
          <Bar w={220} h={28} />
          <Bar w={120} h={20} r={999} />
          <Bar w="70%" h={14} />
        </div>
        {/* sentiment-gap meter panel */}
        <section style={{ ...PANEL, padding: "26px 28px 40px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 34 }}>
            <Bar w={200} h={20} />
            <Bar w={96} h={28} r={8} />
          </div>
          <Bar w="100%" h={8} r={999} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
            <Bar w={130} h={12} />
            <Bar w={130} h={12} />
          </div>
        </section>
        {/* leg rows */}
        <section style={{ ...PANEL, padding: "18px 20px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
              <Bar w="42%" h={16} />
              <Bar w={90} h={22} />
              <Bar w={60} h={12} />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
