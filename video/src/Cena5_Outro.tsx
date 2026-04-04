// Cena 5 — Outro / CTA (18-21s, 90 frames relativo)
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, fontFamily, PARTICLES } from "./tokens";

export const Cena5_Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo scale entrance
  const logoScale = spring({ frame, fps, config: { mass: 1, damping: 18, stiffness: 100 } });
  const logoOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  // "RubyBot" text
  const textScale = spring({ frame: Math.max(0, frame - 8), fps, config: { mass: 1, damping: 20, stiffness: 120 } });

  // Tagline
  const taglineOpacity = interpolate(frame, [18, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const taglineY = interpolate(frame, [18, 30], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // CTA button
  const ctaScale = spring({ frame: Math.max(0, frame - 30), fps, config: { mass: 1, damping: 15, stiffness: 90 } });

  // URL
  const urlOpacity = interpolate(frame, [40, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Particles burst outward
  const burstProgress = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

  // Glow pulse
  const glowPulse = 0.4 + Math.sin(frame * 0.1) * 0.15;

  // Fade out at end
  const fadeOut = interpolate(frame, [75, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDark, fontFamily, overflow: "hidden", opacity: fadeOut }}>
      {/* Burst particles */}
      {PARTICLES.map((p, i) => {
        const angle = (i / PARTICLES.length) * Math.PI * 2;
        const dist = burstProgress * (200 + p.size * 60);
        const bx = 540 + Math.cos(angle) * dist;
        const by = 800 + Math.sin(angle) * dist;
        const bOpacity = interpolate(burstProgress, [0, 0.3, 1], [0, p.opacity, 0]);
        return (
          <div key={i} style={{
            position: "absolute", left: bx, top: by,
            width: p.size * 1.5, height: p.size * 1.5, borderRadius: "50%",
            backgroundColor: p.color, opacity: bOpacity,
          }} />
        );
      })}

      {/* Radial glow */}
      <div style={{
        position: "absolute", top: "42%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.brand500}50 0%, transparent 70%)`,
        opacity: glowPulse,
      }} />

      {/* Logo */}
      <div style={{
        position: "absolute", top: "38%", left: "50%",
        transform: `translate(-50%, -50%) scale(${logoScale})`,
        opacity: logoOpacity,
      }}>
        <Img src={staticFile("logo-icon.png")} style={{ width: 160, height: 160 }} />
      </div>

      {/* RubyBot text */}
      <div style={{
        position: "absolute", top: "52%", width: "100%",
        textAlign: "center", transform: `scale(${textScale})`,
      }}>
        <span style={{ fontSize: 64, fontWeight: 900, color: C.white, letterSpacing: -2 }}>
          Ruby<span style={{ color: C.brand500 }}>Bot</span>
        </span>
      </div>

      {/* Tagline */}
      <div style={{
        position: "absolute", top: "60%", width: "100%",
        textAlign: "center", opacity: taglineOpacity,
        transform: `translateY(${taglineY}px)`,
      }}>
        <span style={{ fontSize: 24, fontWeight: 500, color: C.muted }}>
          Automação inteligente para seu negócio
        </span>
      </div>

      {/* CTA Button */}
      <div style={{
        position: "absolute", top: "70%", left: "50%",
        transform: `translate(-50%, 0) scale(${ctaScale})`,
      }}>
        <div style={{
          padding: "18px 52px", borderRadius: 14,
          background: `linear-gradient(135deg, ${C.brand500}, ${C.brand400})`,
          fontSize: 22, fontWeight: 700, color: "#fff",
          boxShadow: `0 0 40px ${C.brand500}50`,
        }}>
          Começar Agora
        </div>
      </div>

      {/* URL */}
      <div style={{
        position: "absolute", top: "78%", width: "100%",
        textAlign: "center", opacity: urlOpacity,
      }}>
        <span style={{ fontSize: 20, fontWeight: 600, color: C.dim }}>
          rubybot.pro
        </span>
      </div>
    </AbsoluteFill>
  );
};
