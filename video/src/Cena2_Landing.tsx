// Cena 2 — Landing Page (3-8s, 150 frames relativo)
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, fontFamily, PARTICLES } from "./tokens";

const STATS = [
  { value: "50K+", label: "Mensagens/dia" },
  { value: "99.9%", label: "Uptime" },
  { value: "3s", label: "Resposta média" },
  { value: "10x", label: "Mais produtivo" },
];

const FEATURES = [
  { icon: "⚡", title: "Respostas Instantâneas", color: C.amber },
  { icon: "🧠", title: "IA Contextual", color: C.purple },
  { icon: "📊", title: "Analytics em Tempo Real", color: C.emerald },
];

export const Cena2_Landing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Browser chrome slide in
  const browserY = interpolate(frame, [0, 25], [100, 0], { extrapolateRight: "clamp" });
  const browserOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // Scroll simulation inside browser
  const scrollY = interpolate(frame, [40, 140], [0, -400], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Hero title reveal
  const heroScale = spring({ frame: Math.max(0, frame - 5), fps, config: { mass: 1, damping: 20, stiffness: 120 } });

  // CTA button pulse
  const ctaScale = spring({ frame: Math.max(0, frame - 25), fps, config: { mass: 1, damping: 18, stiffness: 100 } });

  // Particle fade
  const pOpacity = interpolate(frame, [0, 15], [0, 0.5], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDark, fontFamily, overflow: "hidden" }}>
      {/* Background particles */}
      {PARTICLES.slice(0, 12).map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: p.x, top: (p.y - frame * p.speed * 4 + 1920) % 1920,
          width: p.size, height: p.size, borderRadius: "50%",
          backgroundColor: p.color, opacity: p.opacity * pOpacity,
        }} />
      ))}

      {/* Browser mockup */}
      <div style={{
        position: "absolute", top: 120, left: 40, right: 40,
        transform: `translateY(${browserY}px)`, opacity: browserOpacity,
        borderRadius: 16, overflow: "hidden",
        border: `1px solid ${C.glassBorder}`,
        backgroundColor: C.surface950,
        height: 1650,
      }}>
        {/* Browser bar */}
        <div style={{
          height: 48, backgroundColor: C.surface900,
          display: "flex", alignItems: "center", padding: "0 16px", gap: 8,
        }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ef4444" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#f59e0b" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#22c55e" }} />
          <div style={{
            marginLeft: 16, flex: 1, height: 28, borderRadius: 8,
            backgroundColor: C.surface800, display: "flex", alignItems: "center",
            padding: "0 12px", fontSize: 13, color: C.dim,
          }}>rubybot.pro</div>
        </div>

        {/* Content area with scroll */}
        <div style={{ transform: `translateY(${scrollY}px)`, padding: 32 }}>
          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <Img src={staticFile("logo-dark.png")} style={{ height: 44 }} />
          </div>

          {/* Hero */}
          <div style={{ textAlign: "center", transform: `scale(${heroScale})` }}>
            <h1 style={{ fontSize: 48, fontWeight: 900, color: C.white, margin: 0, lineHeight: 1.1 }}>
              Transforme seu atendimento com{" "}
              <span style={{ color: C.brand500 }}>Inteligência Artificial</span>
            </h1>
            <p style={{ fontSize: 20, color: C.muted, marginTop: 16, lineHeight: 1.5 }}>
              Automatize conversas, capture leads e aumente suas vendas com a plataforma mais completa do mercado.
            </p>
          </div>

          {/* CTA */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 28, transform: `scale(${ctaScale})` }}>
            <div style={{
              padding: "16px 40px", borderRadius: 12,
              background: `linear-gradient(135deg, ${C.brand500}, ${C.brand400})`,
              fontSize: 18, fontWeight: 700, color: "#fff",
              boxShadow: `0 0 30px ${C.brand500}50`,
            }}>Começar Agora →</div>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 48, flexWrap: "wrap" }}>
            {STATS.map((s, i) => {
              const delay = 35 + i * 8;
              const sOpacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const sY = interpolate(frame, [delay, delay + 15], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <div key={i} style={{
                  textAlign: "center", opacity: sOpacity, transform: `translateY(${sY}px)`,
                  padding: "16px 20px", borderRadius: 12,
                  backgroundColor: C.glassBg, border: `1px solid ${C.glassBorder}`,
                  minWidth: 110,
                }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: C.brand500 }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Feature cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 40 }}>
            {FEATURES.map((f, i) => {
              const delay = 60 + i * 12;
              const fOpacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const fX = interpolate(frame, [delay, delay + 15], [-40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "20px 24px",
                  borderRadius: 14, backgroundColor: C.glassBg,
                  border: `1px solid ${C.glassBorder}`,
                  opacity: fOpacity, transform: `translateX(${fX}px)`,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    backgroundColor: `${f.color}18`, border: `1px solid ${f.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                  }}>{f.icon}</div>
                  <span style={{ fontSize: 20, fontWeight: 600, color: C.white }}>{f.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
