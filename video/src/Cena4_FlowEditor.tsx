// Cena 4 — Flow Editor (13-18s, 150 frames relativo)
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, fontFamily, sr } from "./tokens";

// Real node types from nodeTypes.js
const NODES = [
  { id: "trigger", label: "Gatilho", icon: "⚡", color: C.amber, x: 140, y: 200 },
  { id: "condition", label: "Condição", icon: "🔀", color: C.blue, x: 540, y: 200 },
  { id: "ai_response", label: "Resposta IA", icon: "🧠", color: C.purple, x: 540, y: 520 },
  { id: "send_message", label: "Enviar Mensagem", icon: "💬", color: C.emerald, x: 140, y: 520 },
  { id: "delay", label: "Atraso", icon: "⏱️", color: C.orange, x: 340, y: 760 },
  { id: "webhook", label: "Webhook", icon: "🔗", color: C.cyan, x: 680, y: 760 },
];

const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [1, 3], [2, 4], [3, 4], [4, 5],
];

export const Cena4_FlowEditor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mainOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Grid dots opacity
  const gridOpacity = interpolate(frame, [0, 20], [0, 0.15], { extrapolateRight: "clamp" });

  // IA node pulse (index 2)
  const iaPulse = 0.95 + Math.sin(frame * 0.12) * 0.05;
  const iaGlow = interpolate(Math.sin(frame * 0.12), [-1, 1], [10, 30]);

  return (
    <AbsoluteFill style={{
      backgroundColor: C.darkMode, fontFamily, overflow: "hidden", opacity: mainOpacity,
    }}>
      {/* Toolbar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 56,
        backgroundColor: C.surface900, borderBottom: `1px solid ${C.glassBorder}`,
        display: "flex", alignItems: "center", padding: "0 20px", gap: 12,
      }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: C.white,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ color: C.brand500 }}>←</span> Editor de Fluxo
        </div>
        <div style={{ flex: 1 }} />
        <div style={{
          padding: "8px 20px", borderRadius: 8,
          background: `linear-gradient(135deg, ${C.brand500}, ${C.brand400})`,
          fontSize: 13, fontWeight: 600, color: "#fff",
        }}>Salvar</div>
      </div>

      {/* Grid dots */}
      <svg style={{ position: "absolute", top: 56, left: 0, width: 1080, height: 1864, opacity: gridOpacity }}>
        {Array.from({ length: 30 }, (_, row) =>
          Array.from({ length: 20 }, (_, col) => (
            <circle key={`${row}-${col}`} cx={col * 54 + 27} cy={row * 62 + 31} r={1.5} fill={C.dim} />
          ))
        )}
      </svg>

      {/* Connections (animated SVG lines) */}
      <svg style={{ position: "absolute", top: 56, left: 0, width: 1080, height: 1864 }}>
        {CONNECTIONS.map(([from, to], i) => {
          const delay = 15 + i * 8;
          const progress = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const n1 = NODES[from];
          const n2 = NODES[to];
          const x1 = n1.x + 100;
          const y1 = n1.y + 40;
          const x2 = n2.x + 100;
          const y2 = n2.y + 40;
          const mx = (x1 + x2) / 2;

          const pathD = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
          const len = 300; // approximate
          return (
            <path key={i} d={pathD} fill="none"
              stroke={C.brand500} strokeWidth={2} strokeOpacity={0.6}
              strokeDasharray={len} strokeDashoffset={len * (1 - progress)}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {NODES.map((node, i) => {
        const delay = 10 + i * 10;
        const nodeScale = spring({ frame: Math.max(0, frame - delay), fps, config: { mass: 1, damping: 20, stiffness: 120 } });
        const isIA = node.id === "ai_response";

        return (
          <div key={node.id} style={{
            position: "absolute", top: 56 + node.y, left: node.x,
            width: 200, transform: `scale(${isIA ? nodeScale * iaPulse : nodeScale})`,
            transformOrigin: "center",
          }}>
            <div style={{
              padding: "16px 18px", borderRadius: 14,
              backgroundColor: C.surface900,
              border: `1px solid ${isIA ? C.purple : C.glassBorder}`,
              boxShadow: isIA ? `0 0 ${iaGlow}px ${C.purple}50` : `0 4px 20px rgba(0,0,0,0.3)`,
            }}>
              {/* Node header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: `${node.color}18`,
                  border: `1px solid ${node.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>{node.icon}</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{node.label}</span>
              </div>

              {/* Node body mock */}
              <div style={{
                height: 8, borderRadius: 4, backgroundColor: C.surface800,
                width: `${60 + sr(i) * 40}%`,
              }} />
              <div style={{
                height: 8, borderRadius: 4, backgroundColor: C.surface800,
                width: `${40 + sr(i + 10) * 30}%`, marginTop: 6,
              }} />
            </div>

            {/* Connection dots */}
            <div style={{
              position: "absolute", top: -5, left: "50%",
              width: 10, height: 10, borderRadius: "50%",
              backgroundColor: C.surface800, border: `2px solid ${C.dim}`,
              transform: "translateX(-50%)",
            }} />
            <div style={{
              position: "absolute", bottom: -5, left: "50%",
              width: 10, height: 10, borderRadius: "50%",
              backgroundColor: C.surface800, border: `2px solid ${C.dim}`,
              transform: "translateX(-50%)",
            }} />
          </div>
        );
      })}

      {/* Floating label on IA node */}
      {frame > 60 && (
        <div style={{
          position: "absolute", top: 56 + 470, left: 750,
          padding: "8px 16px", borderRadius: 8,
          backgroundColor: C.purple, fontSize: 12, fontWeight: 600,
          color: "#fff", opacity: interpolate(frame, [60, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          boxShadow: `0 4px 20px ${C.purple}40`,
        }}>
          IA processando...
        </div>
      )}
    </AbsoluteFill>
  );
};
