// Cena 3 — Dashboard (8-13s, 150 frames relativo)
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, fontFamily } from "./tokens";

const NAV_ITEMS = ["Dashboard", "Bots", "Fluxos", "Contatos", "Análises", "Configurações"];

const KPIS = [
  { label: "Mensagens Hoje", value: "2.847", change: "+12.5%", color: C.blue },
  { label: "Leads Capturados", value: "384", change: "+8.3%", color: C.emerald },
  { label: "Taxa de Resposta", value: "97.2%", change: "+2.1%", color: C.purple },
  { label: "Tempo Médio", value: "3.2s", change: "-18%", color: C.amber },
];

const CHART_BARS = [65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100, 88];

export const Cena3_Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Overall entrance
  const mainOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const mainY = interpolate(frame, [0, 15], [40, 0], { extrapolateRight: "clamp" });

  // Sidebar slide
  const sidebarX = interpolate(frame, [0, 20], [-200, 0], { extrapolateRight: "clamp" });

  // Greeting
  const greetOpacity = interpolate(frame, [10, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Toast notification
  const toastY = interpolate(frame, [80, 95, 130, 140], [80, 0, 0, -80], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const toastOpacity = interpolate(frame, [80, 95, 130, 140], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      backgroundColor: C.darkMode, fontFamily, overflow: "hidden",
      opacity: mainOpacity, transform: `translateY(${mainY}px)`,
    }}>
      {/* Sidebar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 220,
        backgroundColor: C.surface900, borderRight: `1px solid ${C.glassBorder}`,
        transform: `translateX(${sidebarX}px)`, padding: "24px 0",
      }}>
        {/* Logo area */}
        <div style={{
          padding: "0 20px 24px", borderBottom: `1px solid ${C.glassBorder}`,
          fontSize: 22, fontWeight: 800, color: C.white,
        }}>
          <span style={{ color: C.brand500 }}>Ruby</span>Bot
        </div>

        {/* Nav items */}
        <div style={{ padding: "16px 0" }}>
          {NAV_ITEMS.map((item, i) => {
            const active = i === 0;
            const delay = 15 + i * 4;
            const itemOpacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={i} style={{
                padding: "12px 20px", fontSize: 15, fontWeight: active ? 600 : 400,
                color: active ? C.white : C.dim, opacity: itemOpacity,
                backgroundColor: active ? C.iconRingBg : "transparent",
                borderLeft: active ? `3px solid ${C.brand500}` : "3px solid transparent",
              }}>{item}</div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div style={{ position: "absolute", left: 220, top: 0, right: 0, bottom: 0, padding: 28 }}>
        {/* Greeting */}
        <div style={{ opacity: greetOpacity, marginBottom: 28 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.white, margin: 0 }}>
            Olá, Guga 👋
          </h2>
          <p style={{ fontSize: 15, color: C.muted, margin: "4px 0 0" }}>
            Aqui está o resumo de hoje
          </p>
        </div>

        {/* KPI Cards - 2x2 grid */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {KPIS.map((kpi, i) => {
            const delay = 20 + i * 10;
            const cardScale = spring({ frame: Math.max(0, frame - delay), fps, config: { mass: 1, damping: 20, stiffness: 120 } });
            const countUp = Math.floor(interpolate(frame, [delay + 5, delay + 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * 100);
            return (
              <div key={i} style={{
                width: "calc(50% - 7px)", padding: "18px 16px", borderRadius: 14,
                backgroundColor: C.glassBg, border: `1px solid ${C.glassBorder}`,
                transform: `scale(${cardScale})`,
              }}>
                <div style={{ fontSize: 12, color: C.dim, marginBottom: 8 }}>{kpi.label}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.white }}>{kpi.value}</div>
                <div style={{
                  fontSize: 13, fontWeight: 600, marginTop: 6,
                  color: kpi.change.startsWith("+") ? C.emerald : C.brand500,
                }}>
                  {countUp >= 100 ? kpi.change : "..."}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mini chart */}
        <div style={{
          marginTop: 20, padding: "20px 16px", borderRadius: 14,
          backgroundColor: C.glassBg, border: `1px solid ${C.glassBorder}`,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 16 }}>
            Mensagens (últimos 12 dias)
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
            {CHART_BARS.map((h, i) => {
              const delay = 50 + i * 3;
              const barH = interpolate(frame, [delay, delay + 20], [0, h * 1.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <div key={i} style={{
                  flex: 1, height: barH, borderRadius: 4,
                  background: `linear-gradient(to top, ${C.brand500}, ${C.brand400})`,
                  opacity: 0.8,
                }} />
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast notification */}
      <div style={{
        position: "absolute", bottom: 40, left: "50%",
        transform: `translate(-50%, ${toastY}px)`, opacity: toastOpacity,
        padding: "14px 28px", borderRadius: 12,
        backgroundColor: C.emerald, fontSize: 15, fontWeight: 600,
        color: "#fff", whiteSpace: "nowrap",
        boxShadow: `0 8px 30px ${C.emerald}40`,
      }}>
        ✓ Novo lead capturado!
      </div>
    </AbsoluteFill>
  );
};
